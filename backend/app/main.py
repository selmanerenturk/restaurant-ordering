import logging
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from slowapi.errors import RateLimitExceeded
from app.api.v1.router import api_router
from app.core.config import settings
from app.core.limiter import limiter

logger = logging.getLogger("app")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Auto-create any missing tables/columns on startup
    from app.db.init_db import init_db
    init_db()
    yield


app = FastAPI(title=settings.PROJECT_NAME, lifespan=lifespan)

# Rate limiting (slowapi)
app.state.limiter = limiter

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


def _cors_headers(request: Request) -> dict:
    origin = request.headers.get("origin", "")
    if origin in ALLOWED_ORIGINS:
        return {
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Credentials": "true",
        }
    return {}


@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    """Return 429 with CORS headers so the browser sees the real error
    instead of a CORS failure."""
    return JSONResponse(
        status_code=429,
        content={"detail": "Çok fazla istek gönderildi. Lütfen biraz sonra tekrar deneyin."},
        headers=_cors_headers(request),
    )


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Catch all unhandled exceptions: log the real error server-side, but return
    a generic message to the client so internal/library details don't leak.
    CORS headers are added so the browser shows the 500 instead of a CORS error.
    """
    logger.error(
        "Unhandled error on %s %s", request.method, request.url.path, exc_info=exc
    )
    return JSONResponse(
        status_code=500,
        content={"detail": "Beklenmeyen bir hata oluştu. Lütfen daha sonra tekrar deneyin."},
        headers=_cors_headers(request),
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