from typing import Dict, Any
from app.services.llm_client import llm_client

class ATSScorer:
    async def calculate_score(self, raw_text: str) -> Dict[str, Any]:
        """Heuristically and via LLM calculates an ATS compatibility score."""
        
        # Simple heuristic check for length
        word_count = len(raw_text.split())
        heuristic_score = 0
        if 200 < word_count < 1000:
            heuristic_score = 40
        elif word_count > 1000:
            heuristic_score = 20
        else:
            heuristic_score = 10

        system_prompt = (
            "You are an ATS (Applicant Tracking System) expert. Analyze the provided resume text for "
            "readability, keyword optimization, and formatting suitability for automated systems. "
            "Provide a score from 0-60 based on these factors and 3 specific tips for improvement. "
            "Return ONLY a JSON object with 'llm_score' and 'tips'."
        )
        
        user_prompt = f"Resume Text:\n{raw_text}"
        response = await llm_client.get_completion(system_prompt, user_prompt, max_tokens=500)

        import json
        try:
            start_idx = response.find("{")
            end_idx = response.rfind("}") + 1
            llm_data = json.loads(response[start_idx:end_idx])
            
            total_score = heuristic_score + llm_data.get('llm_score', 0)
            return {
                "total_score": min(total_score, 100),
                "breakdown": {
                    "structure_score": heuristic_score,
                    "content_score": llm_data.get('llm_score', 0)
                },
                "tips": llm_data.get('tips', [])
            }
        except:
            return {
                "total_score": heuristic_score,
                "tips": ["Could not generate detailed tips at this time."]
            }

# Singleton instance
ats_scorer = ATSScorer()
