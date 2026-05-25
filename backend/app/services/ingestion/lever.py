import httpx
from bs4 import BeautifulSoup

BASE = "https://api.lever.co/v0/postings/{slug}?mode=json"


def _strip_html(html: str) -> str:
    if not html:
        return ""
    return BeautifulSoup(html, "html.parser").get_text(separator=" ", strip=True)


def fetch_jobs(slug: str) -> list[dict]:
    url = BASE.format(slug=slug)
    try:
        resp = httpx.get(url, timeout=20)
        if resp.status_code != 200:
            return []
        data = resp.json()
    except Exception:
        return []

    jobs = []
    for j in data:  # Lever returns a top-level list, not a dict
        cats = j.get("categories") or {}
        jobs.append({
            "title": j.get("text", ""),
            "company": slug,
            "location": cats.get("location", ""),
            "description": j.get("descriptionPlain") or _strip_html(j.get("description", "")),
            "apply_url": j.get("hostedUrl", ""),
            "posted_at": j.get("createdAt", ""),  # epoch milliseconds
            "source": "lever",
        })
    return jobs