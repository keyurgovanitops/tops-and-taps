from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from backend.app.database import get_db
from backend.app.models import (
    User, Customer, ServiceProvider, Technician, Booking, Payment, ProviderEarning, ServiceCategory, Review
)
from backend.app.auth import require_admin, require_provider, get_current_user

router = APIRouter(prefix="/api/analytics", tags=["Analytics & Reports"])

@router.get("/admin")
def get_admin_analytics(current_user: User = Depends(require_admin), db: Session = Depends(get_db)):
    total_customers = db.query(Customer).count()
    total_providers = db.query(ServiceProvider).count()
    total_technicians = db.query(Technician).count()
    total_bookings = db.query(Booking).count()

    pending_bookings = db.query(Booking).filter(Booking.status == "Pending").count()
    completed_bookings = db.query(Booking).filter(Booking.status == "Completed").count()
    cancelled_bookings = db.query(Booking).filter(Booking.status == "Cancelled").count()

    total_revenue = db.query(func.sum(Booking.final_amount)).filter(Booking.status == "Completed").scalar() or 0.0
    platform_commission = db.query(func.sum(Booking.commission_amount)).filter(Booking.status == "Completed").scalar() or 0.0
    provider_earnings = total_revenue - platform_commission

    # Popular categories breakdown
    categories = db.query(ServiceCategory).all()
    category_stats = []
    for cat in categories:
        booking_count = (
            db.query(Booking)
            .join(Booking.service)
            .filter(Booking.service.has(category_id=cat.id))
            .count()
        )
        category_stats.append({
            "category_name": cat.name,
            "bookings_count": booking_count
        })

    return {
        "overview": {
            "total_customers": total_customers,
            "total_providers": total_providers,
            "total_technicians": total_technicians,
            "total_bookings": total_bookings,
            "pending_bookings": pending_bookings,
            "completed_bookings": completed_bookings,
            "cancelled_bookings": cancelled_bookings,
            "total_revenue": round(total_revenue, 2),
            "platform_commission": round(platform_commission, 2),
            "provider_earnings": round(provider_earnings, 2)
        },
        "popular_categories": category_stats
    }

@router.get("/provider")
def get_provider_analytics(current_user: User = Depends(require_provider), db: Session = Depends(get_db)):
    prov = current_user.provider_profile
    total_bookings = db.query(Booking).filter(Booking.provider_id == prov.id).count()
    pending_bookings = db.query(Booking).filter(Booking.provider_id == prov.id, Booking.status == "Pending").count()
    completed_bookings = db.query(Booking).filter(Booking.provider_id == prov.id, Booking.status == "Completed").count()

    total_gross = (
        db.query(func.sum(ProviderEarning.gross_amount))
        .filter(ProviderEarning.provider_id == prov.id)
        .scalar() or 0.0
    )
    total_commission = (
        db.query(func.sum(ProviderEarning.platform_commission))
        .filter(ProviderEarning.provider_id == prov.id)
        .scalar() or 0.0
    )
    total_net = (
        db.query(func.sum(ProviderEarning.net_earning))
        .filter(ProviderEarning.provider_id == prov.id)
        .scalar() or 0.0
    )

    return {
        "total_bookings": total_bookings,
        "pending_requests": pending_bookings,
        "completed_services": completed_bookings,
        "total_gross_revenue": round(total_gross, 2),
        "total_commission_deducted": round(total_commission, 2),
        "total_net_earnings": round(total_net, 2),
        "average_rating": prov.rating,
        "total_reviews": prov.total_reviews
    }

