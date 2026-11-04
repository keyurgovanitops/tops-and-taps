from backend.app.database import SessionLocal, Base, engine
from backend.app.models import (
    User, Customer, ServiceProvider, Technician, Address, ServiceCategory, Service,
    ProviderService, ServiceArea, AvailabilitySlot, Booking, BookingAssignment,
    Payment, Invoice, Coupon, Notification, ProviderEarning
)
from backend.app.auth import hash_password
import datetime
import uuid

def seed_database():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # Check if already seeded
    if db.query(User).filter(User.email == "admin@homeserve.com").first():
        # Ensure latest coupons exist
        if not db.query(Coupon).filter(Coupon.code == "TOPSTAPS100").first():
            db.add(Coupon(code="TOPSTAPS100", discount_type="flat", discount_value=100.0, min_booking_amount=400.0, is_active=True))
            db.commit()
        print("Database already seeded.")
        db.close()
        return

    print("Seeding database with demo data...")

    # 1. Super Admin
    admin_user = User(
        email="admin@homeserve.com",
        phone="9876543210",
        hashed_password=hash_password("admin123"),
        role="admin",
        full_name="Platform Administrator"
    )
    db.add(admin_user)

    # 2. Customers
    cust_user = User(
        email="customer@gmail.com",
        phone="9876543211",
        hashed_password=hash_password("customer123"),
        role="customer",
        full_name="Priya Sharma"
    )
    db.add(cust_user)
    db.flush()

    cust_profile = Customer(
        user_id=cust_user.id,
        avatar_url="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150"
    )
    db.add(cust_profile)
    db.flush()

    addr1 = Address(
        customer_id=cust_profile.id,
        title="Home",
        address_line="Flat 402, Sunshine Heights, Powai",
        city="Mumbai",
        pincode="400076",
        is_default=True
    )
    addr2 = Address(
        customer_id=cust_profile.id,
        title="Office",
        address_line="Tech Park Tower B, 5th Floor, Bandra Kurla Complex",
        city="Mumbai",
        pincode="400051",
        is_default=False
    )
    db.add_all([addr1, addr2])

    # 3. Service Providers
    # Provider 1: Approved
    prov1_user = User(
        email="sparky@provider.com",
        phone="9876543212",
        hashed_password=hash_password("provider123"),
        role="provider",
        full_name="Rajesh Patel"
    )
    db.add(prov1_user)
    db.flush()

    prov1 = ServiceProvider(
        user_id=prov1_user.id,
        business_name="Sparky Electricals & AC Solutions",
        description="Top-rated electrical and air conditioning repair solutions with 10+ years experience.",
        id_proof_url="https://images.unsplash.com/photo-1628157582853-a796fa650a6a?w=400",
        verification_status="approved",
        rating=4.9,
        total_reviews=42,
        commission_rate=15.0
    )
    db.add(prov1)

    # Provider 2: Approved
    prov2_user = User(
        email="pipes@provider.com",
        phone="9876543213",
        hashed_password=hash_password("provider123"),
        role="provider",
        full_name="Suresh Kumar"
    )
    db.add(prov2_user)
    db.flush()

    prov2 = ServiceProvider(
        user_id=prov2_user.id,
        business_name="City Express Plumbing & Cleaning",
        description="Fast and reliable residential plumbing, leak detection, and deep cleaning.",
        id_proof_url="https://images.unsplash.com/photo-1628157582853-a796fa650a6a?w=400",
        verification_status="approved",
        rating=4.8,
        total_reviews=35,
        commission_rate=15.0
    )
    db.add(prov2)

    # Provider 3: Pending KYC (for Admin approval demo)
    prov3_user = User(
        email="clean@provider.com",
        phone="9876543214",
        hashed_password=hash_password("provider123"),
        role="provider",
        full_name="Kavita Rao"
    )
    db.add(prov3_user)
    db.flush()

    prov3 = ServiceProvider(
        user_id=prov3_user.id,
        business_name="Sparkle Home & Pest Services",
        description="Premium eco-friendly home sanitization and pest management.",
        id_proof_url="https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=400",
        verification_status="pending",
        rating=5.0,
        total_reviews=0,
        commission_rate=15.0
    )
    db.add(prov3)
    db.flush()

    # 4. Technicians
    tech1_user = User(
        email="tech1@homeserve.com",
        phone="9876543215",
        hashed_password=hash_password("tech123"),
        role="technician",
        full_name="Rahul Sharma"
    )
    db.add(tech1_user)
    db.flush()

    tech1 = Technician(
        user_id=tech1_user.id,
        provider_id=prov1.id,
        specialization="Senior Electrician & AC Technician",
        is_available=True
    )
    db.add(tech1)

    tech2_user = User(
        email="tech2@homeserve.com",
        phone="9876543216",
        hashed_password=hash_password("tech123"),
        role="technician",
        full_name="Amit Verma"
    )
    db.add(tech2_user)
    db.flush()

    tech2 = Technician(
        user_id=tech2_user.id,
        provider_id=prov2.id,
        specialization="Master Plumber & Sanitization Pro",
        is_available=True
    )
    db.add(tech2)
    db.flush()

    # 5. Service Categories (8 from Document)
    categories_data = [
        ("Electrical Services", "electrical", "Zap", "Wiring, switches, fuse repair, and installation", "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=500"),
        ("Plumbing Services", "plumbing", "Droplets", "Pipes, faucets, leak repair, and bathroom fittings", "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=500"),
        ("AC Repair & Maintenance", "ac-repair", "Wind", "AC servicing, gas filling, cooling issue fixes", "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=500"),
        ("Home Cleaning", "cleaning", "Sparkles", "Deep home, kitchen, sofa, and bathroom cleaning", "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=500"),
        ("Painting Services", "painting", "Paintbrush", "Interior & exterior wall painting and waterproofing", "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=500"),
        ("Carpentry Services", "carpentry", "Hammer", "Furniture assembly, door lock repair, and woodwork", "https://images.unsplash.com/photo-1538688525198-9b88f6f53126?w=500"),
        ("Appliance Repair", "appliance-repair", "Tv", "Washing machine, refrigerator, microwave repairs", "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=500"),
        ("Pest Control", "pest-control", "ShieldAlert", "Termite, cockroach, and bed bug eradication", "https://images.unsplash.com/photo-1584483766114-2cea6facdf57?w=500"),
    ]

    cat_map = {}
    for name, slug, icon, desc, img in categories_data:
        cat = ServiceCategory(name=name, slug=slug, icon=icon, description=desc, image_url=img)
        db.add(cat)
        db.flush()
        cat_map[slug] = cat.id

    # 6. Services
    services_data = [
        (cat_map["electrical"], "Switchboard Installation & Repair", "Switches", "Fix sparking, loose connections, or install new modular switchboards", 299.0, 45),
        (cat_map["electrical"], "Complete House Wiring Inspection", "Wiring", "Safety audit and rewiring of high voltage circuits", 899.0, 90),
        (cat_map["electrical"], "Ceiling Fan & Light Installation", "Fixtures", "Mounting, balancing and wiring of fans and chandeliers", 349.0, 40),
        
        (cat_map["plumbing"], "Tap & Mixer Leak Repair", "Leaks", "Fix dripping faucets, washers, and water mixer valves", 249.0, 30),
        (cat_map["plumbing"], "Drain Blockage Clearing", "Drainage", "Chemical and mechanical unclogging of kitchen and bath drains", 599.0, 60),
        (cat_map["plumbing"], "Water Tank Cleaning", "Tanks", "High-pressure jet cleaning and UV disinfection", 999.0, 120),

        (cat_map["ac-repair"], "Complete AC Jet Servicing", "Servicing", "Deep foam wash of indoor cooling coils and outdoor unit", 599.0, 60),
        (cat_map["ac-repair"], "AC Gas Refill & Leak Fix", "Cooling", "Pressure testing, copper pipe brazing and refrigerant recharge", 1899.0, 75),

        (cat_map["cleaning"], "Full Home Deep Cleaning", "Deep Clean", "Intensive scrubbing, vacuuming and sanitizing of all rooms", 2499.0, 240),
        (cat_map["cleaning"], "Sofa & Upholstery Shampooing", "Sofa", "Fabric stain removal and mechanized shampoo wash", 899.0, 60),

        (cat_map["painting"], "Single Room Paint Refresh", "Interior", "Wall putty, primer and 2 coats of premium emulsion", 3499.0, 360),
        (cat_map["carpentry"], "Door Lock & Handle Fitting", "Locks", "Installation of smart door locks and mortise handles", 449.0, 45),
        (cat_map["appliance-repair"], "Washing Machine Diagnostics & Repair", "Laundry", "Drum rotation issues, motor faults, and drain pump errors", 499.0, 60),
        (cat_map["pest-control"], "Complete Herbal Pest Control", "Insects", "Odorless gel treatment for cockroaches and ants", 799.0, 60)
    ]

    service_objs = []
    for cid, name, subcat, desc, price, dur in services_data:
        srv = Service(category_id=cid, name=name, subcategory=subcat, description=desc, base_price=price, duration_mins=dur)
        db.add(srv)
        db.flush()
        service_objs.append(srv)

    # 7. Map Services to Providers
    for s in service_objs[:6]:
        db.add(ProviderService(provider_id=prov1.id, service_id=s.id, custom_price=s.base_price))
    for s in service_objs[3:10]:
        db.add(ProviderService(provider_id=prov2.id, service_id=s.id, custom_price=s.base_price))

    # 8. Service Areas & Slots
    for prov in [prov1, prov2]:
        db.add(ServiceArea(provider_id=prov.id, city="Mumbai", pincode="400076"))
        db.add(ServiceArea(provider_id=prov.id, city="Mumbai", pincode="400051"))
        for day in ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]:
            db.add(AvailabilitySlot(provider_id=prov.id, day_of_week=day, start_time="09:00 AM", end_time="07:00 PM"))

    # 9. Coupons
    c1 = Coupon(code="WELCOME50", discount_type="percentage", discount_value=50.0, min_booking_amount=200.0, is_active=True)
    c2 = Coupon(code="TOPSTAPS100", discount_type="flat", discount_value=100.0, min_booking_amount=400.0, is_active=True)
    c3 = Coupon(code="HOMESERVE100", discount_type="flat", discount_value=100.0, min_booking_amount=400.0, is_active=True)
    db.add_all([c1, c2, c3])

    # 10. Sample Initial Booking with Lifecycle
    sample_booking = Booking(
        booking_code="BK-789021",
        customer_id=cust_profile.id,
        provider_id=prov1.id,
        service_id=service_objs[0].id,
        address_id=addr1.id,
        booking_date="2026-11-05",
        time_slot="10:00 AM - 12:00 PM",
        problem_description="Living room ceiling switchboard has burnt switch and sparking.",
        status="Confirmed",
        total_amount=299.0,
        discount_amount=50.0,
        final_amount=249.0,
        commission_amount=37.35
    )
    db.add(sample_booking)
    db.flush()

    # Assignment
    db.add(BookingAssignment(
        booking_id=sample_booking.id,
        technician_id=tech1.id,
        status="Assigned"
    ))

    # Payment
    db.add(Payment(
        booking_id=sample_booking.id,
        transaction_id="pay_test_seeded99182",
        payment_method="Razorpay Test Mode",
        amount=249.0,
        status="Paid"
    ))

    # Invoice
    db.add(Invoice(
        booking_id=sample_booking.id,
        invoice_number="INV-2026-001",
        subtotal=299.0,
        discount_amount=50.0,
        tax_amount=44.82,
        grand_total=293.82
    ))

    # Notification
    db.add(Notification(
        user_id=cust_user.id,
        title="Booking Confirmed!",
        message=f"Your booking BK-789021 for {service_objs[0].name} has been assigned to technician Rahul Sharma."
    ))

    db.commit()
    print("Database successfully seeded with demo users, roles, categories, services, and bookings!")
    db.close()

if __name__ == "__main__":
    seed_database()

