import os
import asyncpg
from fastapi import APIRouter, HTTPException
from services.ats_scorer import score_resume
from services.gemini_service import generate_l2_questions
import pdfplumber
from docx import Document

router = APIRouter()

def extract_text(file_path: str) -> str:
    if file_path.endswith(".pdf"):
        with pdfplumber.open(file_path) as pdf:
            return "\n".join(page.extract_text() or "" for page in pdf.pages)
    elif file_path.endswith(".docx"):
        doc = Document(file_path)
        return "\n".join(p.text for p in doc.paragraphs)
    return ""

@router.get("/{session_id}")
async def get_ats_score(session_id: str):
    try:
        conn = await asyncpg.connect(os.getenv("ENRICHMENT_DATABASE_URL"))
        row = await conn.fetchrow(
            "SELECT resume_path FROM enrichment_sessions WHERE session_id = $1",
            session_id
        )
        if not row or not row["resume_path"]:
            raise HTTPException(status_code=404, detail="Resume not found for this session")

        # Extract resume text for grounding Gemini's questions
        resume_text = extract_text(row["resume_path"])

        # Run ATS scorer
        result = await score_resume(row["resume_path"])

        # Generate follow-up questions grounded in the actual resume
        questions = await generate_l2_questions(result["weak_areas"], result["tips"], resume_text)

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