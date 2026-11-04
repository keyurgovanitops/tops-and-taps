import React, { useEffect, useState } from 'react';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  Calendar, Clock, MapPin, CreditCard, FileText, Star, AlertTriangle,
  RotateCcw, CheckCircle2, User, Plus, Trash2, ArrowRight, ShieldCheck, X
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
      alert('Thank you! Your review has been submitted.');
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
      alert('Complaint registered! Our support admin will review shortly.');
      setComplaintBooking(null);
      setComplaintSubject('');
      setComplaintDesc('');
      fetchData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to file complaint');
    } finally {
      setComplaintSubmitting(false);
    }
  };

  const handleAddAddress = async (e) => {
    e.preventDefault();
    try {
      await client.post('/api/customers/addresses', {
        title: newTitle,
        address_line: newLine,
        city: newCity,
        pincode: newPin,
        is_default: false
      });
      setShowAddAddr(false);
      setNewLine('');
      fetchData();
    } catch (err) {
      alert('Failed to save address');
    }
  };

  const handleDeleteAddress = async (addrId) => {
    try {
      await client.delete(`/api/customers/addresses/${addrId}`);
      fetchData();
    } catch (err) {
      alert('Could not delete address');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Completed':
        return <span className="bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full text-xs font-bold">Completed</span>;
      case 'In Progress':
        return <span className="bg-blue-100 text-blue-800 px-2.5 py-1 rounded-full text-xs font-bold animate-pulse">In Progress</span>;
      case 'Provider Assigned':
        return <span className="bg-indigo-100 text-indigo-800 px-2.5 py-1 rounded-full text-xs font-bold">Tech Assigned</span>;
      case 'Confirmed':
        return <span className="bg-teal-100 text-teal-800 px-2.5 py-1 rounded-full text-xs font-bold">Confirmed</span>;
      case 'Cancelled':
      case 'Rejected':
        return <span className="bg-red-100 text-red-800 px-2.5 py-1 rounded-full text-xs font-bold">{status}</span>;
      case 'Pending':
      default:
        return <span className="bg-amber-100 text-amber-800 px-2.5 py-1 rounded-full text-xs font-bold">Pending Confirmation</span>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Welcome Header */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black text-2xl shadow-lg shadow-blue-500/20">
              {user?.full_name ? user.full_name[0].toUpperCase() : 'C'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">{user?.full_name}</h1>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Verified Customer
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">{user?.email} • {user?.phone || 'Phone not set'}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddAddr(true)}
              className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Manage Addresses</span>
            </button>
            <a
              href="/services"
              className="py-2.5 px-5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/20 flex items-center gap-1.5"
            >
              <span>Book New Service</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Content Tabs: My Bookings & Addresses */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main: Bookings List */}
          <div data-tour="customer-bookings" className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-slate-900 tracking-tight">
                My Appointments & Bookings ({bookings.length})
              </h2>
            </div>

            {loading ? (
              <div className="text-center py-12 text-xs text-slate-400">Loading bookings...</div>
            ) : bookings.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center">
                <p className="font-bold text-slate-700 text-sm">No bookings yet.</p>
                <p className="text-xs text-slate-400 mt-1 mb-4">You haven't scheduled any home services yet.</p>
                <a
                  href="/services"
                  className="inline-flex items-center gap-1.5 py-2 px-4 bg-blue-600 text-white rounded-xl text-xs font-bold"
                >
                  Browse Services Catalog
                </a>
              </div>
            ) : (
              bookings.map((b) => (
                <div
                  key={b.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4"
                >
                  {/* Card top */}
                  <div className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-500">{b.booking_code}</span>
                        {getStatusBadge(b.status)}
                      </div>
                      <h3 className="font-bold text-slate-900 text-base mt-1">{b.service_name}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">Partner: {b.provider_name}</p>
                    </div>

                    <div className="text-right">
                      <span className="text-base font-black text-slate-900">₹{b.final_amount}</span>
                      <div className="text-[11px] font-semibold mt-0.5">
                        {b.payment?.status === 'Paid' ? (
                          <span className="text-emerald-600 flex items-center justify-end gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Paid Online
                          </span>
                        ) : (
                          <span className="text-amber-600">Payment Pending</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Schedule & Address info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
                      <span>{b.booking_date} ({b.time_slot})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
                      <span className="truncate">{b.address}</span>
                    </div>
                  </div>

                  {/* Technician Info (if assigned) */}
                  {b.assigned_technician && (
                    <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl text-xs flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                          🔧
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{b.assigned_technician.name}</p>
                          <p className="text-[10px] text-slate-500">Field Technician • {b.assigned_technician.phone}</p>
                        </div>
                      </div>
                      <span className="text-[11px] font-bold text-indigo-700 bg-white px-2 py-0.5 rounded shadow-xs">
                        {b.assigned_technician.status}
                      </span>
                    </div>
                  )}

                  {/* Existing Review or Complaint */}
                  {b.review && (
                    <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1">
                      <div className="flex items-center gap-1 text-amber-500 font-bold">
                        <Star className="w-3.5 h-3.5 fill-amber-400" />
                        <span>You rated {b.review.rating} / 5</span>
                      </div>
                      <p className="text-slate-600 italic">"{b.review.comment}"</p>
                      {b.review.provider_reply && (
                        <p className="text-[11px] text-blue-700 font-medium mt-1">
                          ↳ Partner Reply: {b.review.provider_reply}
                        </p>
                      )}
                    </div>
                  )}

                  {b.complaint && (
                    <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-xs space-y-1">
                      <span className="font-bold text-red-700">Complaint Status: {b.complaint.status}</span>
                      <p className="text-slate-700 font-medium">{b.complaint.subject}</p>
                      {b.complaint.resolution && (
                        <p className="text-emerald-700 font-bold mt-1">Admin Resolution: {b.complaint.resolution}</p>
                      )}
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs font-bold">
                    {/* Pay trigger */}
                    {b.payment?.status !== 'Paid' && b.status !== 'Cancelled' && (
                      <button
                        onClick={() => setSelectedBookingForPay(b)}
                        className="py-1.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-1.5"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>Pay ₹{b.final_amount}</span>
                      </button>
                    )}

                    {/* View Invoice */}
                    <button
                      onClick={() => setSelectedBookingForInvoice(b)}
                      className="py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg flex items-center gap-1.5"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Receipt & Tax Invoice</span>
                    </button>

                    {/* Rate & Review (If completed) */}
                    {b.status === 'Completed' && !b.review && (
                      <button
                        onClick={() => { setReviewBooking(b); setRating(5); }}
                        className="py-1.5 px-3 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg flex items-center gap-1.5"
                      >
                        <Star className="w-3.5 h-3.5" />
                        <span>Rate Service</span>
                      </button>
                    )}

                    {/* Raise Complaint */}
                    {!b.complaint && (
                      <button
                        onClick={() => setComplaintBooking(b)}
                        className="py-1.5 px-3 bg-slate-50 hover:bg-red-50 text-slate-600 hover:text-red-700 rounded-lg flex items-center gap-1.5 ml-auto"
                      >
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Dispute / Complaint</span>
                      </button>
                    )}

                    {/* Cancel booking if pending/confirmed */}
                    {['Pending', 'Confirmed'].includes(b.status) && (
                      <button
                        onClick={() => handleCancelBooking(b.id)}
                        className="py-1.5 px-3 text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Sidebar: Saved Addresses */}
          <div data-tour="customer-addresses" className="space-y-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-sm">Saved Addresses</h3>
                <button
                  onClick={() => setShowAddAddr(!showAddAddr)}
                  className="text-xs text-blue-600 font-bold hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add New</span>
                </button>
              </div>

              {showAddAddr && (
                <form onSubmit={handleAddAddress} className="p-3 bg-slate-50 rounded-xl space-y-2 text-xs border border-slate-200">
                  <input
                    type="text"
                    required
                    placeholder="Label (e.g. Home, Office, Mom's House)"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                  />
                  <input
                    type="text"
                    required
                    placeholder="Address Line / Flat / Society"
                    value={newLine}
                    onChange={(e) => setNewLine(e.target.value)}
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
                      value={newPin}
                      onChange={(e) => setNewPin(e.target.value)}
                      className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button
                      type="submit"
                      className="flex-1 py-1.5 bg-blue-600 text-white font-bold rounded-lg"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddAddr(false)}
                      className="py-1.5 px-3 bg-slate-200 text-slate-700 font-bold rounded-lg"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              <div className="space-y-2">
                {profile?.addresses?.map((a) => (
                  <div key={a.id} className="p-3 rounded-xl border border-slate-200 text-xs flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-800">{a.title}</span>
                        {a.is_default && (
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-semibold">
                            Default
                          </span>
                        )}
                      </div>
                      <p className="text-slate-500 mt-0.5 leading-snug">{a.address_line}, {a.city} - {a.pincode}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteAddress(a.id)}
                      className="text-slate-400 hover:text-red-600 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Coupons Box */}
            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl p-5 border border-indigo-100 text-xs space-y-2">
              <span className="font-bold uppercase tracking-wider text-[10px] text-indigo-700 block">
                Available Promo Coupons
              </span>
              <div className="bg-white p-2.5 rounded-xl border border-indigo-200/50 flex justify-between items-center">
                <div>
                  <span className="font-mono font-bold text-indigo-900">WELCOME50</span>
                  <p className="text-[10px] text-slate-500">50% off on first booking</p>
                </div>
                <span className="text-[10px] bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded">Active</span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-indigo-200/50 flex justify-between items-center">
                <div>
                  <span className="font-mono font-bold text-indigo-900">TOPSTAPS100</span>
                  <p className="text-[10px] text-slate-500">₹100 flat discount</p>
                </div>
                <span className="text-[10px] bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded">Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment & Invoice Modals */}
      <PaymentModal
        isOpen={!!selectedBookingForPay}
        onClose={() => setSelectedBookingForPay(null)}
        booking={selectedBookingForPay}
        onSuccess={() => fetchData()}
      />
      <InvoiceModal
        isOpen={!!selectedBookingForInvoice}
        onClose={() => setSelectedBookingForInvoice(null)}
        booking={selectedBookingForInvoice}
      />

      {/* Review Modal */}
      {reviewBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 border border-slate-200 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-slate-900 text-sm">Review Service Provider</h3>
              <button onClick={() => setReviewBooking(null)}><X className="w-4 h-4 text-slate-400" /></button>
            </div>
            <p className="text-xs text-slate-500">How was your service with <span className="font-bold text-slate-800">{reviewBooking.provider_name}</span> for {reviewBooking.service_name}?</p>
            <div className="flex justify-center gap-2 py-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <button key={s} type="button" onClick={() => setRating(s)} className="p-1 text-2xl">
                  <Star className={`w-7 h-7 ${rating >= s ? 'text-amber-400 fill-amber-400' : 'text-slate-300'}`} />
                </button>
              ))}
            </div>
            <textarea
              rows={3}
              placeholder="Write your experience..."
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              className="w-full p-2.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
            ></textarea>
            <button
              onClick={handleSubmitReview}
              disabled={reviewSubmitting}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs disabled:opacity-50"
            >
              {reviewSubmitting ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        </div>
      )}

      {/* Complaint Modal */}
      {complaintBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 border border-slate-200 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-slate-900 text-sm">Raise Complaint / Dispute</h3>
              <button onClick={() => setComplaintBooking(null)}><X className="w-4 h-4 text-slate-400" /></button>
            </div>
            <p className="text-xs text-slate-500">Report an issue regarding booking ref: <span className="font-bold text-slate-800">{complaintBooking.booking_code}</span></p>
            <input
              type="text"
              required
              placeholder="Subject (e.g. Technician delayed / Incomplete work)"
              value={complaintSubject}
              onChange={(e) => setComplaintSubject(e.target.value)}
              className="w-full p-2.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            <textarea
              rows={3}
              required
              placeholder="Detailed description of the dispute..."
              value={complaintDesc}
              onChange={(e) => setComplaintDesc(e.target.value)}
              className="w-full p-2.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
            ></textarea>
            <button
              onClick={handleSubmitComplaint}
              disabled={complaintSubmitting}
              className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs disabled:opacity-50"
            >
              {complaintSubmitting ? 'Filing Complaint...' : 'Submit to Admin Support'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

