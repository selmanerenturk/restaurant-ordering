from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.router import api_router
from app.core.config import settings

app = FastAPI(title=settings.PROJECT_NAME)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

app.include_router(api_router, prefix="/api/v1")

# WebSocket route (outside /api/v1 prefix)
from app.api.v1.endpoints.websocket import router as websocket_router
app.include_router(websocket_router)

@app.get("/")
def root():
    return {"message": "FastAPI project ready!"}