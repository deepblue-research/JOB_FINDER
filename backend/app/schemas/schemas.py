from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from uuid import UUID
from datetime import datetime

# --- Auth Schemas ---
class UserBase(BaseModel):
    email: EmailStr

class UserCreate(UserBase):
    password: str
    college: Optional[str] = None
    batch_year: Optional[int] = None

class UserRead(UserBase):
    id: UUID
    college: Optional[str] = None
    batch_year: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

# --- Job Schemas ---
class JobSearchQuery(BaseModel):
    query: str
    page: int = 1
    remote: bool = False
    employment_types: str = "FULLTIME"

# --- Resume Schemas ---
class ResumeParseResponse(BaseModel):
    parsed_json: Dict[str, Any]
    ats_score: float
    ats_tips: List[str]

# --- Skill Gap Schemas ---
class SkillGapAnalysis(BaseModel):
    matching_skills: List[str]
    missing_skills_critical: List[str]
    missing_skills_optional: List[str]
    learning_resources: List[str]
