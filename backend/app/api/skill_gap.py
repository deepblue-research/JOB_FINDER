import hashlib
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID

from app.database import get_db
from app.models.resume import Resume
from app.models.skill_gap import SkillGapCache
from app.services.skill_gap_engine import skill_gap_engine
from app.api.auth import oauth2_scheme
from app.utils.auth_utils import verify_token

router = APIRouter()

@router.post("/analyze")
async def analyze_skill_gap(
    job_id: str, # JSearch job_id
    job_description: str,
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
):
    """Analyzes the skill gap for a specific user and job."""
    user_id_str = verify_token(token)
    user_id = UUID(user_id_str)
    
    # 1. Check cache
    job_hash = hashlib.sha256(job_id.encode()).hexdigest()
    result = await db.execute(
        select(SkillGapCache).where(
            SkillGapCache.user_id == user_id,
            SkillGapCache.job_hash == job_hash
        )
    )
    cache_entry = result.scalar_one_or_none()
    if cache_entry:
        return cache_entry.gap_json

    # 2. Get user resume
    result = await db.execute(select(Resume).where(Resume.user_id == user_id))
    resume_entry = result.scalar_one_or_none()
    if not resume_entry or not resume_entry.parsed_json:
        raise HTTPException(status_code=400, detail="User must have a parsed resume first")

    # 3. Run analysis
    analysis = await skill_gap_engine.analyze_gap(resume_entry.parsed_json, job_description)

    # 4. Cache results
    new_cache = SkillGapCache(
        user_id=user_id,
        job_hash=job_hash,
        gap_json=analysis
    )
    db.add(new_cache)
    await db.commit()

    return analysis
