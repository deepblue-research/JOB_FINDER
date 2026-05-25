from typing import List, Dict, Any

class JobRanker:
    SENIOR_WORDS = ["senior", "lead", "principal", "manager", "staff", "director", "head"]
    FRESHER_HINTS = ["intern", "graduate", "fresher", "entry", "junior", "trainee", "associate", "0-1", "0 - 1", "new grad"]

    async def rank_jobs(self, resume_keywords_data: Any, jobs: List[Dict[str, Any]], user_preferences: Any = None) -> List[Dict[str, Any]]:
        """
        Ranks a list of jobs based on their similarity to the user's resume and preferences.
        """
        if not jobs:
            return []

        # Handle different resume_keywords formats
        if isinstance(resume_keywords_data, dict):
            user_skills = resume_keywords_data.get("skills", [])
        else:
            user_skills = resume_keywords_data or []
        
        user_skills = [str(s).strip().lower() for s in user_skills if str(s).strip()]
        
        desired_role = ""
        desired_location = ""
        if user_preferences:
            desired_role = (getattr(user_preferences, 'desired_role', "") or "").lower()
            desired_location = (getattr(user_preferences, 'desired_location', "") or "").lower()

        ranked_jobs = []
        for job in jobs:
            title = (job.get("job_title") or job.get("title") or "").lower()
            description = (job.get("job_description") or job.get("description") or "").lower()
            job_location = (job.get("job_city") or job.get("location") or "").lower()
            
            if not title and not description:
                continue

            # 1. Skill match (0-50 points)
            matched_skills = [s for s in user_skills if s and s in description]
            skill_score = 0
            if user_skills:
                skill_match_ratio = len(matched_skills) / len(user_skills)
                skill_score = min(50, skill_match_ratio * 50)

            # 2. Role match (0-30 points)
            role_score = 0
            if desired_role:
                role_words = [w for w in desired_role.split() if len(w) > 2]
                if role_words:
                    role_hits = sum(1 for w in role_words if w in title)
                    role_score = min(30, (role_hits / len(role_words)) * 30)

            # 3. Location match (0-20 points)
            location_score = 0
            if desired_location and job_location:
                if desired_location in job_location or job_location in desired_location:
                    location_score = 20

            # 4. Senior penalty (-30 points)
            senior_penalty = 0
            if any(w in title for w in self.SENIOR_WORDS):
                senior_penalty = -30

            # Final Score Calculation
            final_score = skill_score + role_score + location_score + senior_penalty
            match_percentage = min(100, max(0, final_score))

            print(f"DEBUG ranking: user has {len(user_skills)} skills")
            print(f"DEBUG: Job='{title[:30]}...' | Total={match_percentage}% [Skill={skill_score:.1f}, Role={role_score:.1f}, Loc={location_score}, Senior={senior_penalty}]")
            print(f"DEBUG job '{title[:30]}' needs: {matched_skills[:3]}") # Using matched_skills as a proxy for 'needs' since we don't extract req skills here
            print(f"DEBUG user_skills (top 5): {user_skills[:5]}")

            job_copy = job.copy()
            job_copy['match_score'] = match_percentage
            job_copy['matched_skills'] = matched_skills
            
            # Ensure frontend-friendly field names for ATS jobs
            if 'job_title' not in job_copy: job_copy['job_title'] = job.get('title')
            if 'employer_name' not in job_copy: job_copy['employer_name'] = job.get('company')
            if 'job_apply_link' not in job_copy: job_copy['job_apply_link'] = job.get('apply_url')
            if 'job_city' not in job_copy: job_copy['job_city'] = job.get('location')

            ranked_jobs.append(job_copy)

        # Sort by match score
        ranked_jobs.sort(key=lambda x: x['match_score'], reverse=True)
        return ranked_jobs

# Singleton instance
job_ranker = JobRanker()
