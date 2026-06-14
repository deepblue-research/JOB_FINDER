import os
import asyncpg
from fastapi import APIRouter, HTTPException
from services.ats_scorer import score_resume
from services.gemini_service import generate_l2_questions

router = APIRouter()

@router.get("/{session_id}")
async def get_ats_score(session_id: str):
    try:
        # Step 1 — get the resume path from the database
        conn = await asyncpg.connect(os.getenv("ENRICHMENT_DATABASE_URL"))
        row = await conn.fetchrow(
            "SELECT resume_path FROM enrichment_sessions WHERE session_id = $1",
            session_id
        )

        if not row or not row["resume_path"]:
            raise HTTPException(status_code=404, detail="Resume not found for this session")

        # Step 2 — run the ATS scorer
        result = await score_resume(row["resume_path"])

        # Step 3 — generate follow-up questions based on weak areas
        questions = await generate_l2_questions(result["weak_areas"], result["tips"])

        # Step 4 — save everything to the database
        import json
        await conn.execute(
            "UPDATE enrichment_sessions SET ats_score = $1, ats_breakdown = $2, l2_questions = $3 WHERE session_id = $4",
            result["total_score"],
            json.dumps(result),
            json.dumps(questions),
            session_id
        )
        await conn.close()

        return {
            "session_id": session_id,
            "ats_result": result,
            "followup_questions": questions
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))