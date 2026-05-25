"""
DEMO match engine.
- Resume: read from the real `resumes` table (skills_keywords JSONB).
- Jobs:   fetched LIVE from Ashby / Greenhouse / Lever (free APIs, no DB storage).
- Ranking: by resume-skill overlap, fresher-focused.
Run:  python demo_match.py
"""
import psycopg2
from app.services.ingestion import greenhouse, lever, ashby

# --- Update password to match YOUR postgres install ---
DB_CONFIG = {
    "host": "localhost",
    "port": 5432,
    "dbname": "jobmatch",
    "user": "postgres",
    "password": "postgres",   # <-- change this
}

# Companies on each ATS. Verified-working ones included; add more valid slugs.
COMPANIES = [
    ("greenhouse", "stripe"),
    ("ashby", "ramp"),
    # ("lever", "<valid_lever_slug>"),  # add a real Lever company if you find one
]

SENIOR_WORDS = ["senior", "lead", "principal", "manager", "staff", "director", "head"]
# Keep only roles that look fresher-appropriate or neutral
FRESHER_HINTS = ["intern", "graduate", "fresher", "entry", "junior", "trainee",
                 "associate", "0-1", "0 - 1", "new grad"]


def get_resume_skills(conn, email="demo@student.com"):
    cur = conn.cursor()
    cur.execute("""
        SELECT r.skills_keywords
        FROM resumes r
        JOIN users u ON u.id = r.user_id
        WHERE u.email = %s
        LIMIT 1
    """, (email,))
    row = cur.fetchone()
    cur.close()
    if not row or not row[0]:
        return []
    # skills_keywords is JSONB -> psycopg2 returns it as a Python object
    data = row[0]
    if isinstance(data, dict):
        skills = data.get("skills", [])
    else:
        skills = data
    return [str(s).strip().lower() for s in skills if str(s).strip()]


def fetch_live_jobs():
    jobs = []
    for ats, slug in COMPANIES:
        if ats == "greenhouse":
            jobs += greenhouse.fetch_jobs(slug)
        elif ats == "lever":
            jobs += lever.fetch_jobs(slug)
        elif ats == "ashby":
            jobs += ashby.fetch_jobs(slug)
    return jobs


def is_tech_relevant(job, skills):
    """Light filter: keep jobs whose text mentions at least one resume skill."""
    text = (job.get("title", "") + " " + job.get("description", "")).lower()
    return any(s in text for s in skills)


def rank_jobs(skills, jobs, top_n=10):
    scored = []
    for job in jobs:
        desc = (job.get("description") or "").lower()
        title = (job.get("title") or "").lower()
        if not desc and not title:
            continue

        matched = [s for s in skills if s and s in desc]
        skill_score = len(matched)
        title_hits = sum(1 for s in skills if s and s in title)

        senior_penalty = -5 if any(w in title for w in SENIOR_WORDS) else 0
        fresher_boost = 3 if any(h in title for h in FRESHER_HINTS) else 0

        final = (skill_score * 1.0) + (title_hits * 2.0) + senior_penalty + fresher_boost

        loc = job.get("location", "")
        reason = (f"Matches your skills: {', '.join(matched)}. Located in {loc}."
                  if matched else f"Located in {loc}.")

        scored.append({
            "title": job.get("title", ""),
            "company": job.get("company", ""),
            "location": loc,
            "apply_url": job.get("apply_url", ""),
            "score": final,
            "matched_skills": matched,
            "match_reason": reason,
        })

    scored.sort(key=lambda x: x["score"], reverse=True)
    return scored[:top_n]


def main():
    conn = psycopg2.connect(**DB_CONFIG)
    try:
        skills = get_resume_skills(conn)
        print("Resume skills (from DB):", skills, "\n")
    finally:
        conn.close()

    if not skills:
        print("No skills found in resume. Check the resumes table.")
        return

    print("Fetching live jobs from Greenhouse / Ashby / Lever ...")
    all_jobs = fetch_live_jobs()
    print(f"Fetched {len(all_jobs)} jobs total.")

    # Keep only jobs relevant to the resume's skills (keeps demo focused)
    relevant = [j for j in all_jobs if is_tech_relevant(j, skills)]
    print(f"{len(relevant)} jobs mention at least one of the candidate's skills.\n")

    top = rank_jobs(skills, relevant, top_n=10)
    print("=== TOP MATCHES (resume from DB, jobs live from free APIs) ===\n")
    for i, j in enumerate(top, 1):
        print(f"{i}. {j['title']} @ {j['company']}")
        print(f"   Score: {j['score']}  |  {j['match_reason']}")
        print(f"   Apply: {j['apply_url']}\n")


if __name__ == "__main__":
    main()