import React, { useEffect, useState } from 'react';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  Briefcase, DollarSign, Star, Users, CheckCircle2, XCircle, UserPlus,
  Clock, Calendar, MapPin, UploadCloud, AlertCircle, FileCheck, X,
  ShieldCheck, ArrowRight, Wrench, Check
} from 'lucide-react';

export default function ProviderDashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);

  // Assign Tech Modal
  const [selectedBookingForAssign, setSelectedBookingForAssign] = useState(null);
  const [selectedTechId, setSelectedTechId] = useState('');
  const [assignLoading, setAssignLoading] = useState(false);

  // KYC Upload Modal
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);

  const fetchProviderData = async () => {
    try {
      setLoading(true);
      const [profRes, statRes, bookRes, techRes] = await Promise.all([
        client.get('/api/providers/profile'),
        client.get('/api/analytics/provider'),
        client.get('/api/bookings/my-bookings'),
        client.get('/api/technicians/provider-technicians')
      ]);
      setProfile(profRes.data);
      setAnalytics(statRes.data);
      setBookings(bookRes.data || []);
      setTechnicians(techRes.data || []);
      if (techRes.data?.length > 0) {
        setSelectedTechId(techRes.data[0].id);
      }
    } catch (err) {
      console.warn('Provider data fetch err:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProviderData();
  }, []);

  const handleUpdateStatus = async (bookingId, newStatus) => {
    try {
      await client.put(`/api/bookings/${bookingId}/status`, { status: newStatus });
      fetchProviderData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to update booking status');
    }
  };

  const handleAssignTechnician = async (e) => {
    e.preventDefault();
    if (!selectedTechId || !selectedBookingForAssign) return;
    setAssignLoading(true);
    try {
      await client.put(`/api/bookings/${selectedBookingForAssign.id}/assign-technician`, {
        technician_id: Number(selectedTechId)
      });
      setSelectedBookingForAssign(null);
      fetchProviderData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to assign technician');
    } finally {
      setAssignLoading(false);
    }
  };

  const handleUploadKYC = async (e) => {
    e.preventDefault();
    if (!uploadFile) return;
    setUploadLoading(true);
    const formData = new FormData();
    formData.append('file', uploadFile);
    try {
      await client.post('/api/providers/upload-document', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert('KYC document submitted for verification!');
      setUploadOpen(false);
      fetchProviderData();
    } catch (err) {
      alert('Upload failed');
    } finally {
      setUploadLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background ambient glows */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute top-1/2 left-10 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-7xl mx-auto space-y-8 relative z-10">
        {/* Header & Verification Banner */}
        <div className="bg-slate-900/80 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-700 text-white flex items-center justify-center font-black text-2xl shadow-lg shadow-amber-500/25">
              🏢
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-white tracking-tight">
                  {profile?.business_name || user?.full_name}
                </h1>
                <span
                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                    profile?.verification_status === 'approved'
                      ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                      : 'bg-amber-500/10 border border-amber-500/30 text-amber-300'
                  }`}
                >
                  <ShieldCheck className="w-3 h-3" />
                  <span>KYC: {profile?.verification_status ? profile.verification_status.toUpperCase() : 'PENDING'}</span>
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Platform Commission: {profile?.commission_rate}% • Rating: {profile?.rating} ★ ({profile?.total_reviews} reviews)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setUploadOpen(true)}
              className="py-2.5 px-4 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <UploadCloud className="w-4 h-4 text-amber-400" />
              <span>Submit KYC Proof</span>
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div data-tour="provider-stats" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900/80 backdrop-blur-md p-5 rounded-2xl border border-white/10 shadow-xl">
            <div className="flex justify-between items-center text-slate-400 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider">Total Orders</span>
              <Briefcase className="w-4 h-4 text-blue-400" />
            </div>
            <p className="text-2xl font-black text-white">{analytics?.total_bookings || 0}</p>
            <span className="text-[11px] text-slate-500 mt-1 block">Pending Dispatch: {analytics?.pending_requests || 0}</span>
          </div>

          <div className="bg-slate-900/80 backdrop-blur-md p-5 rounded-2xl border border-white/10 shadow-xl">
            <div className="flex justify-between items-center text-slate-400 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider">Completed</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-2xl font-black text-white">{analytics?.completed_services || 0}</p>
            <span className="text-[11px] text-emerald-400 font-semibold mt-1 block">Successfully Delivered</span>
          </div>

          <div className="bg-slate-900/80 backdrop-blur-md p-5 rounded-2xl border border-white/10 shadow-xl">
            <div className="flex justify-between items-center text-slate-400 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider">Net Settlements</span>
              <DollarSign className="w-4 h-4 text-cyan-400" />
            </div>
            <p className="text-2xl font-black text-cyan-400">₹{analytics?.total_net_earnings || 0}</p>
            <span className="text-[11px] text-slate-500 mt-1 block">Post {profile?.commission_rate}% Platform Cut</span>
          </div>

          <div className="bg-slate-900/80 backdrop-blur-md p-5 rounded-2xl border border-white/10 shadow-xl">
            <div className="flex justify-between items-center text-slate-400 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider">Field Technicians</span>
              <Users className="w-4 h-4 text-indigo-400" />
            </div>
            <p className="text-2xl font-black text-white">{technicians.length}</p>
            <span className="text-[11px] text-slate-500 mt-1 block">Available for Dispatch</span>
          </div>
        </div>

        {/* Bookings Dispatch Table */}
        <div data-tour="provider-orders" className="bg-slate-900/80 backdrop-blur-md rounded-3xl border border-white/10 overflow-hidden shadow-xl">
          <div className="p-6 border-b border-white/10 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-white tracking-tight">Booking Dispatch Operations</h2>
              <p className="text-xs text-slate-400 mt-0.5">Manage incoming orders, assign field staff, and trigger completion</p>
            </div>
            <span className="text-xs font-mono font-bold text-cyan-300 bg-white/5 border border-white/10 px-3 py-1 rounded-full">
              {bookings.length} Orders
            </span>
          </div>

          {loading ? (
            <div className="text-center py-16 text-xs text-slate-400 flex flex-col items-center gap-2">
              <div className="w-7 h-7 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
              <span>Fetching provider dispatches...</span>
            </div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-16 text-xs text-slate-400">
              No orders assigned to your partner account yet.
            </div>
          ) : (
            <div className="divide-y divide-white/10">
              {bookings.map((b) => (
                <div key={b.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-5 hover:bg-white/5 transition-colors">
                  <div className="space-y-1.5 max-w-lg text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded">
                        {b.booking_code}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-slate-300">
                        {b.status}
                      </span>
                    </div>
                    <h3 className="font-black text-white text-base mt-1">{b.service_name}</h3>
                    <p className="text-slate-300">
                      Customer: <span className="font-bold text-white">{b.customer_name}</span> ({b.customer_phone})
                    </p>
                    <p className="text-slate-400 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span>{b.address}</span>
                    </p>
                    <p className="text-slate-400 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span>{b.booking_date} ({b.time_slot})</span>
                    </p>
                    {b.problem_description && (
                      <p className="text-slate-400 bg-white/5 p-2.5 rounded-xl border border-white/5 italic">
                        "{b.problem_description}"
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col md:items-end justify-between gap-3 text-xs">
                    <div className="text-right">
                      <span className="text-lg font-black text-white">₹{b.final_amount}</span>
                      <p className="text-[11px] text-emerald-400 font-bold">
                        Net Payout: ₹{(b.final_amount * 0.85).toFixed(2)}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 font-bold">
                      {/* Accept / Reject */}
                      {b.status === 'Pending' && (
                        <>
                          <button
                            onClick={() => handleUpdateStatus(b.id, 'Confirmed')}
                            className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Accept</span>
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(b.id, 'Rejected')}
                            className="py-1.5 px-3 bg-red-600/80 hover:bg-red-600 text-white rounded-xl flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Reject</span>
                          </button>
                        </>
                      )}

                      {/* Assign Tech */}
                      {['Confirmed', 'Provider Assigned'].includes(b.status) && (
                        <button
                          onClick={() => {
                            setSelectedBookingForAssign(b);
                            if (technicians.length > 0) setSelectedTechId(technicians[0].id);
                          }}
                          className="py-1.5 px-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl flex items-center gap-1.5 cursor-pointer shadow-md shadow-blue-500/20"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>Assign Technician</span>
                        </button>
                      )}

                      {/* Advance Status */}
                      {b.status === 'Provider Assigned' && (
                        <button
                          onClick={() => handleUpdateStatus(b.id, 'In Progress')}
                          className="py-1.5 px-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl cursor-pointer transition-colors"
                        >
                          Mark In Progress
                        </button>
                      )}

                      {b.status === 'In Progress' && (
                        <button
                          onClick={() => handleUpdateStatus(b.id, 'Completed')}
                          className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl cursor-pointer transition-colors"
                        >
                          Complete Job
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Assign Technician Modal */}
      {selectedBookingForAssign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-white/15 rounded-3xl shadow-2xl w-full max-w-md p-6 text-white space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-bold">Assign Field Technician</h3>
              <button
                onClick={() => setSelectedBookingForAssign(null)}
                className="p-1 rounded-lg hover:bg-white/10 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-400">
              Booking: <span className="text-cyan-400 font-mono">{selectedBookingForAssign.booking_code}</span> • {selectedBookingForAssign.service_name}
            </p>
            <form onSubmit={handleAssignTechnician} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-300 mb-2">Select On-Duty Staff</label>
                {technicians.length === 0 ? (
                  <p className="text-amber-400 bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">
                    No active technicians registered under your business.
                  </p>
                ) : (
                  <select
                    value={selectedTechId}
                    onChange={(e) => setSelectedTechId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-xl text-white text-xs focus:ring-1 focus:ring-cyan-400 focus:outline-none"
                  >
                    {technicians.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.specialization}) {t.is_available ? '• Available' : '• Busy'}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <button
                type="submit"
                disabled={assignLoading || technicians.length === 0}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-blue-500/25 cursor-pointer disabled:opacity-50"
              >
                {assignLoading ? 'Dispatching...' : 'Confirm Field Dispatch'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* KYC Upload Modal */}
      {uploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-white/15 rounded-3xl shadow-2xl w-full max-w-md p-6 text-white space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-bold">Upload KYC Documentation</h3>
              <button
                onClick={() => setUploadOpen(false)}
                className="p-1 rounded-lg hover:bg-white/10 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleUploadKYC} className="space-y-4 text-xs">
              <p className="text-slate-400">
                Upload your Business Registration Certificate, GST Certificate, or Government ID proof.
              </p>
              <input
                type="file"
                onChange={(e) => setUploadFile(e.target.files[0])}
                className="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-xl text-slate-300 text-xs"
                accept="image/*,.pdf"
                required
              />
              <button
                type="submit"
                disabled={uploadLoading}
                className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {uploadLoading ? 'Uploading...' : 'Submit Document'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
