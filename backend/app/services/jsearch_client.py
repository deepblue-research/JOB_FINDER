import hashlib
import json
import asyncio
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.job import CachedJob
from app.utils.job_utils import clean_location

class JSearchClient:
    def __init__(self):
        self.base_url = f"https://{settings.JSEARCH_API_HOST}"
        self.headers = {
            "X-RapidAPI-Key": settings.JSEARCH_API_KEY,
            "X-RapidAPI-Host": settings.JSEARCH_API_HOST
        }
        self.cache_expiry_hours = 24

    def _generate_query_hash(self, query: str, page: int, remote: bool, employment_types: str) -> str:
        """Creates a unique hash for a specific search combination."""
        hash_input = f"{query}:{page}:{remote}:{employment_types}"
        return hashlib.sha256(hash_input.encode()).hexdigest()

    async def search_jobs(
        self, 
        db: AsyncSession,
        role: str = "Software Engineer",
        location: str = "India",
        page: int = 1,
        num_pages: int = 1,
        remote_jobs_only: bool = False,
        employment_types: str = "FULLTIME"
    ) -> List[Dict[str, Any]]:
        """
        Runs multiple targeted India-specific queries in parallel and deduplicates results.
        """
        INDIA_QUERIES = [
            f"{role} fresher {location}",
            f"{role} entry level Bangalore",
            f"{role} entry level Mumbai",
            f"{role} 0-2 years India",
        ]
        
        # Take top 3 queries
        queries_to_run = INDIA_QUERIES[:3]
        
        async def fetch_one_query(query: str):
            query_hash = self._generate_query_hash(query, page, remote_jobs_only, employment_types)
            
            # 1. Check cache
            result = await db.execute(select(CachedJob).where(CachedJob.query_hash == query_hash))
            cached_entry = result.scalar_one_or_none()
            if cached_entry:
                if datetime.utcnow() - cached_entry.fetched_at < timedelta(hours=self.cache_expiry_hours):
                    return cached_entry.results_json.get("data", [])

            # 2. Call API
            params = {
                "query": query,
                "page": str(page),
                "num_pages": str(num_pages),
                "remote_jobs_only": str(remote_jobs_only).lower(),
                "employment_types": employment_types
            }
            
            async with httpx.AsyncClient() as client:
                try:
                    response = await client.get(
                        f"{self.base_url}/search", 
                        headers=self.headers, 
                        params=params,
                        timeout=15.0
                    )
                    response.raise_for_status()
                    data = response.json()
                    job_list = data.get("data", [])
                    
                    # Store in cache
                    if cached_entry:
                        cached_entry.results_json = data
                        cached_entry.fetched_at = datetime.utcnow()
                    else:
                        new_cache = CachedJob(
                            query_hash=query_hash,
                            results_json=data,
                            fetched_at=datetime.utcnow()
                        )
                        db.add(new_cache)
                    
                    return job_list
                except Exception as e:
                    print(f"JSearch Error for '{query}': {e}")
                    return cached_entry.results_json.get("data", []) if cached_entry else []

        # Run queries in parallel
        results = await asyncio.gather(*[fetch_one_query(q) for q in queries_to_run])
        
        # Combine and Deduplicate
        all_jobs = []
        seen_ids = set()
        
        for job_list in results:
            for job in job_list:
                job_id = job.get("job_id")
                if job_id and job_id not in seen_ids:
                    seen_ids.add(job_id)
                    # Normalize location
                    loc = clean_location([
                        job.get('job_city'),
                        job.get('job_state'),
                        job.get('job_country')
                    ])
                    job['job_city'] = loc
                    all_jobs.append(job)
        
        await db.commit()
        return all_jobs

    async def get_job_details(self, job_id: str) -> Optional[Dict[str, Any]]:
        """Fetches detailed information for a single job."""
        params = {"job_id": job_id}
        
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(
                    f"{self.base_url}/job-details",
                    headers=self.headers,
                    params=params,
                    timeout=10.0
                )
                response.raise_for_status()
                data = response.json()
                results = data.get("data", [])
                return results[0] if results else None
            except Exception as e:
                print(f"Error fetching job details: {e}")
                return None

# Singleton instance
jsearch_client = JSearchClient()
