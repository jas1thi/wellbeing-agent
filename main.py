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
    from fastapi import Request
    from fastapi.middleware.cors import CORSMiddleware
    from fastapi.responses import FileResponse
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
        allow_origins=["*"],
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Mount REST API
    app.include_router(api_router)

    # Serve journal images
    journal_dir = Path(os.environ.get("JOURNAL_DIR", "./journals"))
    journal_dir.mkdir(parents=True, exist_ok=True)
    app.mount("/journals", StaticFiles(directory=str(journal_dir)), name="journals")

    # Serve built frontend (SPA)
    static_dir = Path(__file__).parent / "journal-app" / "dist"
    if static_dir.exists():
        app.mount("/assets", StaticFiles(directory=str(static_dir / "assets")), name="assets")

        @app.get("/{full_path:path}")
        async def serve_spa(request: Request, full_path: str):
            """Serve the SPA index.html for all non-API routes."""
            file_path = static_dir / full_path
            if file_path.is_file():
                return FileResponse(file_path)
            return FileResponse(static_dir / "index.html")

    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
