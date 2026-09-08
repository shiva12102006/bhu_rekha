import asyncio
from sqlalchemy import text
from app.database import engine

async def main():
    async with engine.begin() as conn:
        await conn.execute(text("ALTER TABLE land_records MODIFY owner_name TEXT"))
        await conn.execute(text("ALTER TABLE land_records MODIFY survey_no TEXT"))
        await conn.execute(text("ALTER TABLE land_records MODIFY khasra_no TEXT"))
        await conn.execute(text("ALTER TABLE land_records MODIFY khata_no TEXT"))
        await conn.execute(text("ALTER TABLE land_records MODIFY plot_area TEXT"))
        await conn.execute(text("ALTER TABLE land_records MODIFY village VARCHAR(255)"))
        await conn.execute(text("ALTER TABLE land_records MODIFY tehsil VARCHAR(255)"))
        await conn.execute(text("ALTER TABLE land_records MODIFY district VARCHAR(255)"))
        await conn.execute(text("ALTER TABLE land_records MODIFY land_classification TEXT"))
        print("Table altered successfully")

if __name__ == "__main__":
    asyncio.run(main())
