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

