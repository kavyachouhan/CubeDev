import os
import uvicorn

if __name__ == "__main__":
    reload = os.getenv("ENV", "").lower() in ("development", "dev", "local")
    uvicorn.run("app.app:app", host="0.0.0.0", port=8000, reload=reload)
