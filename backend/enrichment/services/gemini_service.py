import google.generativeai as genai
import os
import json

def get_model():
    genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
    return genai.GenerativeModel("gemini-2.5-flash-lite")

def generate_resume(answers: dict) -> dict:
    model = get_model()
    
    prompt = f"""
You are a resume writer for engineering students in India.
Here are the candidate's answers to a set of questions:

{json.dumps(answers, indent=2)}

Write a resume with these sections (skip any section if there is no data for it):
- contact_info (name, phone, email, location, linkedin, github)
- education (degree, branch, college, graduation_year, cgpa, class_12)
- skills (programming_languages, tools, frameworks, soft_skills)
- projects (list of projects, each with: name, description, technologies, role, team_size, github_url, award)
- research (professor, institution, topic, duration, output, tools)
- internships (company, role, duration, tasks)
- work_experience (type, company, role, duration, description)
- certifications (list of courses and exams)
- achievements (competitions, scholarships, rankings, publications)
- extracurriculars (clubs, events, creative_output)
- volunteering (description)
- languages (list of languages spoken)
- interests (tech_interests, hobbies)

For each project, write 2-3 bullet points starting with action verbs like Built, Designed, Developed, Led, Created, Implemented.

Return ONLY valid JSON. No explanation, no extra text, no markdown formatting.
"""
    
    response = model.generate_content(prompt)
    text = response.text.strip()
    
    if text.startswith("```"):
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]
    
    return json.loads(text)


async def generate_l2_questions(weak_areas: list, tips: list) -> list:
    model = get_model()
    
    prompt = f"""
You are a resume coach for engineering students in India.

This resume scored poorly in these areas:
Weak areas: {json.dumps(weak_areas)}
Specific tips: {json.dumps(tips)}

Generate 5-8 specific follow-up questions to collect missing information that will fix these weak spots.

Each question must have:
- id (e.g. "l2_q1")
- question_text
- input_type (either "text" or "textarea")
- why (one sentence explaining why this helps the resume)

Return ONLY valid JSON as a list of questions. No explanation, no extra text.
"""
    
    response = model.generate_content(prompt)
    text = response.text.strip()
    
    if text.startswith("```"):
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]
    
    return json.loads(text)


def improve_resume(original_answers: dict, l2_answers: dict) -> dict:
    model = get_model()
    
    prompt = f"""
You are a resume writer for engineering students in India.

Here are the candidate's original answers:
{json.dumps(original_answers, indent=2)}

Here are additional answers they provided to improve their resume:
{json.dumps(l2_answers, indent=2)}

Using ALL of this information combined, write an improved resume with these sections (skip any section if there is no data for it).
IMPORTANT: Do NOT remove or simplify any details from the original answers. Only ADD new information from the additional answers. Every project bullet point from the original must be preserved and can be expanded but never shortened.
- contact_info (name, phone, email, location, linkedin, github)
- education (degree, branch, college, graduation_year, cgpa, class_12)
- skills (programming_languages, tools, frameworks, soft_skills)
- projects: [{{name, description: [list of 2-3 bullet point strings — NOT "bullets", use the exact key "description"], technologies, role, team_size, github_url, award}}]
- research (professor, institution, topic, duration, output, tools)
- internships (company, role, duration, tasks)
- work_experience (type, company, role, duration, description)
- certifications (list of courses and exams)
- achievements (competitions, scholarships, rankings, publications)
- extracurriculars (clubs, events, creative_output)
- volunteering (description)
- languages (list of languages spoken)
- interests (tech_interests, hobbies)

For each project and experience, write 2-3 bullet points starting with action verbs like Built, Designed, Developed, Led, Created, Implemented. Include specific numbers and metrics wherever possible.

Return ONLY valid JSON. No explanation, no extra text, no markdown formatting.
"""
    
    response = model.generate_content(prompt)
    text = response.text.strip()
    
    if text.startswith("```"):
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]
    
    parsed = json.loads(text)
    print("DEBUG IMPROVE OUTPUT:", parsed)
    return parsed


def generate_l3_round1(resume_text: str, jd_text: str) -> dict:
    model = get_model()

    prompt = f"""
You are a resume optimization assistant for engineering students in India.

Here is the candidate's current resume (extracted text):
{resume_text}

Here is the job description they are targeting:
{jd_text}

Do three things:

1. Rewrite the resume content to better match the keywords, tools, and requirements in the job
   description. Only change wording, phrasing, and emphasis — do NOT add skills, projects,
   experience, or qualifications the candidate does not already have.
   Structure the rewritten resume as JSON with these sections (skip any section with no data).
   Use EXACTLY these field names and shapes for each section — do not invent new field names:
   - contact_info: {{name, phone, email, location, linkedin, github}}
   - education: {{degree, branch, college, graduation_year, cgpa, class_12}}
   - skills: {{programming_languages: [...], frameworks: [...], tools: [...], soft_skills: "..."}}
   - projects: [{{name, description: [list of 2-3 bullet point strings], technologies, role, team_size, github_url, award}}]
   - research: {{professor, institution, topic, duration, output, tools}}
   - internships: [{{company, role, duration, tasks: [list of strings]}}]
   - work_experience: [{{type, company, role, duration, description}}]
   - certifications: [list of strings]
   - achievements: {{competitions, scholarships, rankings, publications}}
   - extracurriculars: {{clubs, events, creative_output}}
   - volunteering: "..." (a string, or list of strings)
   - languages: [list of strings]
   - interests: {{tech_interests: [...], hobbies: [...]}}

2. Look at the candidate's projects and experience. Find anything relevant to this job but
   thin on detail. Write 3-6 specific follow-up questions to gather more information.
   Each question needs: id (e.g. "l3_q1"), question_text, input_type ("text" or "textarea"),
   and why (one sentence explaining why this helps match the job).

3. List skills the job requires that the candidate's resume does not currently show.
   For each, include the skill name and 2-3 free online course or resource links.
   Also give a jd_match_score from 0-100 estimating how well the rewritten resume matches
   this job description.

Return ONLY valid JSON in this exact shape, no markdown, no explanation:
{{
  "rewritten_resume": {{ }},
  "followup_questions": [
    {{"id": "l3_q1", "question_text": "...", "input_type": "text", "why": "..."}}
  ],
  "skill_gaps": [
    {{"skill": "...", "resources": ["...", "..."]}}
  ],
  "jd_match_score": 0
}}
"""

    response = model.generate_content(prompt)
    text = response.text.strip()

    if text.startswith("```"):
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]

    parsed = json.loads(text)
    print("DEBUG L3R1 TYPE:", type(parsed))
    print("DEBUG L3R1 OUTPUT:", parsed)
    return parsed


def generate_l3_round2(rewritten_resume: dict, followup_answers: dict, jd_text: str) -> dict:
    model = get_model()

    prompt = f"""
You are a resume optimization assistant for engineering students in India.

Here is the rewritten resume from Round 1:
{json.dumps(rewritten_resume, indent=2)}

The candidate has now provided more details about their projects and experience:
{json.dumps(followup_answers, indent=2)}

Here is the job description again, for reference:
{jd_text}

Update the resume to incorporate this new information. Only add details that are genuinely
relevant to this job description. Do not exaggerate or invent anything the candidate did
not provide. Keep the same JSON structure (contact_info, education, skills, projects,
research, internships, work_experience, certifications, achievements, extracurriculars,
volunteering, languages, interests), skipping sections with no data.

Return ONLY valid JSON in this exact shape, no markdown, no explanation:
{{
  "final_resume": {{ }},
  "changes_summary": ["...", "..."]
}}
"""

    response = model.generate_content(prompt)
    text = response.text.strip()

    if text.startswith("```"):
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]

    return json.loads(text)