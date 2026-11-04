from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
import os
import uuid
from backend.app.database import get_db
from backend.app.models import (
    User, ServiceProvider, ProviderService, ServiceArea, AvailabilitySlot, ProviderEarning, Notification, Service
)
from backend.app.schemas import (
    ProviderServiceUpdate, ServiceAreaCreate, AvailabilitySlotCreate, ProviderVerifyRequest
)
from backend.app.auth import require_provider, require_admin, get_current_user
from backend.app.config import UPLOAD_DIR

router = APIRouter(prefix="/api/providers", tags=["Service Providers"])

@router.get("/profile")
def get_provider_profile(current_user: User = Depends(require_provider), db: Session = Depends(get_db)):
    prov = current_user.provider_profile
    if not prov:
        raise HTTPException(status_code=404, detail="Provider profile not found")
    
    # Get all offered services
    services_offered = []
    for ps in prov.provider_services:
        if ps.is_offered and ps.service:
            services_offered.append({
                "service_id": ps.service.id,
                "name": ps.service.name,
                "category": ps.service.category.name if ps.service.category else None,
                "base_price": ps.service.base_price,
                "custom_price": ps.custom_price
            })

    return {
        "id": prov.id,
        "business_name": prov.business_name,
        "description": prov.description,
        "id_proof_url": prov.id_proof_url,
        "verification_status": prov.verification_status,
        "rating": prov.rating,
        "total_reviews": prov.total_reviews,
        "commission_rate": prov.commission_rate,
        "is_available": prov.is_available,
        "offered_services": services_offered,
        "service_areas": [{"id": a.id, "city": a.city, "pincode": a.pincode} for a in prov.service_areas],
        "slots": [{"id": s.id, "day": s.day_of_week, "start": s.start_time, "end": s.end_time} for s in prov.availability_slots],
        "technicians_count": len(prov.technicians)
    }

@router.post("/upload-document")
async def upload_kyc_document(file: UploadFile = File(...), current_user: User = Depends(require_provider), db: Session = Depends(get_db)):
    prov = current_user.provider_profile
    content = await file.read()
    from backend.app.storage import upload_media_file
    image_url = upload_media_file(content, file.filename, folder="provider_kyc")
    
    prov.id_proof_url = image_url
    prov.verification_status = "pending"
    db.commit()

    return {"message": "KYC document uploaded successfully. Awaiting Admin review.", "url": prov.id_proof_url}

@router.put("/services")
def update_provider_services(updates: List[ProviderServiceUpdate], current_user: User = Depends(require_provider), db: Session = Depends(get_db)):
    prov = current_user.provider_profile
    for item in updates:
        ps = db.query(ProviderService).filter(
            ProviderService.provider_id == prov.id,
            ProviderService.service_id == item.service_id
        ).first()
        if ps:
            ps.custom_price = item.custom_price
            ps.is_offered = item.is_offered
        else:
            new_ps = ProviderService(
                provider_id=prov.id,
                service_id=item.service_id,
                custom_price=item.custom_price,
                is_offered=item.is_offered
            )
            db.add(new_ps)
    db.commit()
    return {"message": "Services updated successfully"}

@router.post("/service-areas")
def add_service_area(area: ServiceAreaCreate, current_user: User = Depends(require_provider), db: Session = Depends(get_db)):
    prov = current_user.provider_profile
    new_area = ServiceArea(provider_id=prov.id, city=area.city, pincode=area.pincode)
    db.add(new_area)
    db.commit()
    return {"message": "Service area added"}

@router.post("/slots")
def add_availability_slot(slot: AvailabilitySlotCreate, current_user: User = Depends(require_provider), db: Session = Depends(get_db)):
    prov = current_user.provider_profile
    new_slot = AvailabilitySlot(
        provider_id=prov.id,
        day_of_week=slot.day_of_week,
        start_time=slot.start_time,
        end_time=slot.end_time
    )
    db.add(new_slot)
    db.commit()
    return {"message": "Slot added successfully"}

@router.get("/earnings")
def get_provider_earnings(current_user: User = Depends(require_provider), db: Session = Depends(get_db)):
    prov = current_user.provider_profile
    earnings = db.query(ProviderEarning).filter(ProviderEarning.provider_id == prov.id).all()
    total_gross = sum(e.gross_amount for e in earnings)
    total_commission = sum(e.platform_commission for e in earnings)
    total_net = sum(e.net_earning for e in earnings)

    return {
        "summary": {
            "total_gross": round(total_gross, 2),
            "total_commission": round(total_commission, 2),
            "total_net": round(total_net, 2),
            "total_payouts_processed": len(earnings)
        },
        "records": [
            {
                "id": e.id,
                "booking_id": e.booking_id,
                "gross_amount": e.gross_amount,
                "platform_commission": e.platform_commission,
                "net_earning": e.net_earning,
                "payout_status": e.payout_status,
                "created_at": e.created_at
            } for e in earnings
        ]
    }

# Admin Provider Endpoints
@router.get("/all")
def list_all_providers(current_user: User = Depends(require_admin), db: Session = Depends(get_db)):
    providers = db.query(ServiceProvider).all()
    res = []
    for p in providers:
        res.append({
            "id": p.id,
            "user_id": p.user_id,
            "full_name": p.user.full_name if p.user else "N/A",
            "email": p.user.email if p.user else "N/A",
            "phone": p.user.phone if p.user else "N/A",
            "business_name": p.business_name,
            "description": p.description,
            "id_proof_url": p.id_proof_url,
            "verification_status": p.verification_status,
            "rating": p.rating,
            "total_reviews": p.total_reviews,
            "commission_rate": p.commission_rate,
            "created_at": p.created_at
        })
    return res

@router.put("/{provider_id}/verify")
def verify_provider(provider_id: int, req: ProviderVerifyRequest, current_user: User = Depends(require_admin), db: Session = Depends(get_db)):
    prov = db.query(ServiceProvider).filter(ServiceProvider.id == provider_id).first()
    if not prov:
        raise HTTPException(status_code=404, detail="Provider not found")
    
    prov.verification_status = req.status
    
    # Notify provider
    notif = Notification(
        user_id=prov.user_id,
        title=f"Account Verification: {req.status.capitalize()}",
        message=f"Your Service Provider account has been {req.status} by the platform administrator."
    )
    db.add(notif)
    db.commit()

    return {"message": f"Provider account {req.status} successfully."}

