from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID
from datetime import datetime

from app.database import get_db
from app.models.resume import Resume
from app.services.resume_parser import resume_parser
from app.services.ats_scorer import ats_scorer
from app.api.auth import oauth2_scheme
from app.utils.auth_utils import verify_token

from fastapi.responses import Response, FileResponse
import os
from pathlib import Path

router = APIRouter()

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

@router.post("/upload")
async def upload_resume(
    file: UploadFile = File(...), 
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
):
    """Processes an uploaded resume: Extracts text, parses JSON, and scores ATS."""
    user_id_str = verify_token(token)
    user_id = UUID(user_id_str)
    
    # Save file to disk
    file_path = UPLOAD_DIR / f"{user_id}_{file.filename}"
    with open(file_path, "wb") as buffer:
        content = await file.read()
        buffer.write(content)
    
    # 1. Extract raw text
    raw_text = resume_parser.extract_text(content, file.filename)
    if not raw_text:
        raise HTTPException(status_code=400, detail="Could not extract text from file")

    # 2. Parse to JSON using LLM
    parsed_json = await resume_parser.parse_to_json(raw_text)

    # 3. Score for ATS
    ats_result = await ats_scorer.calculate_score(raw_text)

    # 4. Extract Skills/Keywords (Placeholder for now)
    skills_keywords = {"skills": parsed_json.get("skills", [])}

    # 5. Save to Database
    result = await db.execute(select(Resume).where(Resume.user_id == user_id))
    resume_entry = result.scalar_one_or_none()

    if resume_entry:
        resume_entry.file_name = file.filename
        resume_entry.file_path = str(file_path)
        resume_entry.raw_text = raw_text
        resume_entry.parsed_json = parsed_json
        resume_entry.ats_score = ats_result.get("total_score")
        resume_entry.ats_tips = ats_result.get("tips")
        resume_entry.skills_keywords = skills_keywords
        resume_entry.created_at = datetime.utcnow()
    else:
        resume_entry = Resume(
            user_id=user_id,
            file_name=file.filename,
            file_path=str(file_path),
            raw_text=raw_text,
            parsed_json=parsed_json,
            ats_score=ats_result.get("total_score"),
            ats_tips=ats_result.get("tips"),
            skills_keywords=skills_keywords
        )
        db.add(resume_entry)

    await db.commit()
    
    return {
        "message": "Resume processed successfully",
        "ats_score": ats_result.get("total_score"),
        "ats_tips": ats_result.get("tips"),
        "parsed_data": parsed_json
    }

@router.get("/download")
async def download_resume(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
):
    """Serves the original resume PDF."""
    user_id_str = verify_token(token)
    user_id = UUID(user_id_str)
    
    result = await db.execute(select(Resume).where(Resume.user_id == user_id))
    resume_entry = result.scalar_one_or_none()
    
    if not resume_entry or not resume_entry.file_path:
        raise HTTPException(status_code=404, detail="Original resume file not found")
        
    if not os.path.exists(resume_entry.file_path):
        raise HTTPException(status_code=404, detail="Resume file not found on disk. Please re-upload your resume.")

    return FileResponse(
        path=resume_entry.file_path,
        media_type="application/pdf",
        filename=resume_entry.file_name or "resume.pdf"
    )

@router.get("/file")
async def get_resume_file(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
):
    """Serves the original resume PDF for inline viewing."""
    user_id_str = verify_token(token)
    user_id = UUID(user_id_str)
    
    result = await db.execute(select(Resume).where(Resume.user_id == user_id))
    resume_entry = result.scalar_one_or_none()
    
    if not resume_entry or not resume_entry.file_path:
        raise HTTPException(status_code=404, detail="Resume file not found. Please re-upload your resume.")
        
    if not os.path.exists(resume_entry.file_path):
        raise HTTPException(status_code=404, detail="Resume file not found on disk. Please re-upload your resume.")

    return FileResponse(
        path=resume_entry.file_path,
        media_type="application/pdf"
    )

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
