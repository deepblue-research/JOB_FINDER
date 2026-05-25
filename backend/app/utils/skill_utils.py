SKILL_KEYWORDS = [
    'python','javascript','typescript','react','node','java',
    'sql','html','css','git','docker','aws','mongodb','postgresql',
    'django','flask','fastapi','express','vue','angular','redux',
    'mysql','redis','linux','bash','c++','c#','php','ruby',
    'machine learning','data analysis','excel','tableau','power bi',
    'figma','photoshop','kotlin','swift','flutter','dart'
]

def extract_skills_fallback(text: str) -> list:
    if not text:
        return []
    text_lower = text.lower()
    return list(set([k for k in SKILL_KEYWORDS if k in text_lower]))
