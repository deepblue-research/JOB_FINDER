import asyncio
from app.database import AsyncSessionLocal
from app.models.company import Company
from sqlalchemy import select

COMPANIES = [
    # Greenhouse ATS
    {"name": "Razorpay", "ats_type": "greenhouse", "ats_slug": "razorpay"},
    {"name": "CRED", "ats_type": "greenhouse", "ats_slug": "cred"},
    {"name": "Figma", "ats_type": "greenhouse", "ats_slug": "figma"},
    {"name": "Cloudflare", "ats_type": "greenhouse", "ats_slug": "cloudflare"},
    {"name": "Notion", "ats_type": "greenhouse", "ats_slug": "notion"},
    {"name": "Vercel", "ats_type": "greenhouse", "ats_slug": "vercel"},
    {"name": "Stripe", "ats_type": "greenhouse", "ats_slug": "stripe"},
    {"name": "Airtable", "ats_type": "greenhouse", "ats_slug": "airtable"},
    {"name": "Postman", "ats_type": "greenhouse", "ats_slug": "postman"},
    {"name": "BrowserStack", "ats_type": "greenhouse", "ats_slug": "browserstack"},
    
    # Lever ATS
    {"name": "Swiggy", "ats_type": "lever", "ats_slug": "swiggy"},
    {"name": "Meesho", "ats_type": "lever", "ats_slug": "meesho"},
    {"name": "Urban Company", "ats_type": "lever", "ats_slug": "urbancompany"},
    {"name": "Zepto", "ats_type": "lever", "ats_slug": "zepto"},
    
    # Ashby ATS  
    {"name": "Ramp", "ats_type": "ashby", "ats_slug": "ramp"},
    {"name": "Linear", "ats_type": "ashby", "ats_slug": "linear"},
    {"name": "Retool", "ats_type": "ashby", "ats_slug": "retool"},
    {"name": "Loom", "ats_type": "ashby", "ats_slug": "loom"},
]

async def seed():
    async with AsyncSessionLocal() as db:
        for comp_data in COMPANIES:
            # Upsert logic
            stmt = select(Company).where(Company.ats_slug == comp_data["ats_slug"])
            result = await db.execute(stmt)
            existing = result.scalar_one_or_none()
            
            if existing:
                existing.name = comp_data["name"]
                existing.ats_type = comp_data["ats_type"]
            else:
                new_comp = Company(**comp_data)
                db.add(new_comp)
        
        await db.commit()
        print(f"Successfully seeded {len(COMPANIES)} companies.")

if __name__ == "__main__":
    asyncio.run(seed())
