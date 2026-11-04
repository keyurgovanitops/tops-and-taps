import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from backend.app.database import engine, Base
from backend.app.config import UPLOAD_DIR
from backend.app.seed import seed_database
from backend.app.routers import (
    auth, customers, services, providers, technicians,
    bookings, payments, notifications, reviews, analytics
)

# Initialize Database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="TOPS & Taps SaaS Platform API",
    description="TOPS & Taps — Your home. Our hustle. REST APIs powering Customers, Service Providers, Technicians, and Super Admins.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount uploads directory for images and proof documents
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# Include Routers
app.include_router(auth.router)
app.include_router(customers.router)
app.include_router(services.router)
app.include_router(providers.router)
app.include_router(technicians.router)
app.include_router(bookings.router)
app.include_router(payments.router)
app.include_router(notifications.router)
app.include_router(reviews.router)
app.include_router(analytics.router)

@app.on_event("startup")
def on_startup():
    try:
        seed_database()
    except Exception as e:
        print(f"Startup database seed note: {e}")

@app.get("/")
def root():
    return {
        "platform": "TOPS & Taps — Your home. Our hustle.",
        "status": "operational",
        "documentation": "/docs",
        "version": "1.0.0"
    }

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "platform": "TOPS & Taps — Your home. Our hustle.",
        "version": "1.0.0"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)

