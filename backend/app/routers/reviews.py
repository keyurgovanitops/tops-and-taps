from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import datetime
from backend.app.database import get_db
from backend.app.models import Review, Complaint, Booking, ServiceProvider, User, Notification
from backend.app.schemas import ReviewCreate, ReviewReply, ComplaintCreate, ComplaintResolve
from backend.app.auth import require_customer, require_provider, require_admin, get_current_user

router = APIRouter(prefix="/api/reviews", tags=["Reviews & Complaints"])

# Reviews
@router.post("", status_code=201)
def create_review(req: ReviewCreate, current_user: User = Depends(require_customer), db: Session = Depends(get_db)):
    cust = current_user.customer_profile
    booking = db.query(Booking).filter(Booking.id == req.booking_id, Booking.customer_id == cust.id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    if booking.status != "Completed":
        raise HTTPException(status_code=400, detail="Reviews can only be submitted for completed bookings")

    existing = db.query(Review).filter(Review.booking_id == booking.id).first()
    if existing:
        raise HTTPException(status_code=400, detail="A review has already been submitted for this booking")

    new_review = Review(
        booking_id=booking.id,
        customer_id=cust.id,
        provider_id=booking.provider_id,
        rating=req.rating,
        comment=req.comment
    )
    db.add(new_review)

    # Recalculate provider average rating
    if booking.provider:
        prov = booking.provider
        all_revs = db.query(Review).filter(Review.provider_id == prov.id).all()
        ratings = [r.rating for r in all_revs] + [req.rating]
        prov.rating = round(sum(ratings) / len(ratings), 1)
        prov.total_reviews = len(ratings)

    db.commit()
    db.refresh(new_review)
    return {"message": "Review submitted successfully"}

@router.put("/{review_id}/reply")
def reply_to_review(review_id: int, req: ReviewReply, current_user: User = Depends(require_provider), db: Session = Depends(get_db)):
    prov = current_user.provider_profile
    review = db.query(Review).filter(Review.id == review_id, Review.provider_id == prov.id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")

    review.provider_reply = req.reply
    db.commit()
    return {"message": "Reply posted successfully"}

# Complaints
@router.post("/complaints", status_code=201)
def raise_complaint(req: ComplaintCreate, current_user: User = Depends(require_customer), db: Session = Depends(get_db)):
    cust = current_user.customer_profile
    booking = db.query(Booking).filter(Booking.id == req.booking_id, Booking.customer_id == cust.id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    new_complaint = Complaint(
        booking_id=booking.id,
        customer_id=cust.id,
        subject=req.subject,
        description=req.description,
        status="Open"
    )
    db.add(new_complaint)
    db.commit()
    return {"message": "Complaint registered successfully. Admin will review.", "complaint_id": new_complaint.id}

@router.get("/complaints")
def list_complaints(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role == "admin":
        complaints = db.query(Complaint).order_by(Complaint.id.desc()).all()
    elif current_user.role == "customer":
        cust = current_user.customer_profile
        complaints = db.query(Complaint).filter(Complaint.customer_id == cust.id).all()
    else:
        complaints = []

    res = []
    for c in complaints:
        b = c.booking
        cust_user = c.customer.user if c.customer else None
        res.append({
            "id": c.id,
            "booking_id": c.booking_id,
            "booking_code": b.booking_code if b else "N/A",
            "service_name": b.service.name if b and b.service else "Service",
            "customer_name": cust_user.full_name if cust_user else "Customer",
            "subject": c.subject,
            "description": c.description,
            "status": c.status,
            "resolution_notes": c.resolution_notes,
            "created_at": c.created_at,
            "resolved_at": c.resolved_at
        })
    return res

@router.put("/complaints/{complaint_id}/resolve")
def resolve_complaint(complaint_id: int, req: ComplaintResolve, current_user: User = Depends(require_admin), db: Session = Depends(get_db)):
    comp = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not comp:
        raise HTTPException(status_code=404, detail="Complaint not found")

    comp.status = req.status
    comp.resolution_notes = req.resolution_notes
    comp.resolved_at = datetime.datetime.utcnow()

    # Notify customer
    if comp.customer and comp.customer.user:
        db.add(Notification(
            user_id=comp.customer.user.id,
            title=f"Complaint #{comp.id} {req.status}",
            message=f"Your complaint regarding booking {comp.booking.booking_code if comp.booking else ''} has been {req.status}. Admin remarks: {req.resolution_notes}"
        ))

    db.commit()
    return {"message": f"Complaint {req.status} successfully"}

