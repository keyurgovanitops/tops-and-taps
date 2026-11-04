import React, { useEffect, useState } from 'react';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  Shield, DollarSign, Users, Briefcase, CheckCircle2, XCircle,
  AlertTriangle, Tag, Plus, Check, Search, Calendar, ChevronRight, X, Sparkles
} from 'lucide-react';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview'); // overview, providers, complaints, categories
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
    <div className="min-h-screen bg-slate-950 text-slate-100 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background ambient glows */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute top-1/2 left-10 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-7xl mx-auto space-y-8 relative z-10">
        {/* Header */}
        <div className="bg-slate-900/80 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center font-black text-2xl shadow-lg shadow-purple-500/25">
              🛡️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-white tracking-tight">{user?.full_name || 'Platform Administrator'}</h1>
                <span className="bg-purple-500/10 border border-purple-500/30 text-purple-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse"></span>
                  Super Admin Console
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">Platform-wide governance, automated 15% commission take-rate, KYC approvals &amp; disputes.</p>
            </div>
          </div>

          {/* Tab buttons */}
          <div data-tour="admin-tabs" className="flex flex-wrap items-center gap-1.5 bg-slate-950 p-1.5 rounded-2xl border border-white/10 text-xs font-semibold">
            {[
              { id: 'overview', label: 'Platform Analytics' },
              { id: 'providers', label: `KYC & Providers (${providers.filter(p => p.verification_status === 'pending').length} Pending)` },
              { id: 'complaints', label: `Disputes (${complaints.filter(c => c.status === 'Open').length})` },
              { id: 'categories', label: 'Service Catalog' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`py-2 px-3 rounded-xl transition-all cursor-pointer ${
                  activeTab === t.id
                    ? 'bg-purple-600 text-white font-bold shadow-md shadow-purple-600/25'
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
              <div className="bg-slate-900/80 backdrop-blur-md p-5 rounded-2xl border border-white/10 shadow-xl">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Bookings</span>
                <p className="text-3xl font-black text-white mt-1">{analytics?.overview?.total_bookings || 0}</p>
                <div className="flex gap-2 text-[10px] text-slate-400 mt-2">
                  <span className="text-emerald-400 font-bold">{analytics?.overview?.completed_bookings || 0} Done</span>
                  <span>•</span>
                  <span className="text-amber-400 font-bold">{analytics?.overview?.pending_bookings || 0} Pending</span>
                </div>
              </div>

              <div className="bg-slate-900/80 backdrop-blur-md p-5 rounded-2xl border border-white/10 shadow-xl">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Gross Platform Volume</span>
                <p className="text-3xl font-black text-cyan-400 mt-1">₹{analytics?.overview?.total_revenue || 0}</p>
                <span className="text-[10px] text-slate-500 mt-2 block">Customer GMV Processed</span>
              </div>

              <div className="bg-slate-900/80 backdrop-blur-md p-5 rounded-2xl border border-white/10 shadow-xl">
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">Platform Commission</span>
                <p className="text-3xl font-black text-purple-400 mt-1">₹{analytics?.overview?.platform_commission || 0}</p>
                <span className="text-[10px] text-purple-300 font-semibold mt-2 block">15% SaaS Take-Rate</span>
              </div>

              <div className="bg-slate-900/80 backdrop-blur-md p-5 rounded-2xl border border-white/10 shadow-xl">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Ecosystem Users</span>
                <p className="text-3xl font-black text-white mt-1">
                  {(analytics?.overview?.total_customers || 0) + (analytics?.overview?.total_providers || 0) + (analytics?.overview?.total_technicians || 0)}
                </p>
                <div className="text-[10px] text-slate-400 mt-2 flex gap-2">
                  <span>{analytics?.overview?.total_customers} Cust</span> •
                  <span>{analytics?.overview?.total_providers} Prov</span> •
                  <span>{analytics?.overview?.total_technicians} Tech</span>
                </div>
              </div>
            </div>

            {/* Popular Categories Breakdown */}
            <div className="bg-slate-900/80 backdrop-blur-md rounded-3xl p-6 border border-white/10 shadow-xl">
              <h3 className="font-bold text-white text-sm mb-4">Category Booking Performance</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {analytics?.popular_categories?.map((cat) => (
                  <div key={cat.category_name} className="p-4 bg-white/5 rounded-2xl border border-white/5">
                    <p className="text-xs font-bold text-slate-200">{cat.category_name}</p>
                    <p className="text-xl font-black text-purple-400 mt-1">{cat.bookings_count}</p>
                    <span className="text-[10px] text-slate-500">Total Bookings</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Provider KYC & Verification */}
        {activeTab === 'providers' && (
          <div className="bg-slate-900/80 backdrop-blur-md rounded-3xl border border-white/10 overflow-hidden shadow-xl">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <div>
                <h2 className="text-base font-black text-white">Provider Onboarding &amp; KYC Verification</h2>
                <p className="text-xs text-slate-400 mt-0.5">Audit identity proofs, approve partner accounts, or revoke access</p>
              </div>
            </div>

            <div className="divide-y divide-white/10">
              {providers.map((p) => (
                <div key={p.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-white/5 transition-colors">
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-white text-sm">{p.business_name}</h3>
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                          p.verification_status === 'approved'
                            ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                            : p.verification_status === 'rejected'
                            ? 'bg-red-500/10 border border-red-500/30 text-red-400'
                            : 'bg-amber-500/10 border border-amber-500/30 text-amber-300'
                        }`}
                      >
                        {p.verification_status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-slate-300">Owner: {p.full_name} ({p.email} • {p.phone})</p>
                    <p className="text-slate-400">{p.description}</p>
                    {p.id_proof_url && (
                      <a
                        href={p.id_proof_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] font-bold text-cyan-400 hover:underline inline-block mt-1"
                      >
                        📄 View Submitted Identity / KYC Proof ↗
                      </a>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-xs font-bold">
                    {p.verification_status !== 'approved' && (
                      <button
                        onClick={() => handleVerifyProvider(p.id, 'approved')}
                        className="py-2 px-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors shadow-md shadow-emerald-600/20"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Approve Provider</span>
                      </button>
                    )}
                    {p.verification_status !== 'rejected' && (
                      <button
                        onClick={() => handleVerifyProvider(p.id, 'rejected')}
                        className="py-2 px-3.5 bg-red-600/80 hover:bg-red-600 text-white rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors"
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
          <div className="bg-slate-900/80 backdrop-blur-md rounded-3xl border border-white/10 overflow-hidden shadow-xl">
            <div className="p-6 border-b border-white/10">
              <h2 className="text-base font-black text-white">Dispute &amp; Complaint Escalations</h2>
              <p className="text-xs text-slate-400 mt-0.5">Mediate customer quality claims, delayed dispatches, and refunds</p>
            </div>

            {complaints.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-400">
                No active complaints filed by customers.
              </div>
            ) : (
              <div className="divide-y divide-white/10">
                {complaints.map((c) => (
                  <div key={c.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-white/5 transition-colors">
                    <div className="space-y-1.5 max-w-xl text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded">
                          Booking {c.booking_code}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            c.status === 'Resolved' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                          }`}
                        >
                          {c.status}
                        </span>
                      </div>
                      <h3 className="font-bold text-white text-sm">{c.subject}</h3>
                      <p className="text-slate-300">{c.description}</p>
                      <p className="text-[11px] text-slate-400">Customer: {c.customer_name} • Service: {c.service_name}</p>
                      {c.resolution_notes && (
                        <p className="text-xs text-emerald-400 bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20 font-medium">
                          Resolution: {c.resolution_notes}
                        </p>
                      )}
                    </div>

                    {c.status !== 'Resolved' && (
                      <button
                        onClick={() => setResolvingComplaint(c)}
                        className="py-2 px-3.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md shadow-purple-600/25 shrink-0"
                      >
                        <Shield className="w-3.5 h-3.5" />
                        <span>Resolve Ticket</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Service Categories */}
        {activeTab === 'categories' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-black text-white">Active Service Categories ({categories.length})</h2>
              <button
                onClick={() => setShowCatModal(true)}
                className="py-2.5 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md shadow-purple-600/25"
              >
                <Plus className="w-4 h-4" />
                <span>Add Category</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map((c) => (
                <div key={c.id} className="p-5 bg-slate-900/80 backdrop-blur-md rounded-2xl border border-white/10 shadow-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-sm">{c.name}</span>
                    <span className="text-[10px] font-mono text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded">
                      /{c.slug}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-2">{c.description || 'Verified home service branch'}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Resolve Complaint Modal */}
      {resolvingComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-white/15 rounded-3xl shadow-2xl w-full max-w-md p-6 text-white space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-bold">Resolve Customer Dispute</h3>
              <button
                onClick={() => setResolvingComplaint(null)}
                className="p-1 rounded-lg hover:bg-white/10 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleResolveComplaint} className="space-y-4 text-xs">
              <p className="text-slate-400">
                Booking: <span className="text-cyan-400 font-mono">{resolvingComplaint.booking_code}</span> • Issue: {resolvingComplaint.subject}
              </p>
              <div>
                <label className="block font-bold text-slate-300 mb-1">Resolution Outcome</label>
                <select
                  value={resolveStatus}
                  onChange={(e) => setResolveStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-xl text-white text-xs"
                >
                  <option value="Resolved">Resolved (No Penalty)</option>
                  <option value="Resolved with Refund">Resolved (Full / Partial Refund Issued)</option>
                  <option value="Closed">Closed (Invalid Claim)</option>
                </select>
              </div>
              <div>
                <label className="block font-bold text-slate-300 mb-1">Official Administrator Notes</label>
                <textarea
                  rows={3}
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Explain remediation taken, coupon credit issued, or provider warning..."
                  className="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-xl text-white text-xs"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Submit Official Resolution
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add Category Modal */}
      {showCatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-white/15 rounded-3xl shadow-2xl w-full max-w-md p-6 text-white space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-bold">Add Service Category</h3>
              <button
                onClick={() => setShowCatModal(false)}
                className="p-1 rounded-lg hover:bg-white/10 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateCategory} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-300 mb-1">Category Title</label>
                <input
                  type="text"
                  placeholder="e.g. Solar Panel Services"
                  value={newCatName}
                  onChange={(e) => {
                    setNewCatName(e.target.value);
                    setNewCatSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
                  }}
                  className="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-xl text-white text-xs"
                  required
                />
              </div>
              <div>
                <label className="block font-bold text-slate-300 mb-1">URL Slug</label>
                <input
                  type="text"
                  value={newCatSlug}
                  onChange={(e) => setNewCatSlug(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-xl text-white text-xs font-mono"
                  required
                />
              </div>
              <div>
                <label className="block font-bold text-slate-300 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={newCatDesc}
                  onChange={(e) => setNewCatDesc(e.target.value)}
                  placeholder="Brief description of this home service vertical..."
                  className="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-xl text-white text-xs"
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Create Category
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
