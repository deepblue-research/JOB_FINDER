from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID
from datetime import datetime

from app.database import get_db
from app.models.resume import Resume
from app.services.resume_parser import resume_parser
from app.services.ats_scorer import ats_scorer
from app.services.embedder import embedder
from app.api.auth import oauth2_scheme
from app.utils.auth_utils import verify_token

router = APIRouter()

@router.post("/upload")
async def upload_resume(
    file: UploadFile = File(...), 
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
):
    """Processes an uploaded resume: Extracts text, parses JSON, scores ATS, and embeds."""
    user_id_str = verify_token(token)
    user_id = UUID(user_id_str)
    
    content = await file.read()
    
    # 1. Extract raw text
    raw_text = resume_parser.extract_text(content, file.filename)
    if not raw_text:
        raise HTTPException(status_code=400, detail="Could not extract text from file")

    # 2. Parse to JSON using LLM
    parsed_json = await resume_parser.parse_to_json(raw_text)

    # 3. Score for ATS
    ats_result = await ats_scorer.calculate_score(raw_text)

    # 4. Generate Embedding
    embedding = embedder.get_embedding(raw_text)

    # 5. Save to Database
    result = await db.execute(select(Resume).where(Resume.user_id == user_id))
    resume_entry = result.scalar_one_or_none()

    if resume_entry:
        resume_entry.raw_text = raw_text
        resume_entry.parsed_json = parsed_json
        resume_entry.ats_score = ats_result.get("total_score")
        resume_entry.embedding = embedding
        resume_entry.created_at = datetime.utcnow()
    else:
        resume_entry = Resume(
            user_id=user_id,
            raw_text=raw_text,
            parsed_json=parsed_json,
            ats_score=ats_result.get("total_score"),
            embedding=embedding
        )
        db.add(resume_entry)

    await db.commit()
    
    return {
        "message": "Resume processed successfully",
        "ats_score": ats_result.get("total_score"),
        "ats_tips": ats_result.get("tips"),
        "parsed_data": parsed_json
    }

@router.get("/")
async def get_resume(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
):
    user_id_str = verify_token(token)
    user_id = UUID(user_id_str)
    
    result = await db.execute(select(Resume).where(Resume.user_id == user_id))
    resume_entry = result.scalar_one_or_none()
    if not resume_entry:
        raise HTTPException(status_code=404, detail="Resume not found")
    return resume_entry
