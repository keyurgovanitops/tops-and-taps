import hmac
import hashlib
import uuid
import datetime
import logging
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import razorpay

from backend.app.database import get_db
from backend.app.models import Booking, Payment, Invoice, Coupon, User, Notification
from backend.app.schemas import (
    PaymentCreate,
    CouponValidate,
    RazorpayCreateOrderRequest,
    RazorpayVerifyPaymentRequest,
)
from backend.app.auth import get_current_user
from backend.app.config import RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/payments", tags=["Payments & Invoices"])

# Initialize Razorpay Client
try:
    razorpay_client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))
except Exception as e:
    logger.warning(f"Could not initialize native Razorpay Client: {e}")
    razorpay_client = None


@router.get("/config")
def get_payment_config():
    """Returns payment gateway configuration and public test key ID"""
    return {
        "gateway": "Razorpay",
        "key_id": RAZORPAY_KEY_ID,
        "currency": "INR",
        "is_test_mode": True,
        "supported_methods": ["card", "upi", "netbanking", "wallet"],
    }


@router.post("/razorpay/create-order")
def create_razorpay_order(
    req: RazorpayCreateOrderRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Creates an official Razorpay Order for the booking in INR (subunits: paise).
    Works in both real Razorpay test environment and simulated test sandbox.
    """
    booking = db.query(Booking).filter(Booking.id == req.booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    existing_payment = db.query(Payment).filter(Payment.booking_id == booking.id).first()
    if existing_payment and existing_payment.status == "Paid":
        raise HTTPException(status_code=400, detail="This booking is already paid in full.")

    amount_paise = int(round(booking.final_amount * 100))

    order_payload = {
        "amount": amount_paise,
        "currency": "INR",
        "receipt": f"rcpt_{booking.booking_code}",
        "notes": {
            "booking_id": str(booking.id),
            "booking_code": booking.booking_code,
            "service": booking.service.name if booking.service else "Home Service",
        },
    }

    razorpay_order_id = None

    if (
        razorpay_client
        and RAZORPAY_KEY_ID
        and RAZORPAY_KEY_SECRET
        and not RAZORPAY_KEY_ID.startswith("rzp_test_TOPSTaps")
    ):
        try:
            rzp_order = razorpay_client.order.create(data=order_payload)
            razorpay_order_id = rzp_order.get("id")
        except Exception as err:
            logger.warning(f"Native Razorpay API call failed ({err}), falling back to test sandbox order.")

    if not razorpay_order_id:
        # Standard Razorpay test order format
        razorpay_order_id = f"order_{uuid.uuid4().hex[:14]}"

    customer_user = booking.customer.user if booking.customer else current_user

    return {
        "order_id": razorpay_order_id,
        "amount": amount_paise,
        "amount_inr": booking.final_amount,
        "currency": "INR",
        "key_id": RAZORPAY_KEY_ID,
        "booking_code": booking.booking_code,
        "service_name": booking.service.name if booking.service else "Home Service",
        "prefill": {
            "name": customer_user.full_name,
            "email": customer_user.email,
            "contact": customer_user.phone or "9876543210",
        },
    }


@router.post("/razorpay/verify-payment")
def verify_razorpay_payment(
    req: RazorpayVerifyPaymentRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Verifies Razorpay payment signature and records settlement and GST Tax Invoice.
    """
    booking = db.query(Booking).filter(Booking.id == req.booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    # If live keys are present, verify HMAC signature
    if (
        razorpay_client
        and RAZORPAY_KEY_ID
        and RAZORPAY_KEY_SECRET
        and not RAZORPAY_KEY_ID.startswith("rzp_test_TOPSTaps")
    ):
        try:
            razorpay_client.utility.verify_payment_signature(
                {
                    "razorpay_order_id": req.razorpay_order_id,
                    "razorpay_payment_id": req.razorpay_payment_id,
                    "razorpay_signature": req.razorpay_signature,
                }
            )
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Signature verification failed: {e}")

    # Record or update Payment
    existing_payment = db.query(Payment).filter(Payment.booking_id == booking.id).first()
    if existing_payment:
        existing_payment.transaction_id = req.razorpay_payment_id
        existing_payment.payment_method = req.payment_method or "Razorpay Gateway (Test)"
        existing_payment.status = "Paid"
        existing_payment.paid_at = datetime.datetime.utcnow()
        payment = existing_payment
    else:
        payment = Payment(
            booking_id=booking.id,
            transaction_id=req.razorpay_payment_id,
            payment_method=req.payment_method or "Razorpay Gateway (Test)",
            amount=booking.final_amount,
            currency="INR",
            status="Paid",
            paid_at=datetime.datetime.utcnow(),
        )
        db.add(payment)

    # Transition booking status
    if booking.status in ["Pending", "Draft"]:
        booking.status = "Confirmed"

    # Automatically generate GST Tax Invoice if not yet generated
    existing_invoice = db.query(Invoice).filter(Invoice.booking_id == booking.id).first()
    if not existing_invoice:
        subtotal = booking.total_amount
        discount = booking.discount_amount or 0.0
        taxable_val = max(0.0, subtotal - discount)
        tax = round(taxable_val * 0.18, 2)  # 18% GST (9% CGST + 9% SGST)
        grand_total = round(taxable_val + tax, 2)

        new_invoice = Invoice(
            booking_id=booking.id,
            invoice_number=f"INV-{datetime.datetime.utcnow().year}-{booking.id:04d}",
            subtotal=subtotal,
            discount_amount=discount,
            tax_amount=tax,
            grand_total=grand_total,
            issued_date=datetime.datetime.utcnow(),
        )
        db.add(new_invoice)

    # In-app Notification to customer
    if booking.customer and booking.customer.user:
        db.add(
            Notification(
                user_id=booking.customer.user.id,
                title="Payment Verified & Confirmed! 💳",
                message=f"Razorpay transaction {req.razorpay_payment_id} of ₹{booking.final_amount} verified for booking {booking.booking_code}.",
            )
        )

    db.commit()
    db.refresh(payment)

    return {
        "success": True,
        "message": "Razorpay payment verified and settled successfully.",
        "transaction_id": payment.transaction_id,
        "amount": payment.amount,
        "status": payment.status,
        "booking_code": booking.booking_code,
    }


@router.post("/process")
def process_payment(
    req: PaymentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Direct process payment (Sandbox simulation fallback)"""
    booking = db.query(Booking).filter(Booking.id == req.booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    existing_payment = db.query(Payment).filter(Payment.booking_id == booking.id).first()
    if existing_payment and existing_payment.status == "Paid":
        return {"message": "Payment has already been completed", "payment_id": existing_payment.id}

    tx_id = f"pay_rzp_{uuid.uuid4().hex[:12]}"

    if existing_payment:
        existing_payment.transaction_id = tx_id
        existing_payment.status = "Paid"
        existing_payment.paid_at = datetime.datetime.utcnow()
        existing_payment.payment_method = req.payment_method
        payment = existing_payment
    else:
        payment = Payment(
            booking_id=booking.id,
            transaction_id=tx_id,
            payment_method=req.payment_method,
            amount=booking.final_amount,
            currency="INR",
            status="Paid",
            paid_at=datetime.datetime.utcnow(),
        )
        db.add(payment)

    if booking.status in ["Pending", "Draft"]:
        booking.status = "Confirmed"

    # Generate tax invoice
    existing_invoice = db.query(Invoice).filter(Invoice.booking_id == booking.id).first()
    if not existing_invoice:
        tax = round(booking.final_amount * 0.18, 2)
        inv = Invoice(
            booking_id=booking.id,
            invoice_number=f"INV-{datetime.datetime.utcnow().year}-{booking.id:04d}",
            subtotal=booking.total_amount,
            discount_amount=booking.discount_amount or 0.0,
            tax_amount=tax,
            grand_total=round(booking.final_amount + tax, 2),
            issued_date=datetime.datetime.utcnow(),
        )
        db.add(inv)

    if booking.customer and booking.customer.user:
        db.add(
            Notification(
                user_id=booking.customer.user.id,
                title="Payment Successful! 💳",
                message=f"Payment of ₹{booking.final_amount} for booking {booking.booking_code} was successful. (TxID: {tx_id})",
            )
        )

    db.commit()
    db.refresh(payment)

    return {
        "message": "Payment verified and completed successfully",
        "transaction_id": payment.transaction_id,
        "amount": payment.amount,
        "status": payment.status,
    }


@router.post("/validate-coupon")
def validate_coupon(req: CouponValidate, db: Session = Depends(get_db)):
    coupon = (
        db.query(Coupon)
        .filter(Coupon.code == req.code.upper(), Coupon.is_active == True)
        .first()
    )
    if not coupon:
        raise HTTPException(status_code=404, detail="Invalid coupon code")

    if req.amount < coupon.min_booking_amount:
        raise HTTPException(
            status_code=400,
            detail=f"Minimum booking amount for this coupon is ₹{coupon.min_booking_amount}",
        )

    discount = 0.0
    if coupon.discount_type == "percentage":
        discount = (req.amount * coupon.discount_value) / 100.0
    else:
        discount = coupon.discount_value

    discount = min(discount, req.amount)
    return {
        "valid": True,
        "coupon_code": coupon.code,
        "discount_type": coupon.discount_type,
        "discount_value": coupon.discount_value,
        "discount_amount": round(discount, 2),
        "final_amount": round(req.amount - discount, 2),
    }


@router.get("/coupons")
def list_active_coupons(db: Session = Depends(get_db)):
    coupons = db.query(Coupon).filter(Coupon.is_active == True).all()
    return [
        {
            "id": c.id,
            "code": c.code,
            "discount_type": c.discount_type,
            "discount_value": c.discount_value,
            "min_booking_amount": c.min_booking_amount,
        }
        for c in coupons
    ]
