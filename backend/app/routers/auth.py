from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models import User, Customer, ServiceProvider, Technician, Notification
from backend.app.schemas import UserRegisterRequest, UserLoginRequest, TokenResponse, UserResponse
from backend.app.auth import hash_password, verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/register", response_model=TokenResponse)
def register_user(req: UserRegisterRequest, db: Session = Depends(get_db)):
    # Check if email exists
    if db.query(User).filter(User.email == req.email.lower()).first():
        raise HTTPException(status_code=400, detail="An account with this email already exists.")
    
    if req.phone and db.query(User).filter(User.phone == req.phone).first():
        raise HTTPException(status_code=400, detail="An account with this phone number already exists.")

    new_user = User(
        email=req.email.lower(),
        phone=req.phone,
        hashed_password=hash_password(req.password),
        role=req.role.lower(),
        full_name=req.full_name
    )
    db.add(new_user)
    db.flush()

    # Create associated role profiles
    if new_user.role == "customer":
        cust = Customer(user_id=new_user.id)
        db.add(cust)
    elif new_user.role == "provider":
        prov = ServiceProvider(
            user_id=new_user.id,
            business_name=req.business_name or f"{req.full_name}'s Services",
            description=req.description or "Professional Home Services Provider",
            verification_status="pending"
        )
        db.add(prov)
    elif new_user.role == "technician":
        tech = Technician(
            user_id=new_user.id,
            specialization=req.specialization or "Multi-skilled Technician"
        )
        db.add(tech)

    # Welcome notification
    welcome_notif = Notification(
        user_id=new_user.id,
        title="Welcome to TOPS & Taps!",
        message=f"Welcome {new_user.full_name}! Your {new_user.role} account is now active and ready."
    )
    db.add(welcome_notif)
    db.commit()
    db.refresh(new_user)

    token = create_access_token({"sub": str(new_user.id), "role": new_user.role})
    
    # User dict info
    user_info = {
        "id": new_user.id,
        "email": new_user.email,
        "phone": new_user.phone,
        "full_name": new_user.full_name,
        "role": new_user.role
    }
    if new_user.role == "provider" and new_user.provider_profile:
        user_info["provider_id"] = new_user.provider_profile.id
        user_info["verification_status"] = new_user.provider_profile.verification_status
    elif new_user.role == "customer" and new_user.customer_profile:
        user_info["customer_id"] = new_user.customer_profile.id
    elif new_user.role == "technician" and new_user.technician_profile:
        user_info["technician_id"] = new_user.technician_profile.id

    return {"access_token": token, "token_type": "bearer", "user": user_info}

@router.post("/login", response_model=TokenResponse)
def login_user(req: UserLoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email.lower()).first()
    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Invalid email or password.")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is deactivated. Contact support.")

    token = create_access_token({"sub": str(user.id), "role": user.role})
    user_info = {
        "id": user.id,
        "email": user.email,
        "phone": user.phone,
        "full_name": user.full_name,
        "role": user.role
    }
    if user.role == "provider" and user.provider_profile:
        user_info["provider_id"] = user.provider_profile.id
        user_info["verification_status"] = user.provider_profile.verification_status
    elif user.role == "customer" and user.customer_profile:
        user_info["customer_id"] = user.customer_profile.id
    elif user.role == "technician" and user.technician_profile:
        user_info["technician_id"] = user.technician_profile.id

    return {"access_token": token, "token_type": "bearer", "user": user_info}

@router.get("/me")
def get_my_profile(current_user: User = Depends(get_current_user)):
    user_info = {
        "id": current_user.id,
        "email": current_user.email,
        "phone": current_user.phone,
        "full_name": current_user.full_name,
        "role": current_user.role,
        "created_at": current_user.created_at
    }
    if current_user.role == "customer" and current_user.customer_profile:
        user_info["customer_id"] = current_user.customer_profile.id
    elif current_user.role == "provider" and current_user.provider_profile:
        user_info["provider_id"] = current_user.provider_profile.id
        user_info["business_name"] = current_user.provider_profile.business_name
        user_info["verification_status"] = current_user.provider_profile.verification_status
        user_info["rating"] = current_user.provider_profile.rating
    elif current_user.role == "technician" and current_user.technician_profile:
        user_info["technician_id"] = current_user.technician_profile.id
        user_info["specialization"] = current_user.technician_profile.specialization

    return user_info

@router.post("/forgot-password")
def forgot_password_simulation(data: dict):
    # Simulated password reset sending
    email = data.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="Email is required.")
    return {"message": f"Password reset instructions have been sent to {email}."}

