import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  Search, Clock, ShieldCheck, Tag, Star, ArrowRight, X, Calendar,
  MapPin, CheckCircle2, AlertCircle, Plus, UploadCloud
} from 'lucide-react';
import AuthModal from '../components/AuthModal';
import PaymentModal from '../components/PaymentModal';

const timeSlots = [
  '09:00 AM - 11:00 AM',
  '11:00 AM - 01:00 PM',
  '02:00 PM - 04:00 PM',
  '04:00 PM - 06:00 PM',
  '06:00 PM - 08:00 PM'
];

export default function ServicesPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, role } = useAuth();

  const [categories, setCategories] = useState([]);
  const [selectedCat, setSelectedCat] = useState(searchParams.get('cat') ? Number(searchParams.get('cat')) : null);
  const [services, setServices] = useState([]);
  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [loading, setLoading] = useState(false);

  // Booking Modal State
  const [selectedService, setSelectedService] = useState(null);
  const [serviceDetails, setServiceDetails] = useState(null);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [selectedProviderId, setSelectedProviderId] = useState('');
  const [bookingDate, setBookingDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [selectedSlot, setSelectedSlot] = useState(timeSlots[0]);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [problemDesc, setProblemDesc] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState(null);
  const [bookingError, setBookingError] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);

  // Address create inline
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [newAddrLine, setNewAddrLine] = useState('');
  const [newCity, setNewCity] = useState('Mumbai');
  const [newPincode, setNewPincode] = useState('400076');

  // Auth & Payment Modal
  const [authOpen, setAuthOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [createdBooking, setCreatedBooking] = useState(null);

  useEffect(() => {
    client.get('/api/services/categories').then((res) => setCategories(res.data)).catch(() => {});
  }, []);

  const fetchServices = () => {
    setLoading(true);
    const params = {};
    if (selectedCat) params.category_id = selectedCat;
    if (search.trim()) params.search = search.trim();

    client.get('/api/services', { params })
      .then((res) => setServices(res.data))
      .catch((err) => console.warn(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchServices();
  }, [selectedCat, search]);

  const fetchAddresses = async () => {
    if (!user || role !== 'customer') return;
    try {
      const res = await client.get('/api/customers/profile');
      setAddresses(res.data.addresses || []);
      if (res.data.addresses?.length > 0) {
        const def = res.data.addresses.find((a) => a.is_default) || res.data.addresses[0];
        setSelectedAddressId(def.id);
      }
    } catch (err) {
      console.warn(err);
    }
  };

  const handleOpenBooking = async (srv) => {
    if (!user) {
      setAuthOpen(true);
      return;
    }
    if (role !== 'customer') {
      alert(`You are currently logged in as ${role}. Please sign in as a Customer to make bookings.`);
      return;
    }

    setSelectedService(srv);
    setBookingModalOpen(true);
    setBookingError('');
    setCouponApplied(null);
    setCouponCode('');
    await fetchAddresses();

    // Fetch detailed provider offerings for this service
    try {
      const res = await client.get(`/api/services/${srv.id}`);
      setServiceDetails(res.data);
      if (res.data.available_providers?.length > 0) {
        setSelectedProviderId(res.data.available_providers[0].id);
      } else {
        setSelectedProviderId('');
      }
    } catch (err) {
      console.warn(err);
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim() || !selectedService) return;
    try {
      const res = await client.post('/api/payments/validate-coupon', {
        code: couponCode.trim(),
        amount: selectedService.base_price
      });
      setCouponApplied(res.data);
      setBookingError('');
    } catch (err) {
      setBookingError(err.response?.data?.detail || 'Invalid coupon');
      setCouponApplied(null);
    }
  };

  const handleAddAddress = async (e) => {
    e.preventDefault();
    if (!newAddrLine.trim()) return;
    try {
      const res = await client.post('/api/customers/addresses', {
        title: 'Home',
        address_line: newAddrLine,
        city: newCity,
        pincode: newPincode,
        is_default: true
      });
      setAddresses((prev) => [...prev, res.data]);
      setSelectedAddressId(res.data.id);
      setShowAddAddress(false);
      setNewAddrLine('');
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to save address');
    }
  };

  const handleConfirmBooking = async () => {
    if (!selectedAddressId) {
      setBookingError('Please select or add a service address.');
      return;
    }

    setBookingLoading(true);
    setBookingError('');

    try {
      const res = await client.post('/api/bookings', {
        service_id: selectedService.id,
        provider_id: selectedProviderId ? Number(selectedProviderId) : undefined,
        address_id: Number(selectedAddressId),
        booking_date: bookingDate,
        time_slot: selectedSlot,
        problem_description: problemDesc,
        coupon_code: couponApplied?.coupon_code || undefined
      });

      setCreatedBooking({
        id: res.data.booking_id,
        booking_code: res.data.booking_code,
        service_name: selectedService.name,
        total_amount: selectedService.base_price,
        discount_amount: couponApplied ? couponApplied.discount_amount : 0,
        final_amount: res.data.final_amount,
      });

      setBookingModalOpen(false);
      setPaymentModalOpen(true);
    } catch (err) {
      setBookingError(err.response?.data?.detail || 'Booking failed. Try a different date/slot.');
    } finally {
      setBookingLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-6">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Services Directory</h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Select verified services with transparent pricing, instant slot booking, and warranty.
            </p>
          </div>

          {/* Search box */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search services or tasks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Categories Bar */}
        <div data-tour="services-filter" className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => setSelectedCat(null)}
            className={`px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition-all ${
              selectedCat === null
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            All Categories ({services.length})
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCat(c.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition-all ${
                selectedCat === c.id
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>

        {/* Services Grid */}
        {loading ? (
          <div className="text-center py-20 text-xs text-slate-400">Loading catalog...</div>
        ) : services.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 p-8">
            <p className="text-slate-600 font-bold text-sm">No services found.</p>
            <p className="text-xs text-slate-400 mt-1">Try searching a different keyword or category.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((srv, idx) => (
              <div
                key={srv.id}
                data-tour={idx === 0 ? "service-card" : undefined}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-lg hover:border-blue-300 transition-all flex flex-col justify-between"
              >
                <div className="p-5">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                      {srv.subcategory || 'Standard Service'}
                    </span>
                    <div className="flex items-center gap-1 text-xs text-slate-500">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{srv.duration_mins} mins</span>
                    </div>
                  </div>

                  <h3 className="font-bold text-slate-900 text-base leading-snug">{srv.name}</h3>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed line-clamp-2">
                    {srv.description}
                  </p>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Starts from</span>
                      <span className="text-lg font-black text-slate-900">₹{srv.base_price}</span>
                    </div>
                    <div className="flex items-center gap-1 text-emerald-600 text-xs font-semibold">
                      <ShieldCheck className="w-4 h-4" />
                      <span>Warranty</span>
                    </div>
                  </div>
                </div>

                <div className="px-5 pb-5">
                  <button
                    onClick={() => handleOpenBooking(srv)}
                    className="w-full py-2.5 px-4 bg-slate-900 hover:bg-blue-600 text-white font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-2"
                  >
                    <span>Book Appointment</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Booking Checkout Drawer / Modal */}
      {bookingModalOpen && selectedService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden border border-slate-200 my-8 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 bg-gradient-to-r from-blue-600 to-indigo-700 text-white relative">
              <button
                onClick={() => setBookingModalOpen(false)}
                className="absolute top-4 right-4 p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white"
              >
                <X className="w-4 h-4" />
              </button>
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-200">Appointment Booking</span>
              <h2 className="text-lg font-bold mt-0.5">{selectedService.name}</h2>
              <p className="text-xs text-blue-100 mt-1">₹{selectedService.base_price} • Approx {selectedService.duration_mins} mins</p>
            </div>

            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              {bookingError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-xs text-red-600">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{bookingError}</span>
                </div>
              )}

              {/* 1. Choose Service Provider */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  1. Select Service Partner
                </label>
                {serviceDetails?.available_providers?.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {serviceDetails.available_providers.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => setSelectedProviderId(p.id)}
                        className={`p-3 rounded-xl border cursor-pointer transition-all ${
                          selectedProviderId === p.id
                            ? 'border-blue-600 bg-blue-50/70 text-blue-900 font-medium'
                            : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs">{p.business_name}</span>
                          <span className="text-[11px] text-amber-600 font-bold flex items-center gap-0.5">
                            <Star className="w-3 h-3 fill-amber-400" />
                            {p.rating}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1">Verified partner • ₹{p.price}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-200">
                    TOPS &amp; Taps Certified Network (Automatic Best Partner Dispatch)
                  </p>
                )}
              </div>

              {/* 2. Date & Time Slot */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-blue-600" />
                    <span>2. Booking Date</span>
                  </label>
                  <input
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-blue-600" />
                    <span>3. Time Slot</span>
                  </label>
                  <select
                    value={selectedSlot}
                    onChange={(e) => setSelectedSlot(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    {timeSlots.map((slot) => (
                      <option key={slot} value={slot}>{slot}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 3. Address Selector */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-blue-600" />
                    <span>4. Service Address</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowAddAddress(!showAddAddress)}
                    className="text-[11px] text-blue-600 hover:text-blue-700 font-bold flex items-center gap-0.5"
                  >
                    <Plus className="w-3 h-3" />
                    <span>{showAddAddress ? 'Cancel' : 'Add New'}</span>
                  </button>
                </div>

                {showAddAddress ? (
                  <div className="p-3 bg-blue-50/50 border border-blue-200 rounded-xl space-y-2 text-xs">
                    <input
                      type="text"
                      placeholder="Street address / Flat number..."
                      value={newAddrLine}
                      onChange={(e) => setNewAddrLine(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="City"
                        value={newCity}
                        onChange={(e) => setNewCity(e.target.value)}
                        className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                      />
                      <input
                        type="text"
                        placeholder="Pincode"
                        value={newPincode}
                        onChange={(e) => setNewPincode(e.target.value)}
                        className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleAddAddress}
                      className="py-1 px-3 bg-blue-600 text-white rounded-lg font-bold text-[11px]"
                    >
                      Save Address
                    </button>
                  </div>
                ) : addresses.length > 0 ? (
                  <div className="space-y-1.5">
                    {addresses.map((a) => (
                      <div
                        key={a.id}
                        onClick={() => setSelectedAddressId(a.id)}
                        className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-colors flex items-center justify-between ${
                          selectedAddressId === a.id
                            ? 'border-blue-600 bg-blue-50/60 font-semibold text-blue-900'
                            : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div>
                          <span className="font-bold mr-1.5">{a.title}:</span>
                          <span>{a.address_line}, {a.city} - {a.pincode}</span>
                        </div>
                        {selectedAddressId === a.id && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-amber-700 bg-amber-50 p-3 rounded-xl border border-amber-200">
                    No address saved yet. Click "Add New" above to enter your service location.
                  </div>
                )}
              </div>

              {/* 4. Notes / Problem details */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  5. Problem Details / Instructions
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Bring extra copper wire / Call when near gate"
                  value={problemDesc}
                  onChange={(e) => setProblemDesc(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                ></textarea>
              </div>

              {/* 5. Coupon code */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  6. Apply Discount Coupon
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Try 'WELCOME50' or 'TOPSTAPS100'"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-xl uppercase font-mono font-bold"
                  />
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl"
                  >
                    Apply
                  </button>
                </div>
                {couponApplied && (
                  <p className="text-xs text-emerald-600 font-bold mt-1.5 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Coupon {couponApplied.coupon_code} applied: Saved ₹{couponApplied.discount_amount}!</span>
                  </p>
                )}
              </div>

              {/* Summary & Confirm */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Base Charge</span>
                  <span>₹{selectedService.base_price}</span>
                </div>
                {couponApplied && (
                  <div className="flex justify-between text-emerald-600 font-semibold">
                    <span>Discount</span>
                    <span>- ₹{couponApplied.discount_amount}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-slate-900 pt-2 border-t border-slate-200 text-sm">
                  <span>Payable at Checkout</span>
                  <span className="text-blue-600">
                    ₹{couponApplied ? couponApplied.final_amount : selectedService.base_price}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleConfirmBooking}
                disabled={bookingLoading}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-blue-500/20 disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {bookingLoading ? 'Reserving Appointment...' : 'Proceed to Payment & Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Auth & Payment Modals */}
      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} defaultRole="customer" />
      <PaymentModal
        isOpen={paymentModalOpen}
        onClose={() => {
          setPaymentModalOpen(false);
          navigate('/customer');
        }}
        booking={createdBooking}
        onSuccess={() => {
          navigate('/customer');
        }}
      />
    </div>
  );
}

