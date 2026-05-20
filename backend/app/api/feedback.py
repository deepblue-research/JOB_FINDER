import hashlib
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from datetime import datetime

from app.database import get_db
from app.models.feedback import Feedback
from app.api.auth import oauth2_scheme
from app.utils.auth_utils import verify_token

router = APIRouter()

@router.post("/")
async def post_feedback(
    job_id: str,
    rating: int, # 1-5
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
):
    """Saves user feedback for a specific job match."""
    user_id_str = verify_token(token)
    user_id = UUID(user_id_str)
    
    job_hash = hashlib.sha256(job_id.encode()).hexdigest()
    
    new_feedback = Feedback(
        user_id=user_id,
        job_hash=job_hash,
        rating=rating
    )
    db.add(new_feedback)
    await db.commit()
    
    return {"message": "Feedback submitted successfully"}
