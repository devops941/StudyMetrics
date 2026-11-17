import asyncio
import os
import shutil
from pathlib import Path
from app.core.mongodb import get_database, init_indexes, close_database
from app.core.config import settings

async def clear_database():
    print(f"Connecting to database: {settings.MONGODB_DATABASE}...")
    db = await get_database()
    collections = await db.list_collection_names()
    print(f"Found collections: {collections}")

    for coll_name in collections:
        count = await db[coll_name].count_documents({})
        print(f"Dropping collection '{coll_name}' ({count} documents)...")
        await db.drop_collection(coll_name)

    print("Re-initializing database indexes...")
    await init_indexes()
    await close_database()
    print("MongoDB database cleared and indexes recreated successfully.")

def clear_storage_uploads():
    root = Path(__file__).resolve().parent.parent
    upload_dirs = [
        root / "storage" / "uploads",
        root / "backend" / "storage" / "uploads",
        Path(settings.UPLOAD_DIR).resolve(),
    ]

    cleared_count = 0
    seen_dirs = set()
    for udir in upload_dirs:
        if udir in seen_dirs or not udir.exists():
            continue
        seen_dirs.add(udir)
        for item in udir.iterdir():
            if item.name == ".gitkeep":
                continue
            try:
                if item.is_file():
                    item.unlink()
                    cleared_count += 1
                elif item.is_dir():
                    shutil.rmtree(item)
                    cleared_count += 1
            except Exception as e:
                print(f"Error removing {item}: {e}")

    print(f"Removed {cleared_count} uploaded file(s) from local storage directories.")

if __name__ == "__main__":
    asyncio.run(clear_database())
    clear_storage_uploads()
    print("Cleanup complete!")
