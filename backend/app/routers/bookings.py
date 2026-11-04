from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
import datetime
import uuid
import os
from backend.app.database import get_db
from backend.app.models import (
    User, Customer, ServiceProvider, Service, Address, Booking, BookingAssignment,
    BookingImage, Payment, Invoice, Coupon, Notification, ProviderEarning
)
from backend.app.schemas import (
    BookingCreate, BookingStatusUpdate, BookingReschedule, AssignTechnicianRequest
)
from backend.app.auth import get_current_user, require_customer, require_provider, require_admin
from backend.app.config import UPLOAD_DIR

router = APIRouter(prefix="/api/bookings", tags=["Bookings"])

@router.post("", status_code=201)
def create_booking(req: BookingCreate, current_user: User = Depends(require_customer), db: Session = Depends(get_db)):
    cust = current_user.customer_profile
    if not cust:
        raise HTTPException(status_code=400, detail="Customer profile required to make a booking")

    service = db.query(Service).filter(Service.id == req.service_id, Service.is_active == True).first()
    if not service:
        raise HTTPException(status_code=404, detail="Selected service does not exist")

    # Validate Address belongs to customer
    address = db.query(Address).filter(Address.id == req.address_id, Address.customer_id == cust.id).first()
    if not address:
        raise HTTPException(status_code=400, detail="Invalid address selection")

    # Provider selection
    provider = None
    if req.provider_id:
        provider = db.query(ServiceProvider).filter(
            ServiceProvider.id == req.provider_id,
            ServiceProvider.verification_status == "approved"
        ).first()
        if not provider:
            raise HTTPException(status_code=400, detail="Selected provider is not available or approved")

    # Double Booking Prevention Check:
    # If a provider is chosen, ensure provider doesn't already have an active booking at the same date and time slot
    if provider:
        existing_booking = db.query(Booking).filter(
            Booking.provider_id == provider.id,
            Booking.booking_date == req.booking_date,
            Booking.time_slot == req.time_slot,
            Booking.status.in_(["Pending", "Confirmed", "Provider Assigned", "In Progress"])
        ).first()
        if existing_booking:
            raise HTTPException(
                status_code=409,
                detail=f"This time slot ({req.time_slot} on {req.booking_date}) is already booked for this provider. Please select another slot."
            )

    # Calculate pricing
    total_amount = service.base_price
    discount_amount = 0.0

    # Apply Coupon if provided
    if req.coupon_code:
        coupon = db.query(Coupon).filter(
            Coupon.code == req.coupon_code.upper(),
            Coupon.is_active == True
        ).first()
        if coupon and total_amount >= coupon.min_booking_amount:
            if coupon.discount_type == "percentage":
                discount_amount = (total_amount * coupon.discount_value) / 100.0
            else:
                discount_amount = coupon.discount_value

    final_amount = max(0.0, total_amount - discount_amount)
    commission_rate = provider.commission_rate if provider else 15.0
    commission_amount = (final_amount * commission_rate) / 100.0

    # Generate unique Booking Code
    booking_code = f"BK-{uuid.uuid4().hex[:8].upper()}"

    new_booking = Booking(
        booking_code=booking_code,
        customer_id=cust.id,
        provider_id=provider.id if provider else None,
        service_id=service.id,
        address_id=address.id,
        booking_date=req.booking_date,
        time_slot=req.time_slot,
        problem_description=req.problem_description,
        status="Pending",
        total_amount=round(total_amount, 2),
        discount_amount=round(discount_amount, 2),
        final_amount=round(final_amount, 2),
        commission_amount=round(commission_amount, 2)
    )
    db.add(new_booking)
    db.flush()

    # Generate Invoice record
    inv_num = f"INV-{uuid.uuid4().hex[:6].upper()}"
    invoice = Invoice(
        booking_id=new_booking.id,
        invoice_number=inv_num,
        subtotal=round(total_amount, 2),
        discount_amount=round(discount_amount, 2),
        tax_amount=round(final_amount * 0.18, 2), # 18% GST simulation
        grand_total=round(final_amount * 1.18, 2)
    )
    db.add(invoice)

    # Notifications
    db.add(Notification(
        user_id=current_user.id,
        title="Booking Placed Successfully",
        message=f"Your booking {booking_code} for {service.name} has been placed. Status: Pending."
    ))
    if provider and provider.user:
        db.add(Notification(
            user_id=provider.user.id,
            title="New Booking Request!",
            message=f"You have received a new booking request ({booking_code}) for {service.name} on {req.booking_date} ({req.time_slot})."
        ))

    db.commit()
    db.refresh(new_booking)

    return {
        "message": "Booking created successfully",
        "booking_id": new_booking.id,
        "booking_code": new_booking.booking_code,
        "final_amount": new_booking.final_amount,
        "status": new_booking.status
    }

@router.get("/my-bookings")
def get_customer_bookings(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role == "customer":
        cust = current_user.customer_profile
        bookings = db.query(Booking).filter(Booking.customer_id == cust.id).order_by(Booking.id.desc()).all()
    elif current_user.role == "provider":
        prov = current_user.provider_profile
        bookings = db.query(Booking).filter(Booking.provider_id == prov.id).order_by(Booking.id.desc()).all()
    elif current_user.role == "admin":
        bookings = db.query(Booking).order_by(Booking.id.desc()).all()
    else:
        bookings = []

    res = []
    for b in bookings:
        cust_user = b.customer.user if b.customer else None
        prov_user = b.provider.user if b.provider else None
        tech_assigned = None
        if b.assignment and b.assignment.technician and b.assignment.technician.user:
            tech_assigned = {
                "id": b.assignment.technician.id,
                "name": b.assignment.technician.user.full_name,
                "phone": b.assignment.technician.user.phone,
                "status": b.assignment.status,
                "notes": b.assignment.technician_notes
            }

        res.append({
            "id": b.id,
            "booking_code": b.booking_code,
            "service_id": b.service_id,
            "service_name": b.service.name if b.service else "Service",
            "category_name": b.service.category.name if b.service and b.service.category else None,
            "customer_name": cust_user.full_name if cust_user else "Customer",
            "customer_phone": cust_user.phone if cust_user else "N/A",
            "provider_id": b.provider_id,
            "provider_name": b.provider.business_name if b.provider else "Unassigned",
            "address": f"{b.address.address_line}, {b.address.city} - {b.address.pincode}" if b.address else "Address",
            "booking_date": b.booking_date,
            "time_slot": b.time_slot,
            "problem_description": b.problem_description,
            "status": b.status,
            "total_amount": b.total_amount,
            "discount_amount": b.discount_amount,
            "final_amount": b.final_amount,
            "created_at": b.created_at,
            "payment": {
                "id": b.payment.id,
                "status": b.payment.status,
                "transaction_id": b.payment.transaction_id,
                "method": b.payment.payment_method
            } if b.payment else None,
            "invoice": {
                "invoice_number": b.invoice.invoice_number,
                "grand_total": b.invoice.grand_total,
                "tax_amount": b.invoice.tax_amount
            } if b.invoice else None,
            "assigned_technician": tech_assigned,
            "review": {
                "rating": b.review.rating,
                "comment": b.review.comment,
                "provider_reply": b.review.provider_reply
            } if b.review else None,
            "complaint": {
                "id": b.complaint.id,
                "subject": b.complaint.subject,
                "status": b.complaint.status,
                "resolution": b.complaint.resolution_notes
            } if b.complaint else None,
            "images": [{"id": img.id, "url": img.image_url, "type": img.image_type} for img in b.images]
        })
    return res

@router.put("/{booking_id}/status")
@router.patch("/{booking_id}/status")
def update_booking_status(booking_id: int, req: BookingStatusUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    old_status = booking.status
    booking.status = req.status

    # If completed, process provider earning
    if req.status == "Completed" and booking.provider_id:
        existing_earning = db.query(ProviderEarning).filter(ProviderEarning.booking_id == booking.id).first()
        if not existing_earning:
            net = booking.final_amount - booking.commission_amount
            earning = ProviderEarning(
                provider_id=booking.provider_id,
                booking_id=booking.id,
                gross_amount=booking.final_amount,
                platform_commission=booking.commission_amount,
                net_earning=round(net, 2),
                payout_status="Processed"
            )
            db.add(earning)

    # Notify customer
    if booking.customer and booking.customer.user:
        db.add(Notification(
            user_id=booking.customer.user.id,
            title=f"Booking Status Updated: {req.status}",
            message=f"Your booking {booking.booking_code} status has changed from {old_status} to {req.status}."
        ))

    db.commit()
    return {"message": f"Booking status updated to {req.status}", "status": booking.status}

@router.put("/{booking_id}/assign-technician")
def assign_technician(booking_id: int, req: AssignTechnicianRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    assignment = db.query(BookingAssignment).filter(BookingAssignment.booking_id == booking_id).first()
    if assignment:
        assignment.technician_id = req.technician_id
        assignment.status = "Assigned"
    else:
        assignment = BookingAssignment(
            booking_id=booking.id,
            technician_id=req.technician_id,
            status="Assigned"
        )
        db.add(assignment)

    booking.status = "Provider Assigned"

    # Notify technician
    tech = assignment.technician
    if tech and tech.user:
        db.add(Notification(
            user_id=tech.user.id,
            title="New Job Assigned!",
            message=f"You have been assigned to booking {booking.booking_code} on {booking.booking_date} ({booking.time_slot})."
        ))

    db.commit()
    return {"message": "Technician assigned successfully"}

@router.put("/{booking_id}/reschedule")
def reschedule_booking(booking_id: int, req: BookingReschedule, current_user: User = Depends(require_customer), db: Session = Depends(get_db)):
    cust = current_user.customer_profile
    booking = db.query(Booking).filter(Booking.id == booking_id, Booking.customer_id == cust.id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    if booking.status in ["In Progress", "Completed", "Cancelled"]:
        raise HTTPException(status_code=400, detail=f"Cannot reschedule booking that is {booking.status}")

    booking.booking_date = req.booking_date
    booking.time_slot = req.time_slot
    booking.status = "Pending"
    db.commit()

    return {"message": "Booking rescheduled successfully"}

@router.post("/{booking_id}/upload-problem-image")
async def upload_problem_image(
    booking_id: int,
    file: UploadFile = File(...),
    current_user: User = Depends(require_customer),
    db: Session = Depends(get_db)
):
    cust = current_user.customer_profile
    booking = db.query(Booking).filter(Booking.id == booking_id, Booking.customer_id == cust.id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    content = await file.read()
    from backend.app.storage import upload_media_file
    image_url = upload_media_file(content, file.filename, folder="problem_photos")

    new_img = BookingImage(
        booking_id=booking_id,
        image_url=image_url,
        image_type="problem"
    )
    db.add(new_img)
    db.commit()

    return {"message": "Problem image uploaded", "url": new_img.image_url}

@router.get("/{booking_id}/invoice")
def get_booking_invoice(booking_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking or not booking.invoice:
        raise HTTPException(status_code=404, detail="Invoice not found for this booking")
    inv = booking.invoice
    return {
        "invoice_number": inv.invoice_number,
        "booking_code": booking.booking_code,
        "service_name": booking.service.name if booking.service else "Home Service",
        "subtotal": inv.subtotal,
        "discount_amount": inv.discount_amount,
        "tax_amount": inv.tax_amount,
        "grand_total": inv.grand_total,
        "issued_date": getattr(inv, "issued_date", None)
    }

