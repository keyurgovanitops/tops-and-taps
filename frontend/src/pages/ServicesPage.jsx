import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  Search, Clock, ShieldCheck, Tag, Star, ArrowRight, X, Calendar,
  MapPin, CheckCircle2, AlertCircle, Plus, Sparkles, Zap, Lock
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
    client.get('/api/services/categories')
      .then((res) => setCategories(res.data))
      .catch(() => {});
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
      alert(`You are logged in as ${role}. Please sign in as a Customer to book appointments.`);
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
      setBookingError(err.response?.data?.detail || 'Invalid or expired coupon code.');
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
      setBookingError(err.response?.data?.detail || 'Booking failed. Try selecting another date or slot.');
    } finally {
      setBookingLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute top-1/3 right-10 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-7xl mx-auto space-y-10 relative z-10">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/10 pb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-cyan-400 text-xs font-bold tracking-wide uppercase mb-3">
              <Zap className="w-3.5 h-3.5" />
              <span>Instant Verified Dispatch</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Services Directory
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-2 max-w-xl leading-relaxed">
              Transparent upfront pricing, 30-day service warranty, and KYC-verified technicians dispatched directly to your doorstep.
            </p>
          </div>

          {/* Search box */}
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder="Search services (e.g. AC repair, plumbing, wiring)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 text-xs bg-slate-900/90 border border-white/10 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all shadow-inner"
            />
          </div>
        </div>

        {/* Categories Bar */}
        <div data-tour="services-filter" className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => setSelectedCat(null)}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
              selectedCat === null
                ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-500/25 border border-cyan-400/40'
                : 'bg-slate-900/80 border border-white/10 text-slate-400 hover:text-white hover:border-white/20'
            }`}
          >
            All Services ({services.length})
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCat(c.id)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
                selectedCat === c.id
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-500/25 border border-cyan-400/40'
                  : 'bg-slate-900/80 border border-white/10 text-slate-400 hover:text-white hover:border-white/20'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>

        {/* Services Grid */}
        {loading ? (
          <div className="text-center py-24 text-xs text-slate-400 flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
            <span>Fetching verified services catalog...</span>
          </div>
        ) : services.length === 0 ? (
          <div className="text-center py-20 bg-slate-900/50 rounded-3xl border border-white/10 p-10">
            <p className="text-white font-bold text-base">No services match your search.</p>
            <p className="text-xs text-slate-400 mt-1">Try resetting the category filter or searching for broader terms.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((srv, idx) => (
              <div
                key={srv.id}
                data-tour={idx === 0 ? "service-card" : undefined}
                className="bg-slate-900/80 backdrop-blur-md rounded-3xl border border-white/10 overflow-hidden hover:border-cyan-500/40 hover:shadow-2xl hover:shadow-cyan-500/10 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-1 rounded-full">
                      {srv.subcategory || 'Certified Service'}
                    </span>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-white/5 px-2.5 py-1 rounded-full border border-white/5">
                      <Clock className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{srv.duration_mins} mins</span>
                    </div>
                  </div>

                  <h3 className="font-black text-white text-lg group-hover:text-cyan-300 transition-colors">
                    {srv.name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-2.5 leading-relaxed line-clamp-2">
                    {srv.description}
                  </p>

                  <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Standard Base Fee</span>
                      <span className="text-xl font-black text-white tracking-tight">₹{srv.base_price}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-semibold bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>30d Warranty</span>
                    </div>
                  </div>
                </div>

                <div className="px-6 pb-6 pt-1">
                  <button
                    onClick={() => handleOpenBooking(srv)}
                    className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-cyan-600 text-white font-bold text-xs rounded-2xl transition-all shadow-md shadow-blue-600/25 flex items-center justify-center gap-2 cursor-pointer group-hover:shadow-cyan-500/25"
                  >
                    <span>Schedule Appointment</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Booking Drawer / Modal */}
      {bookingModalOpen && selectedService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-white/15 rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden my-8 animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 border-b border-white/10 text-white relative">
              <button
                onClick={() => setBookingModalOpen(false)}
                className="absolute top-5 right-5 p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
              <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">
                Verified Booking
              </span>
              <h2 className="text-xl font-black mt-1 text-white">{selectedService.name}</h2>
              <p className="text-xs text-slate-400 mt-1">
                Standard Fee: <span className="text-cyan-300 font-bold">₹{selectedService.base_price}</span> • Duration: {selectedService.duration_mins} mins
              </p>
            </div>

            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto text-xs text-slate-300">
              {bookingError && (
                <div className="p-3.5 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-start gap-2.5 text-xs text-red-400">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{bookingError}</span>
                </div>
              )}

              {/* 1. Choose Service Partner */}
              <div>
                <label className="block text-xs font-bold text-white mb-2 uppercase tracking-wider text-[11px]">
                  1. Select Service Partner
                </label>
                {serviceDetails?.available_providers?.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {serviceDetails.available_providers.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => setSelectedProviderId(p.id)}
                        className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                          selectedProviderId === p.id
                            ? 'border-cyan-500 bg-cyan-500/10 text-white font-bold ring-1 ring-cyan-500 shadow-md'
                            : 'border-white/10 bg-white/5 hover:bg-white/10 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs truncate">{p.business_name}</span>
                          <span className="text-[11px] text-amber-400 font-bold flex items-center gap-1">
                            <Star className="w-3 h-3 fill-amber-400" />
                            {p.rating}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1">Verified Partner • ₹{p.price}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3.5 bg-blue-500/10 border border-blue-500/20 rounded-2xl text-cyan-300 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 shrink-0 text-cyan-400" />
                    <span>TOPS &amp; Taps Automated Dispatch: System will instantly assign top-rated verified partner.</span>
                  </div>
                )}
              </div>

              {/* 2. Date & Time Slot */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-cyan-400" />
                  <span>2. Select Schedule Slot</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-1">
                    <span className="text-[10px] text-slate-400 block mb-1">Appointment Date</span>
                    <input
                      type="date"
                      min={new Date().toISOString().split('T')[0]}
                      value={bookingDate}
                      onChange={(e) => setBookingDate(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-xl text-white font-mono text-xs focus:ring-1 focus:ring-cyan-400 focus:outline-none"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-[10px] text-slate-400 block mb-1">Preferred Time Window</span>
                    <select
                      value={selectedSlot}
                      onChange={(e) => setSelectedSlot(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-xl text-white text-xs focus:ring-1 focus:ring-cyan-400 focus:outline-none"
                    >
                      {timeSlots.map((ts) => (
                        <option key={ts} value={ts}>{ts}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* 3. Address Selection */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-cyan-400" />
                    <span>3. Service Address</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowAddAddress(!showAddAddress)}
                    className="text-cyan-400 hover:text-cyan-300 font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{showAddAddress ? 'Close' : 'Add New'}</span>
                  </button>
                </div>

                {showAddAddress && (
                  <form onSubmit={handleAddAddress} className="p-4 bg-slate-950 border border-cyan-500/30 rounded-2xl space-y-3">
                    <span className="text-[11px] font-bold text-cyan-300 block">Add New Home Address</span>
                    <input
                      type="text"
                      placeholder="Flat, Apartment / Building name, Landmark"
                      value={newAddrLine}
                      onChange={(e) => setNewAddrLine(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-cyan-400"
                      required
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="City"
                        value={newCity}
                        onChange={(e) => setNewCity(e.target.value)}
                        className="px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-white text-xs"
                      />
                      <input
                        type="text"
                        placeholder="Pincode"
                        value={newPincode}
                        onChange={(e) => setNewPincode(e.target.value)}
                        className="px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-white text-xs font-mono"
                      />
                    </div>
                    <button
                      type="submit"
                      className="py-2 px-4 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors"
                    >
                      Save &amp; Use Address
                    </button>
                  </form>
                )}

                {addresses.length === 0 ? (
                  <p className="text-amber-400 text-xs bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">
                    No address on file. Please click "+ Add New" above to save your service location.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {addresses.map((a) => (
                      <div
                        key={a.id}
                        onClick={() => setSelectedAddressId(a.id)}
                        className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                          selectedAddressId === a.id
                            ? 'border-cyan-500 bg-cyan-500/10 text-white font-medium ring-1 ring-cyan-500'
                            : 'border-white/10 bg-white/5 hover:bg-white/10 text-slate-300'
                        }`}
                      >
                        <p className="font-bold text-white text-xs">{a.title} {a.is_default && '(Default)'}</p>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">{a.address_line}</p>
                        <p className="text-[10px] text-slate-500">{a.city} - {a.pincode}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 4. Notes / Problem Details */}
              <div>
                <label className="block text-xs font-bold text-white uppercase tracking-wider text-[11px] mb-1.5">
                  4. Problem Description / Instructions (Optional)
                </label>
                <textarea
                  rows={2}
                  value={problemDesc}
                  onChange={(e) => setProblemDesc(e.target.value)}
                  placeholder="e.g. Master bedroom switch spark, please bring spare 16A modular switch."
                  className="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-xl text-white text-xs focus:ring-1 focus:ring-cyan-400 focus:outline-none"
                />
              </div>

              {/* 5. Coupon Promo Code */}
              <div className="p-4 bg-slate-950 border border-white/10 rounded-2xl space-y-2">
                <span className="text-[11px] font-bold text-white uppercase tracking-wider block">
                  Promo Discount Code
                </span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="Try WELCOME50 or TOPSTAPS100"
                    className="flex-1 px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-cyan-400"
                  />
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors"
                  >
                    Apply
                  </button>
                </div>
                {couponApplied && (
                  <p className="text-emerald-400 text-xs font-bold flex items-center gap-1 mt-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Coupon {couponApplied.coupon_code} applied! Saved ₹{couponApplied.discount_amount}</span>
                  </p>
                )}
              </div>

              {/* Pricing Breakdown Summary */}
              <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-1.5">
                <div className="flex justify-between text-slate-400">
                  <span>Standard Service Base</span>
                  <span className="text-white font-bold">₹{selectedService.base_price}</span>
                </div>
                {couponApplied && (
                  <div className="flex justify-between text-emerald-400 font-bold">
                    <span>Discount</span>
                    <span>- ₹{couponApplied.discount_amount}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-400">
                  <span>GST (18% CGST + SGST)</span>
                  <span>₹{((couponApplied ? couponApplied.final_amount : selectedService.base_price) * 0.18).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-base font-black text-white pt-2 border-t border-white/10">
                  <span>Total Payable</span>
                  <span className="text-cyan-400">
                    ₹{((couponApplied ? couponApplied.final_amount : selectedService.base_price) * 1.18).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Confirm CTA */}
              <button
                type="button"
                onClick={handleConfirmBooking}
                disabled={bookingLoading}
                className="w-full py-3.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-black rounded-2xl text-xs transition-all shadow-xl shadow-blue-600/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {bookingLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Confirming Appointment Slot...</span>
                  </span>
                ) : (
                  <>
                    <Lock className="w-4 h-4 text-cyan-300" />
                    <span>Confirm &amp; Proceed to Payment</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Auth Modal */}
      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />

      {/* Razorpay Payment Modal */}
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
