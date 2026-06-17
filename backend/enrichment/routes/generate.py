import os
import json
import asyncpg
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel
from services.gemini_service import generate_resume
from services.resume_formatter import format_resume

router = APIRouter()

class GenerateRequest(BaseModel):
    session_id: str
    answers: dict

@router.post("/")
async def generate(request: GenerateRequest):
    try:
        # Step 1 — call Gemini to get resume JSON
        resume_json = generate_resume(request.answers)

        # Step 2 — turn that JSON into a Word document
        output_dir = os.path.join(os.path.dirname(__file__), "..", "outputs")
        output_path = os.path.join(output_dir, f"{request.session_id}.docx")
        format_resume(resume_json, output_path)

        # Step 3 — save the resume path to the database
        conn = await asyncpg.connect(os.getenv("ENRICHMENT_DATABASE_URL"))
        await conn.execute(
            "UPDATE enrichment_sessions SET answers = $1::jsonb, resume_path = $2, level_completed = 1 WHERE session_id = $3",
            json.dumps(request.answers),
            output_path,
            request.session_id
        )
        await conn.close()

        # Step 4 — return the download URL
        return {
            "message": "Resume generated successfully",
            "download_url": f"/download/{request.session_id}"
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/download/{session_id}")
async def download(session_id: str):
    try:
        output_dir = os.path.join(os.path.dirname(__file__), "..", "outputs")
        file_path = os.path.join(output_dir, f"{session_id}.docx")

        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="Resume not found")

        return FileResponse(
            path=file_path,
            filename="resume.docx",
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))