import pytest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_01_health_and_meta():
    """Verify platform health and meta information"""
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert "TOPS & Taps" in data["platform"]

def test_02_authentication_and_rbac():
    """Test login across roles, JWT generation, and RBAC protection"""
    # 1. Customer Login
    cust_res = client.post("/api/auth/login", json={"email": "customer@gmail.com", "password": "customer123"})
    assert cust_res.status_code == 200
    cust_data = cust_res.json()
    assert "access_token" in cust_data
    assert cust_data["user"]["role"] == "customer"
    cust_token = cust_data["access_token"]

    # 2. RBAC check: Customer cannot view admin analytics
    unauthorized = client.get("/api/analytics/admin", headers={"Authorization": f"Bearer {cust_token}"})
    assert unauthorized.status_code == 403

    # 3. Super Admin Login
    admin_res = client.post("/api/auth/login", json={"email": "admin@homeserve.com", "password": "admin123"})
    assert admin_res.status_code == 200
    admin_data = admin_res.json()
    assert admin_data["user"]["role"] == "admin"
    admin_token = admin_data["access_token"]

    # 4. Admin authorized access to platform analytics
    admin_stats = client.get("/api/analytics/admin", headers={"Authorization": f"Bearer {admin_token}"})
    assert admin_stats.status_code == 200
    stats = admin_stats.json()
    assert "overview" in stats
    assert "total_bookings" in stats["overview"]

def test_03_services_and_categories():
    """Test fetching categories and service filtering"""
    res = client.get("/api/services/categories")
    assert res.status_code == 200
    categories = res.json()
    assert len(categories) >= 8

    # Filter services
    srv_res = client.get("/api/services")
    assert srv_res.status_code == 200
    services = srv_res.json()
    assert len(services) > 0
    first_service = services[0]
    assert "base_price" in first_service
    assert "duration_mins" in first_service

def test_04_coupon_validation():
    """Test promo coupons WELCOME50 and TOPSTAPS100"""
    # 1. WELCOME50 (50% off)
    res = client.post("/api/payments/validate-coupon", json={"code": "WELCOME50", "amount": 600.0})
    assert res.status_code == 200
    data = res.json()
    assert data["valid"] is True
    assert data["discount_amount"] == 300.0
    assert data["final_amount"] == 300.0

    # 2. TOPSTAPS100 (Flat 100 off)
    res2 = client.post("/api/payments/validate-coupon", json={"code": "TOPSTAPS100", "amount": 500.0})
    assert res2.status_code == 200
    data2 = res2.json()
    assert data2["valid"] is True
    assert data2["discount_amount"] == 100.0
    assert data2["final_amount"] == 400.0

def test_05_customer_address_management():
    """Test customer adding and retrieving addresses"""
    login_res = client.post("/api/auth/login", json={"email": "customer@gmail.com", "password": "customer123"})
    token = login_res.json()["access_token"]

    new_addr = {
        "title": "Vacation Penthouse",
        "address_line": "Floor 14, Sky Heights, Sea Link Road",
        "city": "Mumbai",
        "pincode": "400050",
        "is_default": False
    }
    res = client.post("/api/customers/addresses", json=new_addr, headers={"Authorization": f"Bearer {token}"})
    assert res.status_code in [200, 201]

    # Verify address exists in list
    addr_list = client.get("/api/customers/addresses", headers={"Authorization": f"Bearer {token}"}).json()
    assert len(addr_list) > 0

def test_06_booking_and_double_booking_prevention():
    """Test booking creation, pricing, and double-booking slot collision prevention"""
    # Login customer
    cust_res = client.post("/api/auth/login", json={"email": "customer@gmail.com", "password": "customer123"})
    cust_token = cust_res.json()["access_token"]

    # Login provider to get provider ID
    prov_res = client.post("/api/auth/login", json={"email": "sparky@provider.com", "password": "provider123"})
    prov_id = prov_res.json()["user"]["provider_id"]

    # Get service & address
    srv_list = client.get("/api/services").json()
    srv_id = srv_list[0]["id"]
    addr_list = client.get("/api/customers/addresses", headers={"Authorization": f"Bearer {cust_token}"}).json()
    addr_id = addr_list[0]["id"]

    import random
    unique_date = f"2028-{random.randint(1, 12):02d}-{random.randint(10, 28):02d}"
    unique_slot = f"{random.randint(1, 9)}:00 PM - {random.randint(10, 11)}:00 PM"

    booking_payload = {
        "service_id": srv_id,
        "provider_id": prov_id,
        "address_id": addr_id,
        "booking_date": unique_date,
        "time_slot": unique_slot,
        "problem_description": "Water heater MCB tripping continuously",
        "coupon_code": "WELCOME50"
    }

    # 1. Create primary booking
    res1 = client.post("/api/bookings", json=booking_payload, headers={"Authorization": f"Bearer {cust_token}"})
    assert res1.status_code in [200, 201]
    b_data = res1.json()
    assert "booking_id" in b_data
    created_id = b_data["booking_id"]

    # Mark as Confirmed to test double-booking protection
    update_res = client.patch(
        f"/api/bookings/{created_id}/status",
        json={"status": "Confirmed"},
        headers={"Authorization": f"Bearer {cust_token}"}
    )
    assert update_res.status_code == 200

    # 2. Attempt double booking for same provider, date, and slot
    res2 = client.post("/api/bookings", json=booking_payload, headers={"Authorization": f"Bearer {cust_token}"})
    assert res2.status_code == 409
    assert "already booked" in res2.json()["detail"].lower()

def test_07_razorpay_checkout_and_invoice():
    """Test Razorpay order creation, payment verification, and GST tax invoice generation"""
    cust_res = client.post("/api/auth/login", json={"email": "customer@gmail.com", "password": "customer123"})
    cust_token = cust_res.json()["access_token"]

    # Get customer bookings
    bookings = client.get("/api/bookings/my-bookings", headers={"Authorization": f"Bearer {cust_token}"}).json()
    assert len(bookings) > 0
    target_booking = bookings[0]
    b_id = target_booking["id"]

    # 1. Razorpay Order Creation
    order_res = client.post("/api/payments/razorpay/create-order", json={"booking_id": b_id}, headers={"Authorization": f"Bearer {cust_token}"})
    assert order_res.status_code in [200, 400] # 400 if already paid
    if order_res.status_code == 200:
        order_data = order_res.json()
        assert "order_id" in order_data
        assert order_data["currency"] == "INR"

        # 2. Razorpay Signature Verification & Settlement
        verify_payload = {
            "booking_id": b_id,
            "razorpay_order_id": order_data["order_id"],
            "razorpay_payment_id": f"pay_rzp_e2e_{b_id}",
            "razorpay_signature": "mock_valid_signature_2026",
            "payment_method": "Razorpay UPI"
        }
        verify_res = client.post("/api/payments/razorpay/verify-payment", json=verify_payload, headers={"Authorization": f"Bearer {cust_token}"})
        assert verify_res.status_code == 200
        assert verify_res.json()["success"] is True

    # 3. Check Invoice Generation
    inv_res = client.get(f"/api/bookings/{b_id}/invoice", headers={"Authorization": f"Bearer {cust_token}"})
    assert inv_res.status_code == 200
    inv = inv_res.json()
    assert "invoice_number" in inv
    assert "tax_amount" in inv
    assert "grand_total" in inv

def test_08_provider_and_technician_dispatch_lifecycle():
    """Test provider dispatch and technician job completion"""
    # Provider Login
    prov_login = client.post("/api/auth/login", json={"email": "sparky@provider.com", "password": "provider123"})
    prov_token = prov_login.json()["access_token"]

    # Provider bookings
    prov_bookings = client.get("/api/bookings/my-bookings", headers={"Authorization": f"Bearer {prov_token}"}).json()
    assert len(prov_bookings) > 0

    # Technician Login
    tech_login = client.post("/api/auth/login", json={"email": "tech1@homeserve.com", "password": "tech123"})
    tech_token = tech_login.json()["access_token"]

    # Technician views jobs
    tech_jobs = client.get("/api/technicians/my-jobs", headers={"Authorization": f"Bearer {tech_token}"}).json()
    assert isinstance(tech_jobs, list)

    # Technician updates status to In Progress
    if len(tech_jobs) > 0:
        assignment_id = tech_jobs[0]["assignment_id"]
        update_res = client.put(
            f"/api/technicians/jobs/{assignment_id}/status",
            json={"status": "In Progress", "technician_notes": "Capacitor replaced. Running 15-minute load test."},
            headers={"Authorization": f"Bearer {tech_token}"}
        )
        assert update_res.status_code == 200

def test_09_customer_complaints_and_disputes():
    """Test customer raising a complaint and admin listing complaints"""
    cust_login = client.post("/api/auth/login", json={"email": "customer@gmail.com", "password": "customer123"})
    cust_token = cust_login.json()["access_token"]

    bookings = client.get("/api/bookings/my-bookings", headers={"Authorization": f"Bearer {cust_token}"}).json()
    b_id = bookings[0]["id"]

    # Raise Complaint
    comp_payload = {
        "booking_id": b_id,
        "subject": "Minor billing clarification",
        "description": "Please provide GST breakup for electrical spares."
    }
    comp_res = client.post("/api/reviews/complaints", json=comp_payload, headers={"Authorization": f"Bearer {cust_token}"})
    assert comp_res.status_code in [200, 201]

    # Admin lists complaints
    admin_login = client.post("/api/auth/login", json={"email": "admin@homeserve.com", "password": "admin123"})
    admin_token = admin_login.json()["access_token"]
    all_complaints = client.get("/api/reviews/complaints", headers={"Authorization": f"Bearer {admin_token}"}).json()
    assert len(all_complaints) > 0
