import asyncio
from sqlalchemy import select
from app.database import AsyncSessionLocal
from app.models import Resume

async def inspect_resume():
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Resume))
        r = result.scalars().first()
        if r:
            print('Keys:', list(r.parsed_json.keys()))
            print('Skills:', r.parsed_json.get('skills', 'NOT FOUND'))
            print('Full JSON:', r.parsed_json)
        else:
            print('No resume found.')

if __name__ == "__main__":
    asyncio.run(inspect_resume())
