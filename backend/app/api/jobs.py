from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Any
from app.database import get_db
from app.services.jsearch_client import jsearch_client
from app.services.job_ranker import job_ranker
from app.models.user import User
from app.models.resume import Resume
from app.models.preference import Preferences
from sqlalchemy import select
from uuid import UUID
from sqlalchemy.orm import selectinload

from app.api.auth import oauth2_scheme
from app.utils.auth_utils import verify_token

router = APIRouter()

@router.get("/search")
async def search_jobs(
    query: str,
    page: int = 1,
    remote: bool = False,
    employment_types: str = "FULLTIME",
    db: AsyncSession = Depends(get_db)
):
    """Search for jobs using the JSearch client (with caching)."""
    jobs = await jsearch_client.search_jobs(
        db=db,
        query=query,
        page=page,
        remote_jobs_only=remote,
        employment_types=employment_types
    )
    return {"jobs": jobs}

@router.get("/recommendations")
async def get_recommendations(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
):
    """Fetch jobs and rank them based on the user's resume."""
    user_id_str = verify_token(token)
    user_id = UUID(user_id_str)

    # 1. Get user with preferences and resume
    result = await db.execute(
        select(User)
        .options(selectinload(User.preferences), selectinload(User.resume))
        .where(User.id == user_id)
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if not user.resume:
        raise HTTPException(status_code=400, detail="Resume not found. Please upload a resume first.")

    # 2. Get preferred search query
    pref = user.preferences
    search_query = f"{pref.desired_role} in {pref.desired_location}" if pref else "Software Engineer"
    
    # 3. Search for jobs
    jobs = await jsearch_client.search_jobs(db, query=search_query)
    
    # 4. Rank them
    ranked_jobs = await job_ranker.rank_jobs(user.resume.skills_keywords, jobs)
    
    return {"jobs": ranked_jobs}

@router.get("/details/{job_id}")
async def get_job_details(job_id: str):
    """Fetch detailed information for a single job."""
    job = await jsearch_client.get_job_details(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job
