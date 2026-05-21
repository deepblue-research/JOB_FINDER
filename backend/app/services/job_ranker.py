from typing import List, Dict, Any

class JobRanker:
    async def rank_jobs(self, resume_keywords: Any, jobs: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Ranks a list of jobs based on their similarity to the user's resume.
        Currently returns jobs with a default match score as embeddings are disabled.
        """
        if not jobs:
            return []

        ranked_jobs = []
        for job in jobs:
            job_copy = job.copy()
            # Default score of 0.0 for now
            job_copy['match_score'] = 0.0
            ranked_jobs.append(job_copy)

        return ranked_jobs

# Singleton instance
job_ranker = JobRanker()
