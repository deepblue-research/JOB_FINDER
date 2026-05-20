from .auth import router as auth_router
from .jobs import router as jobs_router
from .resume import router as resume_router
from .skill_gap import router as skill_gap_router
from .feedback import router as feedback_router
from .preferences import router as preferences_router

# These are imported by main.py
auth = auth_router
jobs = jobs_router
resume = resume_router
skill_gap = skill_gap_router
feedback = feedback_router
preferences = preferences_router
