import React, { useEffect, useState } from 'react';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  Briefcase, DollarSign, Star, Users, CheckCircle2, XCircle, UserPlus,
  Clock, Calendar, MapPin, UploadCloud, AlertCircle, FileCheck, X
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
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header & Verification Banner */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-black text-2xl shadow-lg shadow-amber-500/20">
              🏢
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                  {profile?.business_name || user?.full_name}
                </h1>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    profile?.verification_status === 'approved'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  KYC: {profile?.verification_status ? profile.verification_status.toUpperCase() : 'PENDING'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Commission: {profile?.commission_rate}% • Rating: {profile?.rating} ★ ({profile?.total_reviews} reviews)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setUploadOpen(true)}
              className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Upload KYC Document</span>
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div data-tour="provider-stats" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex justify-between items-center text-slate-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Total Bookings</span>
              <Briefcase className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-2xl font-black text-slate-900">{analytics?.total_bookings || 0}</p>
            <span className="text-[11px] text-slate-500 mt-1 block">Pending: {analytics?.pending_requests || 0}</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex justify-between items-center text-slate-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Completed</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-black text-slate-900">{analytics?.completed_services || 0}</p>
            <span className="text-[11px] text-emerald-600 font-semibold mt-1 block">Successfully Delivered</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex justify-between items-center text-slate-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Net Earnings</span>
              <DollarSign className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-black text-emerald-600">₹{analytics?.total_net_earnings || 0}</p>
            <span className="text-[11px] text-slate-400 mt-1 block">After {profile?.commission_rate}% Platform Cut</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex justify-between items-center text-slate-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Technicians</span>
              <Users className="w-4 h-4 text-indigo-600" />
            </div>
            <p className="text-2xl font-black text-slate-900">{technicians.length}</p>
            <span className="text-[11px] text-slate-500 mt-1 block">Available for Dispatch</span>
          </div>
        </div>

        {/* Bookings Dispatch Table */}
        <div data-tour="provider-orders" className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-6 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">Booking Dispatch Management</h2>
              <p className="text-xs text-slate-500 mt-0.5">Accept incoming service orders and dispatch field technicians</p>
            </div>
            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
              {bookings.length} Orders
            </span>
          </div>

          {loading ? (
            <div className="text-center py-16 text-xs text-slate-400">Loading orders...</div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-16 text-xs text-slate-500">
              No orders assigned to your business yet.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {bookings.map((b) => (
                <div key={b.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
                  <div className="space-y-1 max-w-lg">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-blue-600">{b.booking_code}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        {b.status}
                      </span>
                    </div>
                    <h3 className="font-bold text-slate-900 text-sm">{b.service_name}</h3>
                    <p className="text-xs text-slate-600">Customer: <span className="font-medium text-slate-800">{b.customer_name}</span> ({b.customer_phone})</p>
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{b.address}</span>
                    </p>
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{b.booking_date} ({b.time_slot})</span>
                    </p>
                    {b.problem_description && (
                      <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100">
                        Problem note: "{b.problem_description}"
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col md:items-end justify-between gap-3">
                    <div className="text-right">
                      <span className="text-base font-black text-slate-900">₹{b.final_amount}</span>
                      <p className="text-[11px] text-emerald-600 font-bold">
                        Net: ₹{(b.final_amount * 0.85).toFixed(2)}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
                      {/* Accept / Reject */}
                      {b.status === 'Pending' && (
                        <>
                          <button
                            onClick={() => handleUpdateStatus(b.id, 'Confirmed')}
                            className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Accept Order</span>
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(b.id, 'Rejected')}
                            className="py-1.5 px-3 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg flex items-center gap-1"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Reject</span>
                          </button>
                        </>
                      )}

                      {/* Assign Technician */}
                      {['Confirmed', 'Provider Assigned'].includes(b.status) && (
                        <button
                          onClick={() => setSelectedBookingForAssign(b)}
                          className="py-1.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-1"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>{b.assigned_technician ? 'Reassign Tech' : 'Assign Technician'}</span>
                        </button>
                      )}

                      {b.assigned_technician && (
                        <span className="text-xs text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-1 rounded-lg">
                          Assigned: {b.assigned_technician.name}
                        </span>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 border border-slate-200 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-slate-900 text-sm">Assign Field Technician</h3>
              <button onClick={() => setSelectedBookingForAssign(null)}><X className="w-4 h-4 text-slate-400" /></button>
            </div>
            <p className="text-xs text-slate-500">
              Dispatch a technician for booking <span className="font-bold text-slate-800">{selectedBookingForAssign.booking_code}</span> ({selectedBookingForAssign.service_name}).
            </p>

            <form onSubmit={handleAssignTechnician} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Choose Technician</label>
                <div className="space-y-2">
                  {technicians.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => setSelectedTechId(t.id)}
                      className={`p-3 rounded-xl border cursor-pointer text-xs flex items-center justify-between transition-colors ${
                        selectedTechId === t.id
                          ? 'border-blue-600 bg-blue-50 font-bold text-blue-900'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div>
                        <p className="font-bold">{t.full_name}</p>
                        <p className="text-[10px] text-slate-500">{t.specialization} • {t.phone}</p>
                      </div>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">
                        Available
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={assignLoading}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs disabled:opacity-50"
              >
                {assignLoading ? 'Dispatching...' : 'Confirm Dispatch'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* KYC Upload Modal */}
      {uploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 border border-slate-200 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-slate-900 text-sm">Upload Identity & Verification Document</h3>
              <button onClick={() => setUploadOpen(false)}><X className="w-4 h-4 text-slate-400" /></button>
            </div>
            <p className="text-xs text-slate-500">
              Submit business GST, Trade License, or government ID proof for Super Admin verification.
            </p>
            <form onSubmit={handleUploadKYC} className="space-y-4">
              <input
                type="file"
                required
                onChange={(e) => setUploadFile(e.target.files[0])}
                className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              <button
                type="submit"
                disabled={uploadLoading}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs disabled:opacity-50"
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

