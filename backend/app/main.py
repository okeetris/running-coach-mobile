"""
Running Coach API

FastAPI backend for running biomechanics analysis.
Parses Garmin FIT files and returns structured analysis data.
"""

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import activities

app = FastAPI(
    title="Running Coach API",
    description="Biomechanics analysis for running activities",
    version="1.0.0",
)

# Include routers
app.include_router(activities.router)

# CORS configuration for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8081",  # Expo web
        "http://localhost:19006",  # Expo dev
        "http://10.0.2.2:8081",  # Android emulator
        "*",  # Allow all for development
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health_check():
    """Health check endpoint for container orchestration."""
    fit_files_path = os.environ.get("FIT_FILES_PATH", "/data/fit-files")
    fit_files_accessible = os.path.isdir(fit_files_path)

    return {
        "status": "ok",
        "fit_files_path": fit_files_path,
        "fit_files_accessible": fit_files_accessible,
    }


@app.get("/")
async def root():
    """Root endpoint with API info."""
    return {
        "name": "Running Coach API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health",
    }
