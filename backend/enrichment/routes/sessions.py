import os
import asyncpg
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from docx import Document

router = APIRouter()

@router.post("/")
async def create_session():
    try:
        conn = await asyncpg.connect(os.getenv("ENRICHMENT_DATABASE_URL"))
        row = await conn.fetchrow(
            "INSERT INTO enrichment_sessions DEFAULT VALUES RETURNING session_id"
        )
        await conn.close()
        return {"session_id": str(row["session_id"])}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class SeedRequest(BaseModel):
    session_id: str
    raw_text: str

@router.post("/seed")
async def seed_session(request: SeedRequest):
    try:
        # Save raw text as a plain .docx file
        output_dir = "outputs"
        os.makedirs(output_dir, exist_ok=True)
        output_path = os.path.join(output_dir, f"{request.session_id}_seeded.docx")

        doc = Document()
        for line in request.raw_text.split("\n"):
            doc.add_paragraph(line)
        doc.save(output_path)

        # Update the enrichment session with this resume path
        conn = await asyncpg.connect(os.getenv("ENRICHMENT_DATABASE_URL"))
        await conn.execute(
            "UPDATE enrichment_sessions SET resume_path = $1, resume_text = $2 WHERE session_id = $3",
            output_path,
            request.raw_text,
            request.session_id
        )
        await conn.close()

        return {"status": "ok", "resume_path": output_path}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))