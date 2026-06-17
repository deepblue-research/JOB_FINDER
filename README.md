# JobMatch — AI-Powered Job Recommendation Platform

JobMatch is an AI-powered job recommendation platform built for fresh graduates. It matches candidates to relevant jobs by comparing their resume skills against real job postings from LinkedIn, Indeed, and top Indian tech companies, then shows exactly what skills they need to learn — with free course recommendations from Coursera, NPTEL, and YouTube.

---

## Features

- Resume upload with ATS compatibility scoring (0–100)
- AI-powered skill extraction from resume using Gemini 2.0 Flash
- Real-time job search from LinkedIn, Indeed, and Glassdoor via JSearch API
- Direct job feeds from Greenhouse, Lever, and Ashby ATS boards
- AI skill gap analysis comparing your resume against job requirements
- Free course recommendations for every missing skill
- Match scoring based on skill overlap, role fit, and location
- Redis caching to preserve free API quotas

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, TailwindCSS, Zustand, Axios |
| Backend | FastAPI, Python 3.11, SQLAlchemy 2.0, Alembic |
| Database | PostgreSQL 16 with pgvector |
| Cache | Redis |
| AI/LLM | Google Gemini 2.0 Flash API |
| Job APIs | JSearch (RapidAPI), Greenhouse, Lever, Ashby |
| Container | Docker, Docker Compose |

---

## How It Works

```
User uploads resume (PDF/DOCX)
        ↓
Gemini LLM extracts skills into structured JSON
        ↓
JSearch + Greenhouse + Lever + Ashby fetch 30–60 live jobs
        ↓
JobRanker scores each job:
  Skill match (50%) + Role fit (30%) + Location (20%)
  Senior role penalty (-30%)
        ↓
Top 10 jobs returned to user
        ↓
Per job: Gemini extracts required skills from description
Fuzzy match against resume skills → skill gap identified
        ↓
Course recommendations generated for missing skills
```

---

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [Node.js 18+](https://nodejs.org/)
- Git

---

## Quick Start

**1. Clone the repository**
```bash
git clone https://github.com/yourusername/job-match-platform
cd job-match-platform
```

**2. Set up environment variables**
```bash
cp .env.example .env
```

Open `.env` and fill in:
```
GEMINI_API_KEY=your_key_here        # from aistudio.google.com/apikey
JSEARCH_API_KEY=your_key_here       # from rapidapi.com — search JSearch
SECRET_KEY=any_random_string        # for JWT signing
```

**3. Start all services**
```bash
docker compose up -d
```

**4. Run database migrations**
```bash
docker compose exec backend alembic upgrade head
```

**5. Start the frontend**
```bash
cd frontend
npm install
npm run dev
```

**6. Open the app**

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| API Docs (Swagger) | http://localhost:8000/docs |

---

## Environment Variables

| Variable | Required | Description | Where to get |
|----------|----------|-------------|--------------|
| `GEMINI_API_KEY` | Yes | Gemini LLM for resume parsing and skill gap | [aistudio.google.com](https://aistudio.google.com/apikey) — free |
| `JSEARCH_API_KEY` | Yes | Job search across LinkedIn, Indeed, Glassdoor | [rapidapi.com](https://rapidapi.com) — free tier 200 req/month |
| `SECRET_KEY` | Yes | JWT token signing key | Any random string |
| `DATABASE_URL` | Auto | Set by Docker Compose | docker-compose.yml |
| `REDIS_URL` | Auto | Set by Docker Compose | docker-compose.yml |
| `ADZUNA_APP_ID` | Optional | Additional India job board coverage | [developer.adzuna.com](https://developer.adzuna.com) — free |
| `ADZUNA_APP_KEY` | Optional | Additional India job board coverage | [developer.adzuna.com](https://developer.adzuna.com) — free |

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Create a new account |
| POST | `/auth/login` | Login and get JWT token |
| GET | `/auth/me` | Get current user details |
| POST | `/preferences` | Save job preferences |
| POST | `/resume/upload` | Upload and parse resume |
| GET | `/resume/me` | Get parsed resume and skills |
| GET | `/api/jobs` | Get top 10 matched jobs |
| POST | `/api/skill-gap/analyze` | Get skill gap for a specific job |
| POST | `/api/feedback` | Rate a job match |

Full interactive docs available at `http://localhost:8000/docs`

---

## Skill Gap Analysis

For each matched job, JobMatch:

1. Sends the job description to Gemini LLM to extract all required skills
2. Fuzzy-matches those skills against your resume skills (handles ReactJS = react, Node.js = node etc.)
3. Returns missing skills with importance level (high/medium/low) and 1–2 free course recommendations per skill from Coursera, NPTEL, freeCodeCamp, or YouTube

---

## Known Limitations

- JSearch free tier allows 200 requests/month — results are cached for 6 hours to preserve quota
- Gemini free tier allows 1500 requests/day — rate limiting may cause fallback to keyword-based extraction
- English language resumes only
- Focused on fresher and entry-level roles (0–2 years experience)
- Alumni feature uses manually seeded data for demo purposes

---

## Project Structure

```
job-match-platform/
├── backend/
│   ├── app/
│   │   ├── api/          # FastAPI route handlers
│   │   ├── models/       # SQLAlchemy ORM models
│   │   ├── schemas/      # Pydantic request/response models
│   │   ├── services/     # Business logic
│   │   │   ├── llm_client.py       # Gemini API wrapper
│   │   │   ├── jsearch_client.py   # JSearch API
│   │   │   ├── job_ranker.py       # Scoring engine
│   │   │   ├── skill_gap_engine.py # Gap computation
│   │   │   └── ingestion/          # Greenhouse, Lever, Ashby
│   │   └── main.py
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   └── src/
│       ├── pages/        # React pages
│       ├── components/   # Shared components
│       ├── api/          # Axios API calls
│       └── store/        # Zustand state
├── docker-compose.yml
└── .env.example
```

---

## License

MIT
