import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
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
    "http://localhost:5173",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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