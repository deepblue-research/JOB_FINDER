import os
import json
import asyncpg
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.gemini_service import improve_resume
from services.resume_formatter import format_resume
from services.ats_scorer import score_resume

router = APIRouter()

class ImproveRequest(BaseModel):
    session_id: str
    l2_answers: dict

@router.post("/")
async def improve(request: ImproveRequest):
    try:
        # Step 1 — get the original answers from the database
        conn = await asyncpg.connect(os.getenv("ENRICHMENT_DATABASE_URL"))
        row = await conn.fetchrow(
            "SELECT answers FROM enrichment_sessions WHERE session_id = $1",
            request.session_id
        )

        if not row or not row["answers"]:
            raise HTTPException(status_code=404, detail="Original answers not found for this session")

        original_answers = json.loads(row["answers"])

        # Step 2 — call Gemini with original + new answers
        improved_resume_json = improve_resume(original_answers, request.l2_answers)

        # Step 3 — format into a Word document
        output_dir = os.path.join(os.path.dirname(__file__), "..", "outputs")
        output_path = os.path.join(output_dir, f"{request.session_id}_improved.docx")
        format_resume(improved_resume_json, output_path)

        # Step 4 — run ATS score on the improved resume
        new_ats = await score_resume(output_path)

        # Step 5 — save everything to the database
        await conn.execute(
            "UPDATE enrichment_sessions SET improved_resume_path = $1, ats_score = $2, level_completed = 2 WHERE session_id = $3",
            output_path,
            new_ats["total_score"],
            request.session_id
        )
        await conn.close()

        return {
            "message": "Resume improved successfully",
            "download_url": f"/improve/download/{request.session_id}",
            "new_ats_score": new_ats["total_score"],
            "new_ats_label": new_ats["label"]
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/download/{session_id}")
async def download_improved(session_id: str):
    try:
        output_dir = os.path.join(os.path.dirname(__file__), "..", "outputs")
        file_path = os.path.join(output_dir, f"{session_id}_improved.docx")

        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="Improved resume not found")

        from fastapi.responses import FileResponse
        return FileResponse(
            path=file_path,
            filename="resume_improved.docx",
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))