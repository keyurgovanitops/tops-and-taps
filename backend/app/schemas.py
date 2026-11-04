from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

# Auth Schemas
class UserRegisterRequest(BaseModel):
    email: EmailStr
    phone: Optional[str] = None
    password: str
    full_name: str
    role: str = "customer" # admin, customer, provider, technician
    # Provider-specific fields
    business_name: Optional[str] = None
    description: Optional[str] = None
    # Technician-specific fields
    specialization: Optional[str] = None

class UserLoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict

class UserResponse(BaseModel):
    id: int
    email: str
    phone: Optional[str]
    full_name: str
    role: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

# Customer Schemas
class AddressCreate(BaseModel):
    title: str = "Home"
    address_line: str
    city: str
    pincode: str
    is_default: bool = False

class AddressResponse(AddressCreate):
    id: int
    customer_id: int

    class Config:
        from_attributes = True

# Service Schemas
class ServiceCategoryCreate(BaseModel):
    name: str
    slug: str
    icon: Optional[str] = "Wrench"
    description: Optional[str] = None
    image_url: Optional[str] = None

class ServiceCreate(BaseModel):
    category_id: int
    name: str
    subcategory: Optional[str] = None
    description: Optional[str] = None
    base_price: float
    duration_mins: int = 60
    image_url: Optional[str] = None

class ServiceResponse(BaseModel):
    id: int
    category_id: int
    name: str
    subcategory: Optional[str]
    description: Optional[str]
    base_price: float
    duration_mins: int
    image_url: Optional[str]
    is_active: bool

    class Config:
        from_attributes = True

class ServiceCategoryResponse(BaseModel):
    id: int
    name: str
    slug: str
    icon: Optional[str]
    description: Optional[str]
    image_url: Optional[str]
    services: List[ServiceResponse] = []

    class Config:
        from_attributes = True

# Provider Schemas
class ProviderServiceUpdate(BaseModel):
    service_id: int
    custom_price: Optional[float] = None
    is_offered: bool = True

class ServiceAreaCreate(BaseModel):
    city: str
    pincode: str

class AvailabilitySlotCreate(BaseModel):
    day_of_week: str
    start_time: str
    end_time: str

class ProviderVerifyRequest(BaseModel):
    status: str # approved, rejected

# Booking Schemas
class BookingCreate(BaseModel):
    service_id: int
    provider_id: Optional[int] = None
    address_id: int
    booking_date: str
    time_slot: str
    problem_description: Optional[str] = None
    coupon_code: Optional[str] = None

class BookingStatusUpdate(BaseModel):
    status: str # Confirmed, Cancelled, Rejected, In Progress, Completed

class BookingReschedule(BaseModel):
    booking_date: str
    time_slot: str

# Assignment Schemas
class AssignTechnicianRequest(BaseModel):
    technician_id: int

class TechnicianStatusUpdate(BaseModel):
    status: str # En Route, In Progress, Completed
    technician_notes: Optional[str] = None

# Payment & Invoice Schemas
class PaymentCreate(BaseModel):
    booking_id: int
    payment_method: str = "Razorpay Test Mode"

class RazorpayCreateOrderRequest(BaseModel):
    booking_id: int

class RazorpayVerifyPaymentRequest(BaseModel):
    booking_id: int
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str
    payment_method: Optional[str] = "Razorpay Test"

class CouponValidate(BaseModel):
    code: str
    amount: float

# Review & Complaint Schemas
class ReviewCreate(BaseModel):
    booking_id: int
    rating: int
    comment: Optional[str] = None

class ReviewReply(BaseModel):
    reply: str

class ComplaintCreate(BaseModel):
    booking_id: int
    subject: str
    description: str

class ComplaintResolve(BaseModel):
    status: str # Resolved, Closed
    resolution_notes: str

