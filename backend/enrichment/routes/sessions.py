import os
import asyncpg
from fastapi import APIRouter, HTTPException

router = APIRouter()

@router.post("/")
async def create_session():
    try:
        conn = await asyncpg.connect(os.getenv("ENRICHMENT_DATABASE_URL"))
        row = await conn.fetchrow(
            "INSERT INTO enrichment_sessions DEFAULT VALUES RETURNING session_id"
        )
        await conn.close()
        return {"session_id": str(row["session_id"])}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))