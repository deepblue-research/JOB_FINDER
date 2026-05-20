from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.api import auth, jobs, resume, skill_gap, feedback, preferences

app = FastAPI(title=settings.PROJECT_NAME)

# Set up CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth, prefix="/auth", tags=["Authentication"])
app.include_router(jobs, prefix="/api/jobs", tags=["Jobs"])
app.include_router(resume, prefix="/api/resumes", tags=["Resumes"])
app.include_router(skill_gap, prefix="/api/skill-gap", tags=["Skill Gap"])
app.include_router(feedback, prefix="/api/feedback", tags=["Feedback"])
app.include_router(preferences, prefix="/api/preferences", tags=["Preferences"])

@app.get("/")
async def root():
    return {"message": "Welcome to Job Match Platform API", "status": "running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
