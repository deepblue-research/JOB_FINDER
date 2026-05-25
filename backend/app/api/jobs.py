from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Any
import asyncio
import hashlib

from app.database import get_db
from app.services.jsearch_client import jsearch_client
from app.services.job_ranker import job_ranker
from app.services.ingestion import greenhouse, lever, ashby
from app.services.adzuna_client import adzuna_client
from app.utils.redis_client import redis_client
from app.models.user import User
from app.models.resume import Resume
from app.models.preference import Preferences
from sqlalchemy import select
from uuid import UUID
from sqlalchemy.orm import selectinload

from app.api.auth import oauth2_scheme
from app.utils.auth_utils import verify_token

router = APIRouter()

import random

INDIAN_GREENHOUSE_COMPANIES = [
    "razorpay", "browserstack", "postman", "freshworks",
    "chargebee", "cleartax", "darwinbox", "groww",
    "zerodha", "physicswallah", "unacademy", "vedantu",
    "meesho", "dunzo", "mfine", "healthifyme"
]

from app.utils.skill_utils import extract_skills_fallback

@router.get("/recommendations")
async def get_recommendations(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
):
    """Fetch jobs from JSearch, Adzuna, and live Indian Greenhouse sources, then rank them."""
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

    # 2. Extract Context & Skills
    pref = user.preferences
    role = pref.desired_role if pref else "Software Engineer"
    location = pref.desired_location if (pref and pref.desired_location) else "India"
    
    # Improved Skills Extraction with Fallback
    user_skills = []
    if user.resume:
        pj = user.resume.parsed_json or {}
        print(f"DIAGNOSTIC - All keys: {list(pj.keys())}")
        
        user_skills = (
            pj.get('skills') or
            pj.get('technical_skills') or
            pj.get('key_skills') or
            pj.get('core_skills') or
            pj.get('technologies') or
            extract_skills_fallback(user.resume.raw_text or '') or
            []
        )
        
        # Handle if skills is a string instead of a list
        if isinstance(user_skills, str):
            user_skills = [s.strip() for s in user_skills.split(',')]
        
        print(f"FINAL user_skills (top 5): {user_skills[:5]}")
    
    # 3. Parallel Fetching with Random Variety
    selected_gh_companies = random.sample(
        INDIAN_GREENHOUSE_COMPANIES,
        min(5, len(INDIAN_GREENHOUSE_COMPANIES))
    )

    async def fetch_gh_safely():
        tasks = [asyncio.to_thread(greenhouse.fetch_jobs, slug) for slug in selected_gh_companies]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        jobs = []
        for res in results:
            if isinstance(res, list):
                jobs.extend(res)
            elif isinstance(res, Exception):
                print(f"Greenhouse individual fetch error: {res}")
        return jobs

    # Concurrency
    tasks = {
        "jsearch": jsearch_client.search_jobs(db, role=role, location=location),
        "adzuna": adzuna_client.fetch_jobs(role, location),
        "greenhouse": fetch_gh_safely()
    }
    
    source_results = await asyncio.gather(*tasks.values(), return_exceptions=True)
    source_map = dict(zip(tasks.keys(), source_results))
    
    jsearch_jobs = source_map.get("jsearch") if not isinstance(source_map.get("jsearch"), Exception) else []
    adzuna_jobs = source_map.get("adzuna") if not isinstance(source_map.get("adzuna"), Exception) else []
    gh_jobs = source_map.get("greenhouse") if not isinstance(source_map.get("greenhouse"), Exception) else []
    
    if isinstance(source_map.get("jsearch"), Exception): print(f"JSearch global error: {source_map['jsearch']}")
    if isinstance(source_map.get("adzuna"), Exception): print(f"Adzuna global error: {source_map['adzuna']}")

    # 4. Combine and Deduplicate
    all_raw_jobs = jsearch_jobs + adzuna_jobs + gh_jobs
    
    unique_jobs = []
    seen_hashes = set()
    
    for job in all_raw_jobs:
        title = (job.get("job_title") or job.get("title") or "").lower()
        company = (job.get("employer_name") or job.get("company") or "").lower()
        job_hash = hashlib.md5(f"{title}{company}".encode()).hexdigest()
        
        if job_hash not in seen_hashes:
            seen_hashes.add(job_hash)
            
            # Map common fields for consistency
            mapped_job = job.copy()
            mapped_job['job_title'] = job.get('job_title') or job.get('title')
            mapped_job['employer_name'] = job.get('employer_name') or job.get('company')
            mapped_job['job_apply_link'] = job.get('job_apply_link') or job.get('apply_url')
            mapped_job['job_city'] = job.get('job_city') or job.get('location')
            mapped_job['job_description'] = job.get('job_description') or job.get('description')
            
            if 'job_id' not in mapped_job: mapped_job['job_id'] = f"gen_{job_hash[:12]}"
            
            unique_jobs.append(mapped_job)
            
            # Cache for details lookup
            redis_client.set_job(mapped_job['job_id'], mapped_job)

    # 5. Rank and return top 20
    ranked_jobs = await job_ranker.rank_jobs(user_skills, unique_jobs, user_preferences=user.preferences)
    
    return {"jobs": ranked_jobs[:20]}

@router.get("/details/{job_id}")
async def get_job_details(job_id: str):
    """Fetch detailed information for a single job."""
    # 1. Check Redis (for cached jobs from all sources)
    cached_job = redis_client.get_job(job_id)
    if cached_job:
        return cached_job

    # 2. Check JSearch (Fallback)
    job = await jsearch_client.get_job_details(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job details not found")
    return job
