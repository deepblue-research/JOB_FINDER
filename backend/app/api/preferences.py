from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID

from app.database import get_db
from app.models.preference import Preferences
from app.schemas.preferences import PreferencesRequest, PreferencesResponse
from app.api.auth import oauth2_scheme
from app.utils.auth_utils import verify_token

router = APIRouter()

@router.post("/", response_model=PreferencesResponse)
async def upsert_preferences(
    pref_in: PreferencesRequest,
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
):
    """Updates or creates user preferences."""
    user_id_str = verify_token(token)
    user_id = UUID(user_id_str)
    
    # Check if preferences already exist
    result = await db.execute(select(Preferences).where(Preferences.user_id == user_id))
    pref = result.scalar_one_or_none()
    
    if pref:
        # Update existing
        pref.desired_role = pref_in.desired_role
        pref.desired_location = pref_in.desired_location
        pref.work_mode = pref_in.work_mode
        pref.experience_level = pref_in.experience_level
    else:
        # Create new
        pref = Preferences(
            user_id=user_id,
            desired_role=pref_in.desired_role,
            desired_location=pref_in.desired_location,
            work_mode=pref_in.work_mode,
            experience_level=pref_in.experience_level
        )
        db.add(pref)
    
    await db.commit()
    await db.refresh(pref)
    return pref

@router.get("/", response_model=PreferencesResponse)
async def get_preferences(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
):
    """Retrieves the current user's preferences."""
    user_id_str = verify_token(token)
    user_id = UUID(user_id_str)
    
    result = await db.execute(select(Preferences).where(Preferences.user_id == user_id))
    pref = result.scalar_one_or_none()
    
    if not pref:
        raise HTTPException(
            status_code=404, 
            detail="Complete onboarding first"
        )
        
    return pref
