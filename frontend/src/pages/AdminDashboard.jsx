import React, { useEffect, useState } from 'react';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  Shield, DollarSign, Users, Briefcase, CheckCircle2, XCircle,
  AlertTriangle, Tag, Plus, Check, Search, Calendar, ChevronRight
} from 'lucide-react';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview'); // overview, providers, complaints, services
  const [analytics, setAnalytics] = useState(null);
  const [providers, setProviders] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Resolution modal
  const [resolvingComplaint, setResolvingComplaint] = useState(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [resolveStatus, setResolveStatus] = useState('Resolved');

  // Add Service Category modal
  const [newCatName, setNewCatName] = useState('');
  const [newCatSlug, setNewCatSlug] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [showCatModal, setShowCatModal] = useState(false);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [anaRes, provRes, compRes, catRes] = await Promise.all([
        client.get('/api/analytics/admin'),
        client.get('/api/providers/all'),
        client.get('/api/reviews/complaints'),
        client.get('/api/services/categories')
      ]);
      setAnalytics(anaRes.data);
      setProviders(provRes.data || []);
      setComplaints(compRes.data || []);
      setCategories(catRes.data || []);
    } catch (err) {
      console.warn(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleVerifyProvider = async (providerId, status) => {
    try {
      await client.put(`/api/providers/${providerId}/verify`, { status });
      fetchAdminData();
    } catch (err) {
      alert('Verification status update failed');
    }
  };

  const handleResolveComplaint = async (e) => {
    e.preventDefault();
    if (!resolvingComplaint) return;
    try {
      await client.put(`/api/reviews/complaints/${resolvingComplaint.id}/resolve`, {
        status: resolveStatus,
        resolution_notes: resolutionNotes
      });
      setResolvingComplaint(null);
      setResolutionNotes('');
      fetchAdminData();
    } catch (err) {
      alert('Failed to resolve complaint');
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!newCatName || !newCatSlug) return;
    try {
      await client.post('/api/services/categories', {
        name: newCatName,
        slug: newCatSlug,
        description: newCatDesc,
        icon: 'Wrench'
      });
      setShowCatModal(false);
      setNewCatName('');
      setNewCatSlug('');
      setNewCatDesc('');
      fetchAdminData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to create category');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-purple-600 text-white flex items-center justify-center font-black text-2xl shadow-lg shadow-purple-500/30">
              🛡️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black tracking-tight">{user?.full_name || 'Super Admin'}</h1>
                <span className="bg-purple-500/30 text-purple-200 border border-purple-400/30 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                  Central Governance
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">Platform-wide overview, revenue, KYC audits, and dispute resolution.</p>
            </div>
          </div>

          {/* Tab buttons */}
          <div data-tour="admin-tabs" className="flex items-center gap-1.5 bg-slate-800 p-1.5 rounded-2xl text-xs font-semibold">
            {[
              { id: 'overview', label: 'Platform Analytics' },
              { id: 'providers', label: `KYC & Providers (${providers.filter(p => p.verification_status === 'pending').length} Pending)` },
              { id: 'complaints', label: `Disputes (${complaints.filter(c => c.status === 'Open').length})` },
              { id: 'categories', label: 'Service Catalog' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`py-2 px-3 rounded-xl transition-all ${
                  activeTab === t.id
                    ? 'bg-purple-600 text-white font-bold shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab 1: Platform Overview */}
        {activeTab === 'overview' && (
          <div data-tour="admin-overview" className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Bookings</span>
                <p className="text-3xl font-black text-slate-900 mt-1">{analytics?.overview?.total_bookings || 0}</p>
                <div className="flex gap-2 text-[10px] text-slate-500 mt-2">
                  <span className="text-emerald-600 font-bold">{analytics?.overview?.completed_bookings || 0} Done</span>
                  <span>•</span>
                  <span className="text-amber-600 font-bold">{analytics?.overview?.pending_bookings || 0} Pending</span>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Gross Platform Volume</span>
                <p className="text-3xl font-black text-slate-900 mt-1">₹{analytics?.overview?.total_revenue || 0}</p>
                <span className="text-[10px] text-slate-400 mt-2 block">Customer GMV Transacted</span>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600">Platform Commission</span>
                <p className="text-3xl font-black text-purple-600 mt-1">₹{analytics?.overview?.platform_commission || 0}</p>
                <span className="text-[10px] text-purple-700 font-semibold mt-2 block">15% SaaS Take-Rate</span>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Ecosystem Users</span>
                <p className="text-3xl font-black text-slate-900 mt-1">
                  {(analytics?.overview?.total_customers || 0) + (analytics?.overview?.total_providers || 0) + (analytics?.overview?.total_technicians || 0)}
                </p>
                <div className="text-[10px] text-slate-500 mt-2 flex gap-2">
                  <span>{analytics?.overview?.total_customers} Cust</span> •
                  <span>{analytics?.overview?.total_providers} Prov</span> •
                  <span>{analytics?.overview?.total_technicians} Tech</span>
                </div>
              </div>
            </div>

            {/* Popular Categories Breakdown */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
              <h3 className="font-bold text-slate-900 text-sm mb-4">Category Booking Performance</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {analytics?.popular_categories?.map((cat) => (
                  <div key={cat.category_name} className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-xs font-bold text-slate-800">{cat.category_name}</p>
                    <p className="text-xl font-black text-purple-600 mt-1">{cat.bookings_count}</p>
                    <span className="text-[10px] text-slate-400">Total Bookings</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Provider KYC & Verification */}
        {activeTab === 'providers' && (
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h2 className="text-base font-black text-slate-900">Provider Onboarding & KYC Management</h2>
                <p className="text-xs text-slate-500 mt-0.5">Audit uploaded documents and approve/reject partner accounts</p>
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {providers.map((p) => (
                <div key={p.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-900 text-sm">{p.business_name}</h3>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          p.verification_status === 'approved'
                            ? 'bg-emerald-100 text-emerald-800'
                            : p.verification_status === 'rejected'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {p.verification_status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">Owner: {p.full_name} ({p.email} • {p.phone})</p>
                    <p className="text-xs text-slate-500">{p.description}</p>
                    {p.id_proof_url && (
                      <a
                        href={p.id_proof_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] font-bold text-blue-600 hover:underline inline-block mt-1"
                      >
                        📄 View Submitted Identity / KYC Document ↗
                      </a>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-xs font-bold">
                    {p.verification_status !== 'approved' && (
                      <button
                        onClick={() => handleVerifyProvider(p.id, 'approved')}
                        className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center gap-1 shadow-xs"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Approve Provider</span>
                      </button>
                    )}
                    {p.verification_status !== 'rejected' && (
                      <button
                        onClick={() => handleVerifyProvider(p.id, 'rejected')}
                        className="py-1.5 px-3 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg flex items-center gap-1"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Disputes & Complaints */}
        {activeTab === 'complaints' && (
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-base font-black text-slate-900">Dispute & Complaint Resolution</h2>
              <p className="text-xs text-slate-500 mt-0.5">Manage customer dissatisfaction, delays, and service quality claims</p>
            </div>

            {complaints.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-400">
                No active complaints filed by customers.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {complaints.map((c) => (
                  <div key={c.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1 max-w-xl">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-purple-600">Booking {c.booking_code}</span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            c.status === 'Resolved' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {c.status}
                        </span>
                      </div>
                      <h3 className="font-bold text-slate-900 text-sm">{c.subject}</h3>
                      <p className="text-xs text-slate-600">{c.description}</p>
                      <p className="text-[11px] text-slate-400">Raised by: {c.customer_name} • Service: {c.service_name}</p>
                      {c.resolution_notes && (
                        <p className="text-xs text-emerald-700 bg-emerald-50 p-2 rounded-lg border border-emerald-100 font-medium">
                          Resolution: {c.resolution_notes}
                        </p>
                      )}
                    </div>

                    <div>
                      {c.status !== 'Resolved' && (
                        <button
                          onClick={() => setResolvingComplaint(c)}
                          className="py-1.5 px-3 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-xs"
                        >
                          Resolve Dispute
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Service Categories */}
        {activeTab === 'categories' && (
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h2 className="text-base font-black text-slate-900">Service Categories Catalog</h2>
                <p className="text-xs text-slate-500 mt-0.5">Configured home service domains</p>
              </div>
              <button
                onClick={() => setShowCatModal(true)}
                className="py-2 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Add Category</span>
              </button>
            </div>

            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {categories.map((cat) => (
                <div key={cat.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-slate-400">/{cat.slug}</span>
                    <h3 className="font-bold text-slate-900 text-sm mt-0.5">{cat.name}</h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{cat.description}</p>
                  </div>
                  <span className="text-[11px] text-purple-700 font-bold mt-3">
                    {cat.services?.length || 0} sub-services listed
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Resolve Dispute Modal */}
      {resolvingComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 border border-slate-200 space-y-4">
            <h3 className="font-bold text-slate-900 text-sm">Resolve Dispute for {resolvingComplaint.booking_code}</h3>
            <form onSubmit={handleResolveComplaint} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
                <select
                  value={resolveStatus}
                  onChange={(e) => setResolveStatus(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-xl text-xs"
                >
                  <option value="Resolved">Resolved (Satisfactory Resolution)</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Admin Resolution Remarks</label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Free re-service issued / Full refund processed via gateway."
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-xs"
                ></textarea>
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2 bg-purple-600 text-white font-bold rounded-xl text-xs"
                >
                  Confirm Resolution
                </button>
                <button
                  type="button"
                  onClick={() => setResolvingComplaint(null)}
                  className="py-2 px-4 bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Category Modal */}
      {showCatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 border border-slate-200 space-y-4">
            <h3 className="font-bold text-slate-900 text-sm">Add New Service Category</h3>
            <form onSubmit={handleCreateCategory} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Category Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Smart Home Installation"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">URL Slug</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. smart-home"
                  value={newCatSlug}
                  onChange={(e) => setNewCatSlug(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Short summary of this category"
                  value={newCatDesc}
                  onChange={(e) => setNewCatDesc(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-xs"
                ></textarea>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2 bg-purple-600 text-white font-bold rounded-xl text-xs"
                >
                  Create Category
                </button>
                <button
                  type="button"
                  onClick={() => setShowCatModal(false)}
                  className="py-2 px-4 bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

