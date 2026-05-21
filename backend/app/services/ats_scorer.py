import re
import json
from typing import Dict, Any
from app.services.llm_client import llm_client

class ATSScorer:
    async def calculate_score(self, raw_text: str) -> Dict[str, Any]:
        """
        A Hybrid ATS Engine: Combines hard data heuristics with LLM qualitative analysis.
        Mimics professional systems like Taleo/Greenhouse.
        """
        text_lower = raw_text.lower()
        
        # 1. TECHNICAL HEURISTICS (Baseline: 40 points)
        # These are facts: does the data exist?
        tech_score = 0
        issues = []
        
        # Section Check
        sections = {'education': 5, 'experience': 10, 'skills': 5, 'projects': 5}
        for section, weight in sections.items():
            if section in text_lower:
                tech_score += weight
            else:
                issues.append(f"Technical: Missing '{section.title()}' header")
        
        # Contact Info
        if re.search(r'[\w.-]+@[\w.-]+\.\w+', raw_text): tech_score += 10
        else: issues.append("Technical: Contact email not found")
        
        if re.search(r'[\+\d][\d\s\-\(\)]{8,}', raw_text): tech_score += 5
        else: issues.append("Technical: Phone number not found")

        # 2. LLM QUALITATIVE ANALYSIS (Content: 60 points)
        # Gemini evaluates the 'human' and 'semantic' side
        system_prompt = (
            "You are a sophisticated ATS (Applicant Tracking System) simulation engine. "
            "Analyze the provided resume text for content quality, impact, and semantic depth. "
            "Evaluate based on these 3 criteria (0-20 each): "
            "1. Impact: Use of action verbs and the 'X-Y-Z' formula (Achieved [X] as measured by [Y], by doing [Z]). "
            "2. Relevance: Semantic density of modern technical keywords. "
            "3. Structure: Readability for parsers (avoidance of non-standard characters/complex layouts). "
            "Return ONLY a JSON object with: "
            "'impact_score' (0-20), 'keyword_score' (0-20), 'structure_score' (0-20), "
            "'specific_improvements' (list of 3 unique, critical findings based ONLY on this text)."
        )
        
        user_prompt = f"Resume Content:\n{raw_text[:4000]}" # Truncate for efficiency
        
        try:
            response = await llm_client.get_completion(system_prompt, user_prompt, max_tokens=1000, json_mode=True)
            analysis = json.loads(response)
            
            qual_score = (
                analysis.get('impact_score', 0) + 
                analysis.get('keyword_score', 0) + 
                analysis.get('structure_score', 0)
            )
            llm_tips = analysis.get('specific_improvements', [])
        except Exception as e:
            print(f"Qualitative Analysis Error: {e}")
            qual_score = 20 # Fallback
            llm_tips = ["Optimize your bullet points with quantifiable metrics."]

        # 3. FINAL AGGREGATION
        total_score = round(tech_score + qual_score)
        
        # Qualitative Banding
        if total_score >= 85: label = "Top Tier — Fully ATS-Optimized"
        elif total_score >= 70: label = "Professional — Strong Structure"
        elif total_score >= 55: label = "Functional — Needs Keywords/Impact"
        elif total_score >= 40: label = "Entry Level — Needs Significant Work"
        else: label = "Critical — Format/Data Errors Detected"

        return {
            "total_score": min(total_score, 100),
            "label": label,
            "issues": issues, # Technical missing pieces
            "tips": [label] + llm_tips + (issues[:2] if len(issues) > 0 else []),
            "breakdown": {
                "technical_data": tech_score,
                "qualitative_content": qual_score
            },
            "passes_threshold": total_score >= 40
        }

# Singleton instance
ats_scorer = ATSScorer()
