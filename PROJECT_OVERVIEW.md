# TOPS & Taps — Your home. Our hustle.

A modern startup-style SaaS Home Services Booking Platform connecting customers with certified professionals (Electricians, Plumbers, AC Specialists, Cleaners, and more).

---

## 📌 Executive Summary

TOPS & Taps solves the fragmentation in local home services through an end-to-end digital ecosystem:
* **Customers** discover verified services, pick guaranteed time slots, make cashless payments via Razorpay Test Gateway, and track technician progress in real-time.
* **Service Providers** manage regional business operations, set custom pricing, define coverage areas, and dispatch technicians.
* **Field Technicians** use a mobile-first task interface to view customer details, log arrival, upload proof-of-work photos, and complete jobs.
* **Super Admins** govern platform commissions, verify provider KYC documents, resolve disputes, and monitor platform-wide GMV.

---

## 🏗️ Architecture & Technology Stack

| Layer | Technology | Details |
| :--- | :--- | :--- |
| **Frontend** | React 19 + Tailwind CSS v4 | Responsive UI, bespoke vector branding, Lucide Icons, React Router DOM, Axios |
| **Backend** | Python FastAPI (Uvicorn) | Async REST API, OpenAPI/Swagger docs, Pydantic validation, pytest automated suite |
| **Database** | SQLAlchemy 2.0 ORM | MySQL 8.0 support + automatic zero-config SQLite fallback (`homeserve.db`) |
| **Auth & Security**| JWT + Bcrypt | Role-Based Access Control (RBAC), password show/hide, CORS, input sanitization |
| **Payments** | Razorpay Test Gateway | Dual-mode: Native Razorpay Checkout SDK + interactive Test Sandbox with GST tax invoices |
| **Testing** | Pytest + FastAPI TestClient | 9/9 automated End-to-End tests passing across all functional modules |

---

## 📊 Task Completion & Implementation Status

```
[████████████████████████████████████████] 100% Core Requirements Complete
```

### ✅ Completed Modules (Per Capstone Specification)

| Module / Area | Status | Implementation Details |
| :--- | :---: | :--- |
| **Module 1: Auth & RBAC** | ✅ Done | Production-grade Sign In & Registration forms. Removed 1-click buttons from public view; secured with JWT & Bcrypt; RBAC for 4 roles. |
| **Module 2: Customer Portal** | ✅ Done | Profile management, multiple saved addresses, booking history, invoice access, dispute raising. |
| **Module 3: Catalog & Services**| ✅ Done | 8 core categories seeded with realistic pricing, duration estimates (`duration_mins`), subservices, and filters. |
| **Module 4: Provider Operations**| ✅ Done | Business profile, KYC document upload, coverage area configuration, 15% automated commission ledger. |
| **Module 5: Booking Engine** | ✅ Done | Slot selection, problem notes, reference photo attachments, and strict 409 double-booking prevention. |
| **Module 6: Technician Workflow**| ✅ Done | Mobile-friendly job list, real-time status transitions (*Assigned → En Route → In Progress → Completed*), proof upload. |
| **Module 7: Payments & Invoicing**| ✅ Done | Official Razorpay test mode order creation (`/api/payments/razorpay/create-order`), signature verification, and automated 18% GST tax invoices. |
| **Module 8: Notifications** | ✅ Done | In-app notification center with real-time unread badges and mark-as-read controls. |
| **Module 9: Reviews & Disputes** | ✅ Done | Star ratings and reviews, weighted average calculations, dispute submission, Super Admin dispute resolution. |
| **Module 10: Analytics** | ✅ Done | Role-based metrics: platform GMV & commissions for Admin, net earnings for Providers. |
| **Interactive Tour Guide** | ✅ Done | Draggable, high-contrast multi-page guided tour (`?` button) that preserves and restores original session and route upon completion. |

---

## ⚠️ What Might Need Your Intervention (External Credentials)

The codebase has been engineered to run locally with zero blockers. The only items requiring your intervention are optional external third-party services if you wish to connect them:

1. **Razorpay Live Dashboard Test Keys (Optional):**
   * *Current state:* Fully functioning Razorpay Test Mode with backend order creation (`order_...`), verification, and tax receipt generation.
   * *If you have a Razorpay account:* You can drop your personal `RAZORPAY_KEY_ID` (e.g. `rzp_test_...`) and `RAZORPAY_KEY_SECRET` inside `backend/.env` to trigger the official Razorpay popup modal.
2. **Cloud MySQL Database (Optional):**
   * *Current state:* Automatically runs on local database (`homeserve.db`).
   * *If you have Cloud MySQL (e.g. AWS RDS, Aiven, or PlanetScale):* Provide your connection string in `DATABASE_URL` in `backend/.env`.
3. **Cloudinary Storage (Optional):**
   * *Current state:* Stores and serves problem and work-proof photos locally in `backend/uploads/` via `/uploads/...`.
   * *If cloud storage is preferred:* Drop Cloudinary API keys into `.env`.
4. **Git Repository & Cloud Deployment (Phase 8 & 9):**
   * *Next step:* Provide your GitHub repository URL to push the code, and connect to Vercel/Netlify (frontend) and Render/Fly.io (backend).

---

## 🧪 Automated Testing Verification

The complete end-to-end test suite (`backend/tests/test_e2e_platform.py`) validates the full application lifecycle:

```bash
.\backend\.venv\Scripts\python.exe -m pytest backend/tests/test_e2e_platform.py -v
```

**Results:**
* `test_01_health_and_meta`: **PASSED**
* `test_02_authentication_and_rbac`: **PASSED**
* `test_03_services_and_categories`: **PASSED**
* `test_04_coupon_validation`: **PASSED** (`WELCOME50`, `TOPSTAPS100`)
* `test_05_customer_address_management`: **PASSED**
* `test_06_booking_and_double_booking_prevention`: **PASSED** (Validates 409 Conflict on slot collisions)
* `test_07_razorpay_checkout_and_invoice`: **PASSED** (Order creation + Signature verification + GST Invoice)
* `test_08_provider_and_technician_dispatch_lifecycle`: **PASSED**
* `test_09_customer_complaints_and_disputes`: **PASSED**

---

## ⚡ Quick Test & Access Matrix

* **Frontend Web App:** [http://127.0.0.1:5173/](http://127.0.0.1:5173/)
* **Backend Swagger Docs:** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

| User Role | Pre-Seeded Email | Password | Primary Workflow to Test |
| :--- | :--- | :--- | :--- |
| **Customer** | `customer@gmail.com` | `customer123` | Book service, apply `TOPSTAPS100` or `WELCOME50`, Razorpay checkout, tax invoice. |
| **Service Provider** | `sparky@provider.com` | `provider123` | Accept bookings, dispatch technicians, track net earnings after 15% commission. |
| **Field Technician** | `tech1@homeserve.com` | `tech123` | View assigned job cards, advance status (*En Route → In Progress → Completed*), photo proof. |
| **Super Admin** | `admin@homeserve.com` | `admin123` | Monitor platform GMV, audit provider KYC, resolve customer complaints. |
