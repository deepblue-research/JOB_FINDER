import asyncio
from sqlalchemy import delete
from app.database import AsyncSessionLocal
from app.models import Resume

async def clear_resumes():
    async with AsyncSessionLocal() as db:
        await db.execute(delete(Resume))
        await db.commit()
        print('All resumes cleared successfully from database.')

if __name__ == "__main__":
    asyncio.run(clear_resumes())
