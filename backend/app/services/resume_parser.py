import json
from typing import Dict, Any, Optional
import pdfplumber
import docx
import io
from app.services.llm_client import llm_client

class ResumeParser:
    def extract_text(self, file_content: bytes, filename: str) -> str:
        """Extracts raw text from PDF or DOCX files."""
        text = ""
        if filename.endswith(".pdf"):
            with pdfplumber.open(io.BytesIO(file_content)) as pdf:
                for page in pdf.pages:
                    text += page.extract_text() or ""
        elif filename.endswith(".docx"):
            doc = docx.Document(io.BytesIO(file_content))
            for para in doc.paragraphs:
                text += para.text + "\n"
        else:
            # Assume plain text for other types
            text = file_content.decode("utf-8", errors="ignore")
        return text

    async def parse_to_json(self, raw_text: str) -> Dict[str, Any]:
        """Uses LLM to convert raw resume text into structured JSON."""
        system_prompt = (
            "You are a professional resume parser. Extract information from the provided resume text "
            "into a clean JSON format. Include fields for: name, contact_info, skills (list of strings), "
            "experience (list of objects with company, title, duration, responsibilities), "
            "education (list of objects with institution, degree, year), and a summary. "
            "Return ONLY the JSON object."
        )
        
        user_prompt = f"Resume Text:\n{raw_text}"
        
        response = await llm_client.get_completion(system_prompt, user_prompt, max_tokens=2000)
        
        try:
            # Try to find JSON in the response
            start_idx = response.find("{")
            end_idx = response.rfind("}") + 1
            if start_idx != -1 and end_idx != -1:
                json_str = response[start_idx:end_idx]
                return json.loads(json_str)
            return {"error": "Could not parse JSON from LLM response", "raw": response}
        except json.JSONDecodeError:
            return {"error": "Invalid JSON returned from LLM", "raw": response}

# Singleton instance
resume_parser = ResumeParser()
