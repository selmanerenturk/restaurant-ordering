import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from app.api.v1.router import api_router
from app.core.config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Auto-create any missing tables/columns on startup
    from app.db.init_db import init_db
    init_db()
    yield


app = FastAPI(title=settings.PROJECT_NAME, lifespan=lifespan)

# CORS Middleware
# Note: allow_origins must list specific origins (not "*") when allow_credentials=True
ALLOWED_ORIGINS = [
    "https://restaurant-ordering-sage.vercel.app",
    "https://restaurant-ordering-git-main-selmanerenturks-projects.vercel.app",
    "http://localhost:5173",
    "http://localhost:3000",
    "https://www.praticket.com",
    "https://praticket.com",
    "https://ayisigitatlicisi.com",
    "https://www.ayisigitatlicisi.com",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Catch all unhandled exceptions and return a JSON 500 with CORS headers.
    Without this, FastAPI may return a bare 500 with no CORS headers, which the
    browser reports as a CORS error instead of showing the real server error.
    """
    origin = request.headers.get("origin", "")
    headers = {}
    if origin in ALLOWED_ORIGINS:
        headers["Access-Control-Allow-Origin"] = origin
        headers["Access-Control-Allow-Credentials"] = "true"
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal server error: {type(exc).__name__}: {str(exc)}"},
        headers=headers,
    )

# Ensure uploads directory exists and serve static files
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads")
os.makedirs(os.path.join(UPLOAD_DIR, "products"), exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

app.include_router(api_router, prefix="/api/v1")

# WebSocket route (outside /api/v1 prefix)
from app.api.v1.endpoints.websocket import router as websocket_router
app.include_router(websocket_router)

@app.get("/")
def root():
    return {"message": "FastAPI project ready!"}