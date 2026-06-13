from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from routes import questions, sessions, generate, improve, optimize

load_dotenv()

app = FastAPI(title="Resume Enrichment API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(questions.router, prefix="/questions", tags=["questions"])
app.include_router(sessions.router, prefix="/sessions", tags=["sessions"])
app.include_router(generate.router, prefix="/generate", tags=["generate"])
app.include_router(improve.router, prefix="/improve", tags=["improve"])
app.include_router(optimize.router, prefix="/optimize", tags=["optimize"])


@app.get("/health")
def health():
    return {"status": "ok"}
