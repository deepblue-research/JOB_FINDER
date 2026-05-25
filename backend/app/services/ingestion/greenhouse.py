import httpx
from bs4 import BeautifulSoup

BASE = "https://boards-api.greenhouse.io/v1/boards/{slug}/jobs?content=true"


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
    for j in data.get("jobs", []):
        jobs.append({
            "title": j.get("title", ""),
            "company": slug,
            "location": (j.get("location") or {}).get("name", ""),
            "description": _strip_html(j.get("content", "")),
            "apply_url": j.get("absolute_url", ""),
            "posted_at": j.get("updated_at", ""),
            "source": "greenhouse",
        })
    return jobs