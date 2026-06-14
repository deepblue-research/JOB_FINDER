import google.generativeai as genai
import os
import json

def get_model():
    genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
    return genai.GenerativeModel("gemini-2.0-flash-lite")

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

For each project and experience, write 2-3 bullet points starting with action verbs like Built, Designed, Developed, Led, Created, Implemented. Include specific numbers and metrics wherever possible.

Return ONLY valid JSON. No explanation, no extra text, no markdown formatting.
"""
    
    response = model.generate_content(prompt)
    text = response.text.strip()
    
    if text.startswith("```"):
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]
    
    return json.loads(text)