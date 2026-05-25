import httpx
from bs4 import BeautifulSoup

BASE = "https://api.ashbyhq.com/posting-api/job-board/{slug}"


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
            "location": j.get("location", ""),
            "description": j.get("descriptionPlain") or _strip_html(j.get("descriptionHtml", "")),
            "apply_url": j.get("jobUrl") or j.get("applyUrl", ""),
            "posted_at": j.get("publishedAt", ""),
            "source": "ashby",
        })
    return jobs