import os
from pathlib import Path

from dotenv import load_dotenv
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService

from wellbeing_agent import root_agent

load_dotenv()

session_service = InMemorySessionService()

runner = Runner(
    agent=root_agent,
    app_name="wellbeing_agent",
    session_service=session_service,
)

if __name__ == "__main__":
    import uvicorn
    from fastapi.middleware.cors import CORSMiddleware
    from fastapi.staticfiles import StaticFiles
    from google.adk.cli import fast_api

    from wellbeing_agent.api import router as api_router

    app = fast_api.get_fast_api_app(
        agents_dir=os.path.dirname(os.path.abspath(__file__)),
        session_service_uri="",
        web=True,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:5173", "http://localhost:3000"],
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(api_router)

    journal_dir = Path(os.environ.get("JOURNAL_DIR", "./journals"))
    journal_dir.mkdir(parents=True, exist_ok=True)
    app.mount("/journals", StaticFiles(directory=str(journal_dir)), name="journals")

    static_dir = Path(__file__).parent / "journal-app" / "dist"
    if static_dir.exists():
        app.mount("/app", StaticFiles(directory=str(static_dir), html=True), name="frontend")

    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
