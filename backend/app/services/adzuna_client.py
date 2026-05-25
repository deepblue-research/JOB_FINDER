import httpx
import hashlib
from typing import List, Dict, Any
from app.config import settings

class AdzunaClient:
    def __init__(self):
        self.app_id = settings.ADZUNA_APP_ID
        self.app_key = settings.ADZUNA_APP_KEY
        self.base_url = "https://api.adzuna.com/v1/api/jobs/in/search/1"

    async def fetch_jobs(self, role: str, location: str = "India") -> List[Dict[str, Any]]:
        if not self.app_id or not self.app_key:
            print("Adzuna credentials missing")
            return []

        params = {
            "app_id": self.app_id,
            "app_key": self.app_key,
            "results_per_page": 20,
            "what": role,
            "where": location,
            "content-type": "application/json"
        }

        async with httpx.AsyncClient() as client:
            try:
                resp = await client.get(self.base_url, params=params, timeout=15.0)
                if resp.status_code != 200:
                    return []
                results = resp.json().get("results", [])
                
                jobs = []
                for j in results:
                    company_name = j.get("company", {}).get("display_name", "")
                    title = j.get("title", "")
                    # Generate a unique hash for deduplication
                    job_hash = hashlib.md5(f"{title}{company_name}".lower().encode()).hexdigest()
                    
                    jobs.append({
                        "job_id": f"adz_{job_hash[:12]}",
                        "job_title": title,
                        "employer_name": company_name,
                        "job_city": j.get("location", {}).get("display_name", ""),
                        "job_description": j.get("description", ""),
                        "job_apply_link": j.get("redirect_url", ""),
                        "job_source": "Adzuna India",
                        "salary": j.get("salary_min"),
                        "job_hash": job_hash
                    })
                return jobs
            except Exception as e:
                print(f"Adzuna Fetch Error: {e}")
                return []

# Singleton instance
adzuna_client = AdzunaClient()
