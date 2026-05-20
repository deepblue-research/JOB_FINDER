from pydantic import BaseModel
from uuid import UUID

class PreferencesRequest(BaseModel):
    desired_role: str
    desired_location: str
    work_mode: str
    experience_level: str = "fresher"

class PreferencesResponse(PreferencesRequest):
    user_id: UUID

    class Config:
        from_attributes = True
