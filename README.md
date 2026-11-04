# TOPS & Taps — Your home. Our hustle.

A modern startup-style full-stack SaaS platform connecting households with professional home service providers (Electricians, Plumbers, AC Specialists, Cleaners, Painters, Carpenters, Appliance Repair, and Pest Control).

---

## 🌐 Live Production Deployments

* **Live Web App (Netlify):** **[https://topstaps-9634.netlify.app](https://topstaps-9634.netlify.app)**
* **Live API Server (Render):** **[https://topstaps-api.onrender.com](https://topstaps-api.onrender.com)**
* **Live Swagger API Docs:** **[https://topstaps-api.onrender.com/docs](https://topstaps-api.onrender.com/docs)**
* **GitHub Repository:** **[https://github.com/keyurgovanitops/tops-and-taps](https://github.com/keyurgovanitops/tops-and-taps)**

---

## 🚀 Quick Start Instructions

### 1. Launch Backend (FastAPI)
Run `run_backend.bat` or in terminal:
```bash
.\backend\.venv\Scripts\python.exe -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```
* **API Documentation & Swagger UI:** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

### 2. Launch Frontend (React + Vite + Tailwind)
Run `run_frontend.bat` or in terminal:
```bash
cd frontend
npm run dev
```
* **Web App URL:** [http://localhost:5173](http://localhost:5173)

---

## 👥 Demo Logins for All 4 Roles

The platform includes **1-Click Quick Demo Login** buttons on the sign-in modal, or you can use these seeded credentials:

| Role | Email | Password | What You Can Test |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `admin@homeserve.com` | `admin123` | Platform analytics, 1-click KYC approval/rejection, resolve complaints, add categories. |
| **Customer** | `customer@gmail.com` | `customer123` | Browse catalog, book slots, coupon simulation (`WELCOME50`), Razorpay test payment, review, invoice download. |
| **Service Provider** | `sparky@provider.com` | `provider123` | Accept/reject bookings, assign technicians, upload KYC docs, view net earnings & 15% platform cut. |
| **Field Technician** | `tech1@homeserve.com` | `tech123` | Mobile job cards, update status (En Route → In Progress → Completed), upload completion photos. |

---

## ⚙️ Technology Stack

* **Frontend:** React 19, Tailwind CSS v4, Lucide Icons, React Router DOM, Axios
* **Backend:** Python FastAPI, SQLAlchemy 2.0 ORM, PyMySQL, JWT Authentication, Bcrypt Password Hashing
* **Database:** MySQL / SQLite fallback with automatic migration and seed generator
* **Payments:** Razorpay Test Mode interactive gateway sandbox simulation
* **Architecture:** 20 relational database models covering all 10 core modules in the capstone specifications.

