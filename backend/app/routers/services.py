from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from backend.app.database import get_db
from backend.app.models import ServiceCategory, Service, ProviderService, ServiceProvider, User
from backend.app.schemas import ServiceCategoryCreate, ServiceCreate, ServiceResponse, ServiceCategoryResponse
from backend.app.auth import require_admin

router = APIRouter(prefix="/api/services", tags=["Services & Categories"])

@router.get("/categories", response_model=List[ServiceCategoryResponse])
def get_categories(db: Session = Depends(get_db)):
    return db.query(ServiceCategory).filter(ServiceCategory.is_active == True).all()

@router.post("/categories", response_model=ServiceCategoryResponse)
def create_category(cat: ServiceCategoryCreate, current_user: User = Depends(require_admin), db: Session = Depends(get_db)):
    existing = db.query(ServiceCategory).filter(ServiceCategory.slug == cat.slug).first()
    if existing:
        raise HTTPException(status_code=400, detail="Category with this slug already exists")
    new_cat = ServiceCategory(**cat.dict())
    db.add(new_cat)
    db.commit()
    db.refresh(new_cat)
    return new_cat

@router.get("", response_model=List[ServiceResponse])
def list_services(
    category_id: Optional[int] = None,
    subcategory: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Service).filter(Service.is_active == True)
    if category_id:
        query = query.filter(Service.category_id == category_id)
    if subcategory:
        query = query.filter(Service.subcategory.ilike(f"%{subcategory}%"))
    if search:
        query = query.filter(
            (Service.name.ilike(f"%{search}%")) | (Service.description.ilike(f"%{search}%"))
        )
    return query.all()

@router.get("/{service_id}")
def get_service_detail(service_id: int, db: Session = Depends(get_db)):
    service = db.query(Service).filter(Service.id == service_id, Service.is_active == True).first()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    
    # Get available providers offering this service
    offered_providers = (
        db.query(ServiceProvider, ProviderService)
        .join(ProviderService, ProviderService.provider_id == ServiceProvider.id)
        .filter(
            ProviderService.service_id == service_id,
            ProviderService.is_offered == True,
            ServiceProvider.verification_status == "approved"
        )
        .all()
    )

    providers_list = []
    for prov, ps in offered_providers:
        user = prov.user
        providers_list.append({
            "id": prov.id,
            "business_name": prov.business_name,
            "description": prov.description,
            "rating": prov.rating,
            "total_reviews": prov.total_reviews,
            "price": ps.custom_price or service.base_price,
            "contact_phone": user.phone if user else None,
            "slots": [
                {
                    "id": s.id,
                    "day_of_week": s.day_of_week,
                    "start_time": s.start_time,
                    "end_time": s.end_time
                } for s in prov.availability_slots if s.is_active
            ]
        })

    return {
        "id": service.id,
        "name": service.name,
        "category_id": service.category_id,
        "category_name": service.category.name if service.category else None,
        "subcategory": service.subcategory,
        "description": service.description,
        "base_price": service.base_price,
        "duration_mins": service.duration_mins,
        "image_url": service.image_url,
        "available_providers": providers_list
    }

@router.post("", response_model=ServiceResponse)
def create_service(srv: ServiceCreate, current_user: User = Depends(require_admin), db: Session = Depends(get_db)):
    new_srv = Service(**srv.dict())
    db.add(new_srv)
    db.commit()
    db.refresh(new_srv)
    return new_srv

