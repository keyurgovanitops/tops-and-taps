import React, { useEffect, useState } from 'react';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  Wrench, CheckCircle2, Clock, MapPin, Phone, Calendar,
  UploadCloud, AlertCircle, FileText, ChevronRight, Check, X,
  ShieldCheck, Camera
} from 'lucide-react';

export default function TechnicianDashboard() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Status & Notes Modal
  const [activeJobForUpdate, setActiveJobForUpdate] = useState(null);
  const [nextStatus, setNextStatus] = useState('In Progress');
  const [workNotes, setWorkNotes] = useState('');
  const [updating, setUpdating] = useState(false);

  // Image Upload
  const [uploadJob, setUploadJob] = useState(null);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadType, setUploadType] = useState('after_work');
  const [uploading, setUploading] = useState(false);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const res = await client.get('/api/technicians/my-jobs');
      setJobs(res.data || []);
    } catch (err) {
      console.warn(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!activeJobForUpdate) return;
    setUpdating(true);
    try {
      await client.put(`/api/technicians/jobs/${activeJobForUpdate.assignment_id}/status`, {
        status: nextStatus,
        technician_notes: workNotes || undefined
      });
      setActiveJobForUpdate(null);
      setWorkNotes('');
      fetchJobs();
    } catch (err) {
      alert(err.response?.data?.detail || 'Status update failed');
    } finally {
      setUpdating(false);
    }
  };

  const handleUploadProof = async (e) => {
    e.preventDefault();
    if (!uploadFile || !uploadJob) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', uploadFile);
    try {
      await client.post(`/api/technicians/jobs/${uploadJob.booking_id}/upload-image?image_type=${uploadType}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert('Proof of service image uploaded successfully!');
      setUploadJob(null);
      setUploadFile(null);
      fetchJobs();
    } catch (err) {
      alert('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background ambient glows */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute top-1/2 left-10 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-4xl mx-auto space-y-6 relative z-10">
        {/* Top Header */}
        <div className="bg-slate-900/80 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-600 text-white flex items-center justify-center font-black text-xl shadow-lg shadow-cyan-500/25">
              <Wrench className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-white">{user?.full_name}</h1>
                <span className="bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
                  Field Technician
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">{user?.specialization || 'Master Home Electrician & AC Specialist'}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3.5 py-2 rounded-2xl text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-slate-300 font-semibold">Active &amp; Ready for Jobs</span>
          </div>
        </div>

        {/* Jobs List */}
        <div data-tour="tech-jobs" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
              <span>My Assigned Field Work</span>
              <span className="text-xs font-mono bg-white/10 text-cyan-400 px-2 py-0.5 rounded-full">
                {jobs.length}
              </span>
            </h2>
          </div>

          {loading ? (
            <div className="text-center py-16 text-xs text-slate-400 flex flex-col items-center gap-2">
              <div className="w-7 h-7 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
              <span>Fetching your job queue...</span>
            </div>
          ) : jobs.length === 0 ? (
            <div className="bg-slate-900/60 rounded-3xl p-10 border border-white/10 text-center space-y-2">
              <p className="font-bold text-white text-base">No active jobs assigned today.</p>
              <p className="text-xs text-slate-400">Keep your app open. Your provider will dispatch assignments shortly.</p>
            </div>
          ) : (
            jobs.map((j) => (
              <div
                key={j.assignment_id}
                className="bg-slate-900/80 backdrop-blur-md rounded-3xl border border-white/10 p-6 shadow-xl space-y-5 hover:border-white/20 transition-all"
              >
                {/* Header */}
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/10 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded">
                        {j.booking_code}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-slate-300">
                        {j.assignment_status}
                      </span>
                    </div>
                    <h3 className="font-black text-white text-base mt-1.5">{j.service_name}</h3>
                    <p className="text-xs text-slate-400">Customer: <span className="font-bold text-white">{j.customer_name}</span></p>
                  </div>

                  <a
                    href={`tel:${j.customer_phone}`}
                    className="py-2 px-3.5 bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 text-emerald-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Phone className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Call Customer</span>
                  </a>
                </div>

                {/* Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-300">
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/5 border border-white/5">
                    <Calendar className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>{j.booking_date} ({j.time_slot})</span>
                  </div>
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/5 border border-white/5">
                    <MapPin className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span className="truncate">{j.address}</span>
                  </div>
                </div>

                {j.problem_description && (
                  <div className="p-3 bg-white/5 rounded-2xl border border-white/5 text-xs">
                    <span className="font-bold text-slate-400 text-[10px] uppercase block mb-0.5">Problem Notes</span>
                    <p className="text-slate-300 italic">"{j.problem_description}"</p>
                  </div>
                )}

                {/* Status Advancement & Image Upload buttons */}
                <div className="flex flex-wrap items-center gap-2.5 pt-3 border-t border-white/10 text-xs font-bold">
                  {/* Status transitions */}
                  {j.assignment_status === 'Assigned' && (
                    <button
                      onClick={() => {
                        setActiveJobForUpdate(j);
                        setNextStatus('En Route');
                      }}
                      className="py-2 px-3.5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl cursor-pointer shadow-md shadow-blue-500/20"
                    >
                      Start Travel (En Route)
                    </button>
                  )}

                  {j.assignment_status === 'En Route' && (
                    <button
                      onClick={() => {
                        setActiveJobForUpdate(j);
                        setNextStatus('In Progress');
                      }}
                      className="py-2 px-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl cursor-pointer shadow-md shadow-blue-500/20"
                    >
                      Arrived &amp; Start Work
                    </button>
                  )}

                  {j.assignment_status === 'In Progress' && (
                    <button
                      onClick={() => {
                        setActiveJobForUpdate(j);
                        setNextStatus('Completed');
                      }}
                      className="py-2 px-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl flex items-center gap-1 cursor-pointer transition-colors shadow-md shadow-emerald-500/20"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Mark Work Completed</span>
                    </button>
                  )}

                  {/* Upload photo proof button */}
                  <button
                    onClick={() => setUploadJob(j)}
                    className="py-2 px-3.5 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white rounded-xl flex items-center gap-1.5 ml-auto cursor-pointer transition-colors"
                  >
                    <Camera className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Upload Proof Photo</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Status Update Modal */}
      {activeJobForUpdate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-white/15 rounded-3xl shadow-2xl w-full max-w-md p-6 text-white space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-bold">Update Job Stage</h3>
              <button
                onClick={() => setActiveJobForUpdate(null)}
                className="p-1 rounded-lg hover:bg-white/10 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-400">
              Advancing status to: <span className="text-cyan-400 font-bold">{nextStatus}</span>
            </p>
            <form onSubmit={handleUpdateStatus} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-300 mb-1">Technician Log / Work Notes (Optional)</label>
                <textarea
                  rows={3}
                  value={workNotes}
                  onChange={(e) => setWorkNotes(e.target.value)}
                  placeholder="e.g. Replaced burnt switch, checked circuit load, verified no leakage."
                  className="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-xl text-white text-xs focus:ring-1 focus:ring-cyan-400 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={updating}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-blue-500/25 cursor-pointer disabled:opacity-50"
              >
                {updating ? 'Updating...' : `Confirm: ${nextStatus}`}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Upload Proof Modal */}
      {uploadJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-white/15 rounded-3xl shadow-2xl w-full max-w-md p-6 text-white space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-bold">Upload Proof of Service</h3>
              <button
                onClick={() => setUploadJob(null)}
                className="p-1 rounded-lg hover:bg-white/10 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleUploadProof} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-300 mb-1">Proof Stage</label>
                <select
                  value={uploadType}
                  onChange={(e) => setUploadType(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-xl text-white text-xs focus:ring-1 focus:ring-cyan-400 focus:outline-none"
                >
                  <option value="after_work">Job Completion (After Work)</option>
                  <option value="before_work">Initial Inspection (Before Work)</option>
                </select>
              </div>
              <div>
                <label className="block font-bold text-slate-300 mb-1">Photo File</label>
                <input
                  type="file"
                  onChange={(e) => setUploadFile(e.target.files[0])}
                  className="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-xl text-slate-300 text-xs"
                  accept="image/*"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={uploading}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-blue-500/25 cursor-pointer disabled:opacity-50"
              >
                {uploading ? 'Uploading...' : 'Save Service Proof'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
