import hashlib
import traceback
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID
from pydantic import BaseModel

from app.database import get_db
from app.models.resume import Resume
from app.models.skill_gap import SkillGapCache
from app.services.skill_gap_engine import skill_gap_engine
from app.services.llm_client import llm_client
from app.api.auth import oauth2_scheme
from app.utils.auth_utils import verify_token

router = APIRouter()

class SkillGapRequest(BaseModel):
    job_hash: str
    job_description: str = ""

@router.post("/analyze")
async def analyze_skill_gap(
    request: SkillGapRequest,
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
):
    """Analyzes the skill gap for a specific user and job. Fail-safe."""
    try:
        user_id_str = verify_token(token)
        user_id = UUID(user_id_str)
        
        # 1. Check cache first
        result = await db.execute(
            select(SkillGapCache).where(
                SkillGapCache.user_id == user_id,
                SkillGapCache.job_hash == request.job_hash
            )
        )
        cache_entry = result.scalar_one_or_none()
        if cache_entry:
            return cache_entry.gap_json

        # 2. Get user resume
        result = await db.execute(select(Resume).where(Resume.user_id == user_id))
        resume_entry = result.scalar_one_or_none()
        if not resume_entry or not resume_entry.parsed_json:
            return {
                "fit_score": 0,
                "present_skills": [],
                "missing_skills": [{"skill": "Resume", "why_needed": "Please upload a parsed resume first"}],
                "error": "Resume not found"
            }

        # 3. Attempt AI Analysis
        try:
            analysis = await skill_gap_engine.analyze_gap(resume_entry.parsed_json, request.job_description)
            
            # Handle fit_score normalization
            if "fit_score" in analysis:
                score = analysis["fit_score"]
                if 0 < score <= 1.0:
                    analysis["fit_score"] = int(score * 100)
            
            # If AI returned an error but we have the description, trigger fallback
            if "error" in analysis and request.job_description:
                print(f"DEBUG: AI Analysis failed ({analysis.get('error')}), using fallback.")
                raise Exception("Trigger Fallback")
                
        except Exception as e:
            # 4. Fallback Extraction (Local logic)
            print(f"DEBUG: Skill Gap Fallback triggered. Reason: {e}")
            
            # Extract skills using fallback logic in llm_client
            required = llm_client._fallback_skill_extraction(request.job_description)
            user_skills = resume_entry.parsed_json.get("skills", [])
            user_skills_lower = [s.lower() for s in user_skills]
            
            present = [s for s in required if s.lower() in user_skills_lower]
            missing = [s for s in required if s.lower() not in user_skills_lower]
            
            fit_score = int((len(present) / len(required) * 100)) if required else 0
            
            analysis = {
                "fit_score": fit_score,
                "present_skills": present,
                "missing_skills": [{"skill": s, "importance": "Required"} for s in missing],
                "recommendations": [f"Gain experience in {s}" for s in missing[:3]],
                "is_fallback": True
            }

        # 5. Cache and return
        new_cache = SkillGapCache(
            user_id=user_id,
            job_hash=request.job_hash,
            gap_json=analysis
        )
        db.add(new_cache)
        await db.commit()

        return analysis

    except Exception as e:
        print("!!! SKILL GAP CRITICAL ERROR !!!")
        traceback.print_exc()
        return {
            "fit_score": 0,
            "error": f"An unexpected error occurred: {str(e)}",
            "present_skills": [],
            "missing_skills": []
        }
