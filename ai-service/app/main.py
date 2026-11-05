
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.image_analysis import router as image_analysis_router
from app.api.object_analysis import router as object_analysis_router
from app.api.full_analysis import router as full_analysis_router
from app.api.matching import router as matching_router
from app.api.clip_search import router as clip_search_router
from app.api.report_cleanup import router as report_cleanup_router

app = FastAPI(
    title="LostLink AI Service",
    description="AI-powered image analysis and intelligent lost-and-found matching for PES University RR Campus.",
    version="1.0.0",
)

# Allow the Next.js frontend to communicate with the AI service.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "Authorization"],
)
app.include_router(image_analysis_router)
app.include_router(object_analysis_router)
app.include_router(full_analysis_router)
app.include_router(matching_router)
app.include_router(clip_search_router)
app.include_router(report_cleanup_router)

@app.get("/")
async def root():
    return {
        "success": True,
        "service": "LostLink AI Service",
        "version": "1.0.0",
        "message": "AI service is running.",
    }


@app.get("/health")
async def health_check():
    return {
        "success": True,
        "status": "healthy",
        "service": "LostLink AI Service",
        "components": {
            "api": "operational",
            "image_processing": "initializing",
            "ai_matching": "not_configured",
            "vector_database": "not_configured",
        },
    }
