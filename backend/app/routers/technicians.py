from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
import datetime
import os
import uuid
from backend.app.database import get_db
from backend.app.models import (
    User, Technician, ServiceProvider, Booking, BookingAssignment, BookingImage, Notification
)
from backend.app.schemas import TechnicianStatusUpdate
from backend.app.auth import require_technician, require_provider, get_current_user
from backend.app.config import UPLOAD_DIR

router = APIRouter(prefix="/api/technicians", tags=["Technicians"])

@router.get("/my-jobs")
def get_technician_jobs(current_user: User = Depends(require_technician), db: Session = Depends(get_db)):
    tech = current_user.technician_profile
    if not tech:
        raise HTTPException(status_code=404, detail="Technician profile not found")

    assignments = db.query(BookingAssignment).filter(BookingAssignment.technician_id == tech.id).all()
    jobs = []
    for a in assignments:
        b = a.booking
        cust_user = b.customer.user if b.customer else None
        jobs.append({
            "assignment_id": a.id,
            "booking_id": b.id,
            "booking_code": b.booking_code,
            "service_name": b.service.name if b.service else "Service",
            "customer_name": cust_user.full_name if cust_user else "Customer",
            "customer_phone": cust_user.phone if cust_user else "N/A",
            "address": f"{b.address.address_line}, {b.address.city} - {b.address.pincode}" if b.address else "Address",
            "booking_date": b.booking_date,
            "time_slot": b.time_slot,
            "problem_description": b.problem_description,
            "job_status": a.status,
            "booking_status": b.status,
            "arrival_time": a.arrival_time,
            "completed_at": a.completed_at,
            "technician_notes": a.technician_notes,
            "images": [{"id": img.id, "url": img.image_url, "type": img.image_type} for img in b.images]
        })
    return jobs

@router.put("/jobs/{assignment_id}/status")
def update_job_status(assignment_id: int, req: TechnicianStatusUpdate, current_user: User = Depends(require_technician), db: Session = Depends(get_db)):
    tech = current_user.technician_profile
    assignment = db.query(BookingAssignment).filter(
        BookingAssignment.id == assignment_id,
        BookingAssignment.technician_id == tech.id
    ).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    assignment.status = req.status
    if req.technician_notes:
        assignment.technician_notes = req.technician_notes

    b = assignment.booking

    if req.status == "En Route":
        assignment.arrival_time = datetime.datetime.utcnow()
    elif req.status == "In Progress":
        b.status = "In Progress"
    elif req.status == "Completed":
        assignment.completed_at = datetime.datetime.utcnow()
        b.status = "Completed"

    # Notify customer
    if b.customer and b.customer.user:
        notif = Notification(
            user_id=b.customer.user.id,
            title=f"Service Update: {req.status}",
            message=f"Technician {current_user.full_name} has updated your booking {b.booking_code} status to: {req.status}."
        )
        db.add(notif)

    db.commit()
    return {"message": f"Job status updated to {req.status}", "status": req.status}

@router.post("/jobs/{booking_id}/upload-image")
async def upload_job_image(
    booking_id: int,
    image_type: str = "after_work", # before_work, after_work
    file: UploadFile = File(...),
    current_user: User = Depends(require_technician),
    db: Session = Depends(get_db)
):
    b = db.query(Booking).filter(Booking.id == booking_id).first()
    if not b:
        raise HTTPException(status_code=404, detail="Booking not found")

    content = await file.read()
    from backend.app.storage import upload_media_file
    image_url = upload_media_file(content, file.filename, folder="technician_work")

    new_img = BookingImage(
        booking_id=booking_id,
        image_url=image_url,
        image_type=image_type
    )
    db.add(new_img)
    db.commit()
    db.refresh(new_img)

    return {"message": "Image uploaded successfully", "url": new_img.image_url}

@router.get("/provider-technicians")
def get_provider_technicians(current_user: User = Depends(require_provider), db: Session = Depends(get_db)):
    prov = current_user.provider_profile
    techs = db.query(Technician).filter(Technician.provider_id == prov.id).all()
    # also return unassigned technicians if provider has none, for easy demo assignment
    if not techs:
        techs = db.query(Technician).all()

    return [
        {
            "id": t.id,
            "full_name": t.user.full_name if t.user else "Technician",
            "phone": t.user.phone if t.user else "N/A",
            "specialization": t.specialization,
            "is_available": t.is_available
        } for t in techs
    ]

