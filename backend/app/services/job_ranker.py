from typing import List, Dict, Any
from app.services.embedder import embedder

class JobRanker:
    async def rank_jobs(self, resume_embedding: List[float], jobs: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Ranks a list of jobs based on their similarity to the resume embedding."""
        if not resume_embedding or not jobs:
            return jobs

        ranked_jobs = []
        
        # Prepare job texts for embedding (Title + Description)
        job_texts = []
        for job in jobs:
            text = f"{job.get('job_title', '')} {job.get('job_description', '')}"
            job_texts.append(text)

        # Generate embeddings for all jobs in batch
        job_embeddings = embedder.get_embeddings(job_texts)

        # Calculate scores and attach to job objects
        for i, job in enumerate(jobs):
            score = embedder.cosine_similarity(resume_embedding, job_embeddings[i])
            job_copy = job.copy()
            job_copy['match_score'] = round(score * 100, 2) # Percentage score
            ranked_jobs.append(job_copy)

        # Sort by score descending
        ranked_jobs.sort(key=lambda x: x['match_score'], reverse=True)
        
        return ranked_jobs

# Singleton instance
job_ranker = JobRanker()
