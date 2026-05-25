import httpx
import json
from typing import Dict, Any, List, Union
from app.config import settings

class LLMClient:
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        self.base_url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"

    async def get_completion(self, system_prompt: str, user_prompt: str, max_tokens: int = 1000, json_mode: bool = False) -> str:
        """Sends a prompt to Gemini and returns the response text."""
        if not self.api_key:
            return "Error: Gemini API Key not configured."

        payload = {
            "contents": [{
                "parts": [{
                    "text": f"{system_prompt}\n\n{user_prompt}"
                }]
            }],
            "generationConfig": {
                "maxOutputTokens": max_tokens,
                "temperature": 0.1
            }
        }

        # Enable JSON mode if requested
        if json_mode:
            payload["generationConfig"]["responseMimeType"] = "application/json"

        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(
                    f"{self.base_url}?key={self.api_key}",
                    json=payload,
                    timeout=30.0
                )
                response.raise_for_status()
                data = response.json()
                
                if "candidates" in data and len(data["candidates"]) > 0:
                    return data["candidates"][0]["content"]["parts"][0]["text"]
                return f"Error: Unexpected response format from Gemini: {data}"
            except Exception as e:
                print(f"Gemini LLM Error: {e}")
                return f"Error communicating with Gemini: {str(e)}"

    async def parse_resume(self, raw_text: str) -> Dict[str, Any]:
        """Uses Gemini to convert raw resume text into structured JSON."""
        system_prompt = (
            "You are a professional resume parser. Extract information from the provided resume text "
            "into a clean JSON format. Include fields for: name, contact_info, skills (list of strings), "
            "experience (list of objects with company, title, duration, responsibilities), "
            "education (list of objects with institution, degree, year), and a summary. "
            "Return ONLY the JSON object."
        )
        user_prompt = f"Resume Text:\n{raw_text}"
        response = await self.get_completion(system_prompt, user_prompt, max_tokens=2000, json_mode=True)
        return json.loads(response)

    async def extract_required_skills(self, job_description: str) -> List[str]:
        """Extracts key required skills from a job description."""
        print(f"DEBUG: Extracting skills from description length: {len(job_description)}")
        system_prompt = "Extract a list of technical skills and requirements from this job description. Return ONLY a JSON list of strings."
        user_prompt = f"Job Description:\n{job_description}"
        response = await self.get_completion(system_prompt, user_prompt, max_tokens=500, json_mode=True)
        
        print(f"DEBUG: Raw LLM response for skills: {response}")
        
        try:
            skills = json.loads(response)
            if not skills or not isinstance(skills, list):
                return self._fallback_skill_extraction(job_description)
            return skills
        except Exception as e:
            print(f"DEBUG: JSON parse error in extract_required_skills: {e}")
            return self._fallback_skill_extraction(job_description)

    def _fallback_skill_extraction(self, text: str) -> List[str]:
        """Fallback to extract known skills using regex if LLM fails."""
        known_skills = [
            "python", "javascript", "typescript", "java", "react", "angular", "vue", 
            "node", "express", "fastapi", "flask", "django", "postgresql", "mongodb", 
            "sql", "nosql", "aws", "azure", "gcp", "docker", "kubernetes", "git", 
            "machine learning", "data science", "nlp", "ai", "css", "html", "rest api"
        ]
        text_lower = text.lower()
        found = [skill for skill in known_skills if skill in text_lower]
        print(f"DEBUG: Fallback extraction found: {found}")
        return found

    async def generate_skill_gap(self, user_skills: List[str], required_skills: List[str], missing_skills: List[str]) -> Dict[str, Any]:
        """Generates a detailed skill gap analysis and recommendations."""
        system_prompt = (
            "You are a career advisor. Given the user's skills and the job's required/missing skills, "
            "provide matching_skills, missing_skills, and recommendations (upskilling plan). "
            "Return ONLY a JSON object."
        )
        user_prompt = f"User Skills: {user_skills}\nRequired: {required_skills}\nMissing: {missing_skills}"
        response = await self.get_completion(system_prompt, user_prompt, max_tokens=1000, json_mode=True)
        return json.loads(response)

    def _extract_json(self, text: str) -> Any:
        """Helper to extract JSON content from text blocks (Fallback)."""
        try:
            start_idx = text.find("{")
            if start_idx == -1: start_idx = text.find("[")
            
            end_idx = text.rfind("}")
            if end_idx == -1: end_idx = text.rfind("]")
            
            if start_idx != -1 and end_idx != -1:
                json_str = text[start_idx : end_idx + 1]
                return json.loads(json_str)
            return {"error": "No JSON found", "raw": text}
        except Exception:
            return {"error": "Invalid JSON", "raw": text}

# Singleton instance
llm_client = LLMClient()
