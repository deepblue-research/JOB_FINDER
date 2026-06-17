import re
import json
import os
import httpx
from typing import Dict, Any
from docx import Document

async def score_resume(file_path: str) -> Dict[str, Any]:
    doc = Document(file_path)
    raw_text = "\n".join([para.text for para in doc.paragraphs])
    text_lower = raw_text.lower()

    # 1. TECHNICAL HEURISTICS (40 points)
    tech_score = 0
    issues = []

    sections = {'education': 5, 'skills': 5, 'projects': 5}
    experience_keywords = ['experience', 'internship', 'work']
    if any(keyword in text_lower for keyword in experience_keywords):
        tech_score += 10
    else:
        issues.append("Missing 'Experience' section")
    for section, weight in sections.items():
        if section in text_lower:
            tech_score += weight
        else:
            issues.append(f"Missing '{section.title()}' section")

    if re.search(r'[\w.-]+@[\w.-]+\.\w+', raw_text):
        tech_score += 10
    else:
        issues.append("No email address found")

    if re.search(r'[\+\d][\d\s\-\(\)]{8,}', raw_text):
        tech_score += 5
    else:
        issues.append("No phone number found")

    # 2. LLM QUALITATIVE ANALYSIS (60 points)
    api_key = os.getenv("GEMINI_API_KEY")
    base_url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent"

    system_prompt = (
        "You are a sophisticated ATS simulation engine. "
        "Analyze the provided resume text for content quality, impact, and semantic depth. "
        "Evaluate based on these 3 criteria (0-20 each): "
        "1. Impact: Use of action verbs and quantifiable achievements. "
        "2. Relevance: Semantic density of modern technical keywords. "
        "3. Structure: Readability for parsers. "
        "Return ONLY a JSON object with: "
        "'impact_score' (0-20), 'keyword_score' (0-20), 'structure_score' (0-20), "
        "'specific_improvements' (list of 3 critical findings based ONLY on this text)."
    )

    payload = {
        "contents": [{
            "parts": [{
                "text": f"{system_prompt}\n\nResume Content:\n{raw_text[:4000]}"
            }]
        }],
        "generationConfig": {
            "maxOutputTokens": 1000,
            "temperature": 0.1,
            "responseMimeType": "application/json"
        }
    }

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{base_url}?key={api_key}",
                json=payload,
                timeout=30.0
            )
            response.raise_for_status()
            data = response.json()
            text = data["candidates"][0]["content"]["parts"][0]["text"]
            analysis = json.loads(text)

            qual_score = (
                analysis.get('impact_score', 0) +
                analysis.get('keyword_score', 0) +
                analysis.get('structure_score', 0)
            )
            llm_tips = analysis.get('specific_improvements', [])
    except Exception as e:
        print(f"ATS LLM Error: {e}")
        qual_score = 20
        llm_tips = ["Optimize your bullet points with quantifiable metrics."]

    total_score = min(round(tech_score + qual_score), 100)

    if total_score >= 85: label = "Top Tier — Fully ATS-Optimized"
    elif total_score >= 70: label = "Professional — Strong Structure"
    elif total_score >= 55: label = "Functional — Needs Keywords/Impact"
    elif total_score >= 40: label = "Entry Level — Needs Significant Work"
    else: label = "Critical — Format/Data Errors Detected"

    return {
        "total_score": total_score,
        "label": label,
        "weak_areas": issues,
        "tips": llm_tips,
        "breakdown": {
            "technical_data": tech_score,
            "qualitative_content": qual_score
        }
    }