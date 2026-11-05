import React, { useEffect, useState } from 'react';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  Calendar, Clock, MapPin, CreditCard, FileText, Star, AlertTriangle,
  RotateCcw, CheckCircle2, User, Plus, Trash2, ArrowRight, ShieldCheck,
  X, Sparkles, Phone, Wrench, Check, Camera, UploadCloud
} from 'lucide-react';
import PaymentModal from '../components/PaymentModal';
import InvoiceModal from '../components/InvoiceModal';

export default function CustomerDashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [selectedBookingForPay, setSelectedBookingForPay] = useState(null);
  const [selectedBookingForInvoice, setSelectedBookingForInvoice] = useState(null);
  const [uploadPhotoBooking, setUploadPhotoBooking] = useState(null);
  const [problemPhotoFile, setProblemPhotoFile] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  // Review Modal
  const [reviewBooking, setReviewBooking] = useState(null);
  const [rating, setRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  // Complaint Modal
  const [complaintBooking, setComplaintBooking] = useState(null);
  const [complaintSubject, setComplaintSubject] = useState('');
  const [complaintDesc, setComplaintDesc] = useState('');
  const [complaintSubmitting, setComplaintSubmitting] = useState(false);

  // Address Modal
  const [showAddAddr, setShowAddAddr] = useState(false);
  const [newTitle, setNewTitle] = useState('Home');
  const [newLine, setNewLine] = useState('');
  const [newCity, setNewCity] = useState('Mumbai');
  const [newPin, setNewPin] = useState('400076');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [profRes, bookRes] = await Promise.all([
        client.get('/api/customers/profile'),
        client.get('/api/bookings/my-bookings')
      ]);
      setProfile(profRes.data);
      setBookings(bookRes.data || []);
    } catch (err) {
      console.warn('Dashboard fetch err:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadProblemPhoto = async (e) => {
    e.preventDefault();
    if (!problemPhotoFile || !uploadPhotoBooking) return;
    setUploadingPhoto(true);
    const formData = new FormData();
    formData.append('file', problemPhotoFile);
    try {
      await client.post(`/api/bookings/${uploadPhotoBooking.id}/upload-problem-image`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert('Photo uploaded successfully to Cloudinary storage!');
      setUploadPhotoBooking(null);
      setProblemPhotoFile(null);
      fetchData();
    } catch (err) {
      console.warn(err);
      alert('Failed to upload photo');
    } finally {
      setUploadingPhoto(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCancelBooking = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    try {
      await client.put(`/api/bookings/${id}/status`, { status: 'Cancelled' });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to cancel booking');
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    setReviewSubmitting(true);
    try {
      await client.post('/api/reviews', {
        booking_id: reviewBooking.id,
        rating,
        comment: reviewComment
      });
      alert('Thank you! Your verified review has been submitted.');
      setReviewBooking(null);
      setReviewComment('');
      fetchData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to submit review');
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleSubmitComplaint = async (e) => {
    e.preventDefault();
    setComplaintSubmitting(true);
    try {
      await client.post('/api/reviews/complaints', {
        booking_id: complaintBooking.id,
        subject: complaintSubject,
        description: complaintDesc
      });
      alert('Complaint ticket registered! Our support operations team will inspect and respond shortly.');
      setComplaintBooking(null);
      setComplaintSubject('');
      setComplaintDesc('');
      fetchData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to submit ticket');
    } finally {
      setComplaintSubmitting(false);
    }
  };

  const handleAddAddress = async (e) => {
    e.preventDefault();
    if (!newLine.trim()) return;
    try {
      await client.post('/api/customers/addresses', {
        title: newTitle,
        address_line: newLine,
        city: newCity,
        pincode: newPin,
        is_default: profile?.addresses?.length === 0
      });
      setShowAddAddr(false);
      setNewLine('');
      fetchData();
    } catch (err) {
      alert('Failed to add address');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Completed':
        return (
          <span className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 px-2.5 py-0.5 rounded-full text-[11px] font-bold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>Completed</span>
          </span>
        );
      case 'In Progress':
        return (
          <span className="bg-blue-500/10 border border-blue-500/30 text-cyan-300 px-2.5 py-0.5 rounded-full text-[11px] font-bold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
            <span>In Progress</span>
          </span>
        );
      case 'Provider Assigned':
      case 'Confirmed':
        return (
          <span className="bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 px-2.5 py-0.5 rounded-full text-[11px] font-bold">
            Confirmed &amp; Assigned
          </span>
        );
      case 'Cancelled':
        return (
          <span className="bg-red-500/10 border border-red-500/30 text-red-400 px-2.5 py-0.5 rounded-full text-[11px] font-bold">
            Cancelled
          </span>
        );
      case 'Pending':
      default:
        return (
          <span className="bg-amber-500/10 border border-amber-500/30 text-amber-300 px-2.5 py-0.5 rounded-full text-[11px] font-bold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
            <span>Awaiting Dispatch</span>
          </span>
        );
    }
  };

  // Compute stat metrics
  const totalBookings = bookings.length;
  const completedCount = bookings.filter((b) => b.status === 'Completed').length;
  const activeCount = bookings.filter((b) => ['Pending', 'Confirmed', 'Provider Assigned', 'In Progress'].includes(b.status)).length;
  const totalSpent = bookings
    .filter((b) => b.payment?.status === 'Paid')
    .reduce((sum, b) => sum + Number(b.final_amount || 0), 0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background radial glows */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute top-1/2 left-10 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-7xl mx-auto space-y-8 relative z-10">
        {/* Welcome Header */}
        <div className="bg-slate-900/80 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 text-white flex items-center justify-center font-black text-2xl shadow-lg shadow-cyan-500/25">
              {user?.full_name ? user.full_name[0].toUpperCase() : 'C'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-white tracking-tight">{user?.full_name}</h1>
                <span className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  Verified Customer
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">{user?.email} • {user?.phone || 'Powai, Mumbai'}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAddAddr(true)}
              className="py-2.5 px-4 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-all border border-white/10 flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-cyan-400" />
              <span>Add Address</span>
            </button>
            <a
              href="/services"
              className="py-2.5 px-5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-blue-500/25 flex items-center gap-1.5 cursor-pointer"
            >
              <span>Book New Service</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Active Appointments', value: activeCount, color: 'text-cyan-400', bg: 'from-blue-500/10 to-cyan-500/10' },
            { label: 'Completed Services', value: completedCount, color: 'text-emerald-400', bg: 'from-emerald-500/10 to-teal-500/10' },
            { label: 'Total Services Booked', value: totalBookings, color: 'text-white', bg: 'from-white/5 to-white/10' },
            { label: 'Total Paid (Online)', value: `₹${totalSpent.toFixed(0)}`, color: 'text-cyan-300', bg: 'from-indigo-500/10 to-purple-500/10' },
          ].map((stat, i) => (
            <div
              key={i}
              className={`p-5 rounded-2xl border border-white/10 bg-gradient-to-br ${stat.bg} backdrop-blur-md`}
            >
              <span className="text-[11px] font-semibold text-slate-400 block">{stat.label}</span>
              <span className={`text-2xl font-black mt-1 block ${stat.color}`}>{stat.value}</span>
            </div>
          ))}
        </div>

        {/* Content Tabs: My Bookings & Saved Addresses */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Column: Bookings List */}
          <div data-tour="customer-bookings" className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                <span>My Service Appointments</span>
                <span className="text-xs font-mono bg-white/10 text-cyan-400 px-2 py-0.5 rounded-full">
                  {bookings.length}
                </span>
              </h2>
            </div>

            {loading ? (
              <div className="text-center py-16 text-xs text-slate-400 flex flex-col items-center gap-2">
                <div className="w-7 h-7 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
                <span>Syncing your appointment schedule...</span>
              </div>
            ) : bookings.length === 0 ? (
              <div className="bg-slate-900/60 rounded-3xl p-10 border border-white/10 text-center space-y-3">
                <p className="font-bold text-white text-base">No scheduled services yet.</p>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Browse our certified home services catalog to schedule an instant inspection, AC tune-up, or repair.
                </p>
                <a
                  href="/services"
                  className="inline-flex items-center gap-2 py-2.5 px-5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/25"
                >
                  <span>Explore Services Catalog</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            ) : (
              bookings.map((b) => (
                <div
                  key={b.id}
                  className="bg-slate-900/80 backdrop-blur-md rounded-3xl border border-white/10 p-6 shadow-xl space-y-5 hover:border-white/20 transition-all"
                >
                  {/* Card top */}
                  <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/10 pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded">
                          {b.booking_code}
                        </span>
                        {getStatusBadge(b.status)}
                      </div>
                      <h3 className="font-black text-white text-lg mt-1.5">{b.service_name}</h3>
                      <p className="text-xs text-slate-400 mt-0.5">Partner: {b.provider_name || 'TOPS & Taps Network'}</p>
                    </div>

                    <div className="text-right">
                      <span className="text-xl font-black text-white">₹{b.final_amount}</span>
                      <div className="text-[11px] font-semibold mt-1">
                        {b.payment?.status === 'Paid' ? (
                          <span className="text-emerald-400 flex items-center justify-end gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Paid Online</span>
                          </span>
                        ) : (
                          <span className="text-amber-400 flex items-center justify-end gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            <span>Payment Pending</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Schedule & Address info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-300">
                    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/5 border border-white/5">
                      <Calendar className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span>{b.booking_date} • {b.time_slot}</span>
                    </div>
                    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/5 border border-white/5">
                      <MapPin className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span className="truncate">{b.address}</span>
                    </div>
                  </div>

                  {/* Technician Info (if assigned) */}
                  {b.assigned_technician && (
                    <div className="p-4 bg-gradient-to-r from-blue-950/40 to-slate-900 border border-cyan-500/20 rounded-2xl text-xs flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center justify-center font-bold text-sm">
                          <Wrench className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-bold text-white text-xs">{b.assigned_technician.name}</p>
                          <p className="text-[10px] text-slate-400">Assigned Technician • {b.assigned_technician.phone}</p>
                        </div>
                      </div>
                      <span className="text-[11px] font-bold text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-1 rounded-full">
                        {b.assigned_technician.status}
                      </span>
                    </div>
                  )}

                  {/* Existing Review or Complaint */}
                  {b.review && (
                    <div className="p-3.5 bg-white/5 border border-white/10 rounded-2xl text-xs space-y-1.5">
                      <div className="flex items-center gap-1.5 text-amber-400 font-bold">
                        <Star className="w-3.5 h-3.5 fill-amber-400" />
                        <span>You rated: {b.review.rating} / 5</span>
                      </div>
                      <p className="text-slate-300 italic">"{b.review.comment}"</p>
                      {b.review.provider_reply && (
                        <p className="text-[11px] text-cyan-300 font-medium">
                          ↳ Partner Reply: {b.review.provider_reply}
                        </p>
                      )}
                    </div>
                  )}

                  {b.complaint && (
                    <div className="p-3.5 bg-red-500/10 border border-red-500/20 rounded-2xl text-xs space-y-1">
                      <span className="font-bold text-red-400">Dispute Status: {b.complaint.status}</span>
                      <p className="text-slate-200 font-medium">{b.complaint.subject}</p>
                      {b.complaint.resolution && (
                        <p className="text-emerald-400 font-bold mt-1">Admin Resolution: {b.complaint.resolution}</p>
                      )}
                    </div>
                  )}

                  {/* Verified Service & Inspection Photos (Cloudinary Storage) */}
                  {b.images && b.images.length > 0 && (
                    <div className="p-4 bg-slate-950/80 border border-white/10 rounded-2xl text-xs space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-200 flex items-center gap-2 text-xs">
                          <Camera className="w-4 h-4 text-cyan-400" />
                          <span>Service Inspection &amp; Work Proof Photos ({b.images.length})</span>
                        </span>
                        <span className="text-[10px] text-emerald-400 font-mono font-semibold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" />
                          <span>Cloudinary CDN</span>
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                        {b.images.map((img) => (
                          <div
                            key={img.id}
                            onClick={() => setPreviewImage(img.url)}
                            className="group relative rounded-xl overflow-hidden border border-white/10 bg-slate-900 aspect-video cursor-pointer hover:border-cyan-400 transition-all shadow-md"
                          >
                            <img
                              src={img.url}
                              alt={img.type}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-1.5">
                              <span className="px-1.5 py-0.5 rounded bg-black/60 text-[9px] font-bold uppercase tracking-wider text-cyan-300 backdrop-blur-xs">
                                {img.type === 'after_work' ? '✓ After Service' : img.type === 'before_work' ? '• Before Service' : '• Problem Photo'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions Toolbar */}
                  <div className="flex flex-wrap items-center gap-2.5 pt-3 border-t border-white/10 text-xs font-bold">
                    {/* Pay trigger */}
                    {b.payment?.status !== 'Paid' && b.status !== 'Cancelled' && (
                      <button
                        onClick={() => setSelectedBookingForPay(b)}
                        className="py-2 px-3.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-xl flex items-center gap-1.5 cursor-pointer shadow-md shadow-blue-500/20"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>Pay Online ₹{b.final_amount}</span>
                      </button>
                    )}

                    {/* Attach Photo to Booking */}
                    <button
                      onClick={() => setUploadPhotoBooking(b)}
                      className="py-2 px-3 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors"
                      title="Attach photo of the issue to Cloudinary"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>Attach Photo</span>
                    </button>

                    {/* View Invoice */}
                    <button
                      onClick={() => setSelectedBookingForInvoice(b)}
                      className="py-2 px-3.5 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <FileText className="w-3.5 h-3.5 text-cyan-400" />
                      <span>GST Tax Invoice</span>
                    </button>

                    {/* Rate & Review (If completed) */}
                    {b.status === 'Completed' && !b.review && (
                      <button
                        onClick={() => { setReviewBooking(b); setRating(5); }}
                        className="py-2 px-3.5 bg-amber-500/10 border border-amber-500/20 text-amber-300 hover:bg-amber-500/20 rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <Star className="w-3.5 h-3.5 fill-amber-400" />
                        <span>Rate Service</span>
                      </button>
                    )}

                    {/* Raise Complaint */}
                    {!b.complaint && (
                      <button
                        onClick={() => setComplaintBooking(b)}
                        className="py-2 px-3.5 bg-white/5 hover:bg-red-500/10 text-slate-400 hover:text-red-400 rounded-xl flex items-center gap-1.5 ml-auto cursor-pointer transition-colors"
                      >
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Dispute</span>
                      </button>
                    )}

                    {/* Cancel booking if pending/confirmed */}
                    {['Pending', 'Confirmed'].includes(b.status) && (
                      <button
                        onClick={() => handleCancelBooking(b.id)}
                        className="py-2 px-3 text-red-400 hover:bg-red-500/10 rounded-xl cursor-pointer transition-colors"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Sidebar Column: Saved Addresses */}
          <div data-tour="customer-addresses" className="space-y-4">
            <div className="bg-slate-900/80 backdrop-blur-md rounded-3xl p-6 border border-white/10 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-white text-sm">Saved Addresses</h3>
                <button
                  onClick={() => setShowAddAddr(!showAddAddr)}
                  className="text-cyan-400 hover:text-cyan-300 text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{showAddAddr ? 'Close' : 'Add'}</span>
                </button>
              </div>

              {showAddAddr && (
                <form onSubmit={handleAddAddress} className="p-4 bg-slate-950 border border-cyan-500/30 rounded-2xl space-y-2.5 text-xs">
                  <span className="font-bold text-cyan-300 block">Add New Location</span>
                  <select
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-white text-xs"
                  >
                    <option>Home</option>
                    <option>Office</option>
                    <option>Other</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Address Line / Flat / Society"
                    value={newLine}
                    onChange={(e) => setNewLine(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-white text-xs"
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
                      value={newPin}
                      onChange={(e) => setNewPin(e.target.value)}
                      className="px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-white text-xs font-mono"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors"
                  >
                    Save Address
                  </button>
                </form>
              )}

              {profile?.addresses?.length === 0 ? (
                <p className="text-xs text-slate-400">No addresses saved yet.</p>
              ) : (
                <div className="space-y-2.5">
                  {profile?.addresses?.map((addr) => (
                    <div
                      key={addr.id}
                      className="p-3.5 bg-white/5 border border-white/5 rounded-2xl text-xs space-y-1 hover:border-white/10 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                          {addr.title}
                        </span>
                        {addr.is_default && (
                          <span className="bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-bold px-2 py-0.5 rounded text-[10px]">
                            Default
                          </span>
                        )}
                      </div>
                      <p className="text-slate-400 text-[11px] leading-relaxed">{addr.address_line}</p>
                      <p className="text-slate-500 text-[10px]">{addr.city} - {addr.pincode}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Platform Guarantee Card */}
            <div className="p-5 rounded-3xl bg-gradient-to-br from-blue-950/40 to-slate-900 border border-white/10 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-cyan-400 font-bold">
                <ShieldCheck className="w-4 h-4" />
                <span>TOPS &amp; Taps Protection</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                All bookings are covered by our 30-day rework warranty. Payments are safely escrowed until service completion.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Razorpay Payment Modal */}
      {selectedBookingForPay && (
        <PaymentModal
          isOpen={!!selectedBookingForPay}
          onClose={() => setSelectedBookingForPay(null)}
          booking={selectedBookingForPay}
          onSuccess={() => {
            setSelectedBookingForPay(null);
            fetchData();
          }}
        />
      )}

      {/* Invoice Modal */}
      {selectedBookingForInvoice && (
        <InvoiceModal
          isOpen={!!selectedBookingForInvoice}
          onClose={() => setSelectedBookingForInvoice(null)}
          booking={selectedBookingForInvoice}
        />
      )}

      {/* Review Modal */}
      {reviewBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-white/15 rounded-3xl shadow-2xl w-full max-w-md p-6 text-white space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-bold">Rate Service Experience</h3>
              <button
                onClick={() => setReviewBooking(null)}
                className="p-1 rounded-lg hover:bg-white/10 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-400">
              Booking: <span className="text-cyan-400 font-mono">{reviewBooking.booking_code}</span> • {reviewBooking.service_name}
            </p>
            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2">Overall Rating</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setRating(s)}
                      className="p-2 rounded-xl transition-all hover:scale-110 cursor-pointer"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          s <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-600'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-sm font-bold text-amber-400 ml-2">{rating} / 5 Stars</span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Your Review Feedback</label>
                <textarea
                  rows={3}
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Tell others how was the punctuality, hygiene, and work quality..."
                  className="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-xl text-white text-xs focus:ring-1 focus:ring-cyan-400 focus:outline-none"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={reviewSubmitting}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-blue-500/25 cursor-pointer disabled:opacity-60"
              >
                {reviewSubmitting ? 'Submitting...' : 'Submit Verified Review'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Complaint / Dispute Modal */}
      {complaintBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-white/15 rounded-3xl shadow-2xl w-full max-w-md p-6 text-white space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-bold text-red-400">File a Service Dispute</h3>
              <button
                onClick={() => setComplaintBooking(null)}
                className="p-1 rounded-lg hover:bg-white/10 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-400">
              Booking: <span className="text-cyan-400 font-mono">{complaintBooking.booking_code}</span>
            </p>
            <form onSubmit={handleSubmitComplaint} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Dispute Subject</label>
                <input
                  type="text"
                  value={complaintSubject}
                  onChange={(e) => setComplaintSubject(e.target.value)}
                  placeholder="e.g. Technician delayed, incomplete cleaning"
                  className="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-red-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Issue Details</label>
                <textarea
                  rows={3}
                  value={complaintDesc}
                  onChange={(e) => setComplaintDesc(e.target.value)}
                  placeholder="Provide complete details for our administrative escalation team..."
                  className="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-red-500"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={complaintSubmitting}
                className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer disabled:opacity-60"
              >
                {complaintSubmitting ? 'Registering...' : 'Register Complaint Ticket'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Upload Problem Photo Modal (Cloudinary) */}
      {uploadPhotoBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-150">
          <div className="bg-slate-900 rounded-3xl p-6 border border-white/15 max-w-md w-full shadow-2xl text-white space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-bold">Attach Service Photo</h3>
              </div>
              <button
                onClick={() => { setUploadPhotoBooking(null); setProblemPhotoFile(null); }}
                className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-300">
              Upload an image of the appliance, leakage, or wiring for booking{' '}
              <span className="font-mono text-cyan-300 font-bold">{uploadPhotoBooking.booking_code}</span>. 
              The photo will be stored on Cloudinary for technician diagnosis.
            </p>
            <form onSubmit={handleUploadProblemPhoto} className="space-y-4 text-xs">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setProblemPhotoFile(e.target.files[0])}
                className="w-full text-slate-300 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-cyan-500/20 file:text-cyan-300 file:font-bold hover:file:bg-cyan-500/30 cursor-pointer"
                required
              />
              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => { setUploadPhotoBooking(null); setProblemPhotoFile(null); }}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploadingPhoto || !problemPhotoFile}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 font-bold text-white disabled:opacity-50 cursor-pointer"
                >
                  {uploadingPhoto ? 'Uploading to Cloudinary...' : 'Upload Image'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Image Lightbox Modal */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in cursor-pointer"
        >
          <div className="relative max-w-3xl w-full max-h-[85vh] flex flex-col items-center">
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute -top-10 right-0 p-1.5 text-white/80 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={previewImage}
              alt="Enlarged service proof"
              className="max-h-[80vh] w-auto rounded-2xl border border-white/20 shadow-2xl object-contain"
            />
            <p className="text-xs text-slate-400 mt-3 font-mono">Cloudinary High-Res Media Asset</p>
          </div>
        </div>
      )}
    </div>
  );
}
