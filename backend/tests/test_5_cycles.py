import pytest
import datetime
import random
import uuid
from fastapi.testclient import TestClient

from backend.main import app
from backend.app.database import SessionLocal
from backend.app.models import User, Customer, ServiceProvider, Technician, Booking, Payment, Invoice, Coupon, Complaint

client = TestClient(app)

def test_full_platform_5_consecutive_cycles():
    """
    Executes 5 complete, rigorous, consecutive platform-wide test cycles.
    Each cycle validates end-to-end business requirements from the capstone docx:
    Customer Auth -> Booking -> Razorpay -> Invoice -> Provider Dispatch -> Tech Execution -> Reviews/Disputes -> Admin Governance.
    """
    print("\n" + "="*80)
    print("STARTING 5-CYCLE CONSECUTIVE RIGOROUS PLATFORM AUDIT")
    print("="*80)

    for cycle_num in range(1, 6):
        print(f"\n>>> EXECUTING TEST CYCLE {cycle_num} OF 5 <<<")

        # ----------------------------------------------------------------------
        # Step 1: Customer Auth & Catalog Discovery
        # ----------------------------------------------------------------------
        res_login = client.post("/api/auth/login", json={"email": "customer@gmail.com", "password": "customer123"})
        assert res_login.status_code == 200, f"Cycle {cycle_num}: Customer login failed"
        cust_token = res_login.json()["access_token"]
        cust_headers = {"Authorization": f"Bearer {cust_token}"}

        res_cat = client.get("/api/services/categories")
        assert res_cat.status_code == 200 and len(res_cat.json()) >= 8, f"Cycle {cycle_num}: Categories missing"

        res_srv = client.get("/api/services")
        assert res_srv.status_code == 200 and len(res_srv.json()) >= 10, f"Cycle {cycle_num}: Services missing"
        target_service = res_srv.json()[0]

        res_addr = client.get("/api/customers/addresses", headers=cust_headers)
        assert res_addr.status_code == 200 and len(res_addr.json()) > 0, f"Cycle {cycle_num}: Address missing"
        address_id = res_addr.json()[0]["id"]

        # ----------------------------------------------------------------------
        # Step 2: Coupon Validation & Booking Creation
        # ----------------------------------------------------------------------
        res_coupon = client.post("/api/payments/validate-coupon", json={"code": "WELCOME50", "amount": target_service["base_price"]})
        assert res_coupon.status_code == 200, f"Cycle {cycle_num}: Coupon invalid"
        assert res_coupon.json()["discount_amount"] > 0

        random_day_offset = random.randint(100, 300) + cycle_num * 10
        slot_date = (datetime.date.today() + datetime.timedelta(days=random_day_offset)).strftime("%Y-%m-%d")
        slot_time = f"{random.randint(8, 18):02d}:{random.choice(['00', '30'])} - {random.randint(19, 21):02d}:00"

        booking_payload = {
            "service_id": target_service["id"],
            "address_id": address_id,
            "provider_id": 1,
            "booking_date": slot_date,
            "time_slot": slot_time,
            "problem_description": f"Automated audit cycle {cycle_num} verification check",
            "coupon_code": "WELCOME50"
        }
        res_book = client.post("/api/bookings", json=booking_payload, headers=cust_headers)
        assert res_book.status_code == 201, f"Cycle {cycle_num}: Booking creation failed: {res_book.text}"
        booking_data = res_book.json()
        booking_id = booking_data["booking_id"]
        booking_code = booking_data["booking_code"]

        # Double Booking Prevention Check: exact same slot should fail with 409
        res_double_book = client.post("/api/bookings", json=booking_payload, headers=cust_headers)
        assert res_double_book.status_code == 409, f"Cycle {cycle_num}: Double booking prevention failed to trigger 409!"

        # ----------------------------------------------------------------------
        # Step 3: Razorpay Payment Gateway Handshake & Tax Invoice
        # ----------------------------------------------------------------------
        res_order = client.post("/api/payments/razorpay/create-order", json={"booking_id": booking_id}, headers=cust_headers)
        assert res_order.status_code == 200, f"Cycle {cycle_num}: Razorpay order creation failed"
        order_info = res_order.json()
        assert order_info["currency"] == "INR"
        assert order_info["amount"] > 0

        # Verify payment
        pay_payload = {
            "booking_id": booking_id,
            "razorpay_order_id": order_info["order_id"],
            "razorpay_payment_id": f"pay_cycle_{cycle_num}_{uuid.uuid4().hex[:8]}",
            "razorpay_signature": f"sig_cycle_{cycle_num}_{uuid.uuid4().hex[:8]}",
            "payment_method": "Razorpay Test (UPI Instant)"
        }
        res_verify = client.post("/api/payments/razorpay/verify-payment", json=pay_payload, headers=cust_headers)
        assert res_verify.status_code == 200, f"Cycle {cycle_num}: Payment verification failed"

        # Check Tax Invoice
        res_inv = client.get(f"/api/bookings/{booking_id}/invoice", headers=cust_headers)
        assert res_inv.status_code == 200, f"Cycle {cycle_num}: Invoice fetch failed"
        inv_data = res_inv.json()
        assert inv_data["tax_amount"] > 0, f"Cycle {cycle_num}: GST Tax not calculated"
        expected_grand = round((inv_data["subtotal"] - inv_data["discount_amount"]) * 1.18, 2)
        assert abs(inv_data["grand_total"] - expected_grand) < 0.05, f"Cycle {cycle_num}: Invoice grand total math mismatch"

        # ----------------------------------------------------------------------
        # Step 4: Provider Dispatch & Operations
        # ----------------------------------------------------------------------
        res_prov_login = client.post("/api/auth/login", json={"email": "sparky@provider.com", "password": "provider123"})
        assert res_prov_login.status_code == 200, f"Cycle {cycle_num}: Provider login failed"
        prov_token = res_prov_login.json()["access_token"]
        prov_headers = {"Authorization": f"Bearer {prov_token}"}

        # Accept booking
        res_accept = client.put(f"/api/bookings/{booking_id}/status", json={"status": "Confirmed"}, headers=prov_headers)
        assert res_accept.status_code == 200

        # Assign Technician
        res_techs = client.get("/api/technicians/provider-technicians", headers=prov_headers)
        assert res_techs.status_code == 200 and len(res_techs.json()) > 0
        tech_id = res_techs.json()[0]["id"]

        res_assign = client.put(f"/api/bookings/{booking_id}/assign-technician", json={"technician_id": tech_id}, headers=prov_headers)
        assert res_assign.status_code == 200

        # ----------------------------------------------------------------------
        # Step 5: Technician Field Execution Lifecycle
        # ----------------------------------------------------------------------
        res_tech_login = client.post("/api/auth/login", json={"email": "tech1@homeserve.com", "password": "tech123"})
        assert res_tech_login.status_code == 200, f"Cycle {cycle_num}: Tech login failed"
        tech_token = res_tech_login.json()["access_token"]
        tech_headers = {"Authorization": f"Bearer {tech_token}"}

        res_jobs = client.get("/api/technicians/my-jobs", headers=tech_headers)
        assert res_jobs.status_code == 200
        my_job = next((j for j in res_jobs.json() if j["booking_id"] == booking_id), None)
        assert my_job is not None, f"Cycle {cycle_num}: Assigned job not found in tech queue"

        # Advance to En Route
        res_en_route = client.put(f"/api/technicians/jobs/{my_job['assignment_id']}/status", json={"status": "En Route"}, headers=tech_headers)
        assert res_en_route.status_code == 200

        # Advance to In Progress
        res_in_prog = client.put(f"/api/technicians/jobs/{my_job['assignment_id']}/status", json={"status": "In Progress"}, headers=tech_headers)
        assert res_in_prog.status_code == 200

        # Complete Job with notes
        res_complete = client.put(
            f"/api/technicians/jobs/{my_job['assignment_id']}/status",
            json={"status": "Completed", "technician_notes": f"Cycle {cycle_num} job completed with zero defect"},
            headers=tech_headers
        )
        assert res_complete.status_code == 200

        # ----------------------------------------------------------------------
        # Step 6: Customer Reviews & Rating Feedback
        # ----------------------------------------------------------------------
        res_review = client.post(
            "/api/reviews",
            json={"booking_id": booking_id, "rating": 5, "comment": f"Cycle {cycle_num}: Outstanding punctuality and craft!"},
            headers=cust_headers
        )
        assert res_review.status_code == 201, f"Cycle {cycle_num}: Review submission failed"

        # ----------------------------------------------------------------------
        # Step 7: Super Admin Governance & CSV Audit
        # ----------------------------------------------------------------------
        res_admin_login = client.post("/api/auth/login", json={"email": "admin@homeserve.com", "password": "admin123"})
        assert res_admin_login.status_code == 200, f"Cycle {cycle_num}: Admin login failed"
        admin_token = res_admin_login.json()["access_token"]
        admin_headers = {"Authorization": f"Bearer {admin_token}"}

        res_admin_analytics = client.get("/api/analytics/admin", headers=admin_headers)
        assert res_admin_analytics.status_code == 200
        assert res_admin_analytics.json()["overview"]["total_bookings"] > 0

        res_csv = client.get("/api/analytics/admin/export-csv", headers=admin_headers)
        assert res_csv.status_code == 200
        assert "Booking Code" in res_csv.text

        # Create Dynamic Coupon in Admin Console
        new_coupon_code = f"AUDIT{cycle_num}{random.randint(100, 999)}"
        res_create_coupon = client.post(
            "/api/payments/coupons",
            json={"code": new_coupon_code, "discount_type": "flat", "discount_value": 75.0, "min_booking_amount": 300.0},
            headers=admin_headers
        )
        assert res_create_coupon.status_code == 200

        # Validate newly created coupon
        res_val_new = client.post("/api/payments/validate-coupon", json={"code": new_coupon_code, "amount": 500.0})
        assert res_val_new.status_code == 200
        assert res_val_new.json()["discount_amount"] == 75.0

        print(f"Cycle {cycle_num} Completed with 100% SUCCESS!")

    print("\n" + "="*80)
    print("ALL 5 CONSECUTIVE PLATFORM AUDIT CYCLES PASSED WITH ZERO FAILURES!")
    print("="*80)
