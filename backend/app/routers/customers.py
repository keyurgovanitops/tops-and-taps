from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models import User, Customer, Address
from backend.app.schemas import AddressCreate, AddressResponse
from backend.app.auth import get_current_user, require_customer

router = APIRouter(prefix="/api/customers", tags=["Customers"])

@router.get("/profile")
def get_customer_profile(current_user: User = Depends(require_customer), db: Session = Depends(get_db)):
    cust = current_user.customer_profile
    if not cust:
        raise HTTPException(status_code=404, detail="Customer profile not found")
    return {
        "id": cust.id,
        "full_name": current_user.full_name,
        "email": current_user.email,
        "phone": current_user.phone,
        "avatar_url": cust.avatar_url,
        "notes": cust.notes,
        "addresses": [
            {
                "id": a.id,
                "title": a.title,
                "address_line": a.address_line,
                "city": a.city,
                "pincode": a.pincode,
                "is_default": a.is_default
            } for a in cust.addresses
        ]
    }

@router.get("/addresses")
def get_customer_addresses(current_user: User = Depends(require_customer), db: Session = Depends(get_db)):
    cust = current_user.customer_profile
    if not cust:
        raise HTTPException(status_code=404, detail="Customer profile not found")
    return [
        {
            "id": a.id,
            "title": a.title,
            "address_line": a.address_line,
            "city": a.city,
            "pincode": a.pincode,
            "is_default": a.is_default
        } for a in cust.addresses
    ]

@router.post("/addresses", response_model=AddressResponse)
def add_customer_address(addr: AddressCreate, current_user: User = Depends(require_customer), db: Session = Depends(get_db)):
    cust = current_user.customer_profile
    if not cust:
        raise HTTPException(status_code=404, detail="Customer profile not found")

    if addr.is_default:
        # unset previous default
        for a in cust.addresses:
            a.is_default = False

    new_addr = Address(
        customer_id=cust.id,
        title=addr.title,
        address_line=addr.address_line,
        city=addr.city,
        pincode=addr.pincode,
        is_default=addr.is_default or (len(cust.addresses) == 0)
    )
    db.add(new_addr)
    db.commit()
    db.refresh(new_addr)
    return new_addr

@router.delete("/addresses/{address_id}")
def delete_customer_address(address_id: int, current_user: User = Depends(require_customer), db: Session = Depends(get_db)):
    cust = current_user.customer_profile
    addr = db.query(Address).filter(Address.id == address_id, Address.customer_id == cust.id).first()
    if not addr:
        raise HTTPException(status_code=404, detail="Address not found")
    db.delete(addr)
    db.commit()
    return {"message": "Address deleted successfully"}


@router.get("/all")
def list_all_customers(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Admin endpoint: lists all customers across the platform"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Super Admin privilege required")
    
    customers = db.query(Customer).all()
    results = []
    for c in customers:
        results.append({
            "id": c.id,
            "user_id": c.user_id,
            "full_name": c.user.full_name if c.user else "Customer",
            "email": c.user.email if c.user else "",
            "phone": c.user.phone if c.user else "",
            "is_active": c.user.is_active if c.user else True,
            "total_bookings": len(c.bookings),
            "total_addresses": len(c.addresses),
            "created_at": c.user.created_at.isoformat() if c.user and c.user.created_at else None
        })
    return results


@router.put("/{user_id}/status")
def toggle_customer_status(user_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Admin endpoint: toggles customer active / deactivated status"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Super Admin privilege required")
    
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    target_user.is_active = not target_user.is_active
    db.commit()
    return {
        "message": f"User status updated to {'Active' if target_user.is_active else 'Deactivated'}",
        "is_active": target_user.is_active
    }


