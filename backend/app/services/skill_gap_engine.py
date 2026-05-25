import json
from typing import Dict, Any
from app.services.llm_client import llm_client

class SkillGapEngine:
    async def analyze_gap(self, resume_json: Dict[str, Any], job_description: str) -> Dict[str, Any]:
        """Analyzes the gap between a candidate's skills and a job's requirements."""
        
        # First, extract required skills to check if we can actually perform the analysis
        required_skills = await llm_client.extract_required_skills(job_description)
        if not required_skills:
            return {
                "fit_score": 0,
                "present_skills": [],
                "missing_skills": [],
                "recommendations": [],
                "error": "Could not extract required skills from this job description"
            }

        system_prompt = (
            "You are a career advisor and technical recruiter. Compare the candidate's skills "
            "and experience (provided in JSON) against the job description. "
            "Identify: 1. Matching Skills, 2. Missing Skills (Critical), 3. Missing Skills (Optional/Nice-to-have), "
            "and 4. A list of 3-5 specific learning resources or project ideas to bridge the gap. "
            "Return the analysis ONLY as a JSON object. "
            "If no skills are found in the resume that match the job, show 0% fit. "
            "NEVER show 100% fit or 'meet all requirements' if the required skills list is empty or undefined."
        )
        
        user_prompt = f"Candidate Resume JSON:\n{json.dumps(resume_json)}\n\nJob Description:\n{job_description}"
        
        response = await llm_client.get_completion(system_prompt, user_prompt, max_tokens=1500)
        
        try:
            start_idx = response.find("{")
            end_idx = response.rfind("}") + 1
            if start_idx != -1 and end_idx != -1:
                return json.loads(response[start_idx:end_idx])
            return {"error": "Could not parse analysis JSON", "raw": response}
        except json.JSONDecodeError:
            return {"error": "Invalid JSON from LLM", "raw": response}

# Singleton instance
skill_gap_engine = SkillGapEngine()
