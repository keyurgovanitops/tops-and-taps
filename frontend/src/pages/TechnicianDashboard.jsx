import React, { useEffect, useState } from 'react';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  Wrench, CheckCircle2, Clock, MapPin, Phone, Calendar,
  UploadCloud, AlertCircle, FileText, ChevronRight, Check, X
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
      alert('Proof image uploaded successfully!');
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
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Top Header */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-cyan-600 text-white flex items-center justify-center font-black text-xl shadow-lg shadow-cyan-500/20">
              🔧
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-slate-900">{user?.full_name}</h1>
                <span className="bg-cyan-100 text-cyan-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Field Technician
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">{user?.specialization || 'Home Services Technician'}</p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs font-bold text-slate-500">Active Work Orders:</span>
            <span className="ml-2 text-lg font-black text-cyan-700">{jobs.length}</span>
          </div>
        </div>

        {/* Jobs List */}
        <div data-tour="tech-jobs" className="space-y-4">
          <h2 className="text-base font-black text-slate-900 tracking-tight">Assigned Job Tasks</h2>

          {loading ? (
            <div className="text-center py-16 text-xs text-slate-400">Loading assignments...</div>
          ) : jobs.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center">
              <p className="font-bold text-slate-700 text-sm">No jobs assigned right now.</p>
              <p className="text-xs text-slate-400 mt-1">Check back once your service provider dispatches a work order.</p>
            </div>
          ) : (
            jobs.map((j) => (
              <div
                key={j.assignment_id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4"
              >
                {/* Header */}
                <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                  <div>
                    <span className="font-mono text-xs font-bold text-slate-400">{j.booking_code}</span>
                    <h3 className="font-bold text-slate-900 text-base">{j.service_name}</h3>
                  </div>
                  <span
                    className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                      j.job_status === 'Completed'
                        ? 'bg-emerald-100 text-emerald-800'
                        : j.job_status === 'In Progress'
                        ? 'bg-blue-100 text-blue-800 animate-pulse'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {j.job_status}
                  </span>
                </div>

                {/* Customer Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="space-y-1">
                    <p className="text-slate-400 font-bold uppercase text-[10px]">Customer Contact</p>
                    <p className="font-bold text-slate-800">{j.customer_name}</p>
                    <a href={`tel:${j.customer_phone}`} className="text-blue-600 font-medium flex items-center gap-1 hover:underline">
                      <Phone className="w-3.5 h-3.5" />
                      <span>{j.customer_phone}</span>
                    </a>
                  </div>

                  <div className="space-y-1">
                    <p className="text-slate-400 font-bold uppercase text-[10px]">Location & Slot</p>
                    <p className="text-slate-700 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{j.address}</span>
                    </p>
                    <p className="text-slate-500 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{j.booking_date} ({j.time_slot})</span>
                    </p>
                  </div>
                </div>

                {j.problem_description && (
                  <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-700 border border-slate-100">
                    <span className="font-bold block mb-0.5 text-slate-900">Customer Note:</span>
                    <p>{j.problem_description}</p>
                  </div>
                )}

                {j.technician_notes && (
                  <div className="p-3 bg-blue-50/50 rounded-xl text-xs text-blue-900 border border-blue-100">
                    <span className="font-bold block mb-0.5">Technician Completion Remarks:</span>
                    <p>{j.technician_notes}</p>
                  </div>
                )}

                {/* Attached Work Photos */}
                {j.images?.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase text-slate-400">Attached Photos:</span>
                    <div className="flex gap-2 overflow-x-auto py-1">
                      {j.images.map((img) => (
                        <div key={img.id} className="relative rounded-lg overflow-hidden border border-slate-200 w-20 h-20 shrink-0">
                          <img src={img.url} alt="work photo" className="w-full h-full object-cover" />
                          <span className="absolute bottom-0 inset-x-0 bg-black/70 text-white text-[9px] text-center font-bold">
                            {img.type}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs font-bold">
                  {j.job_status !== 'Completed' && (
                    <>
                      {j.job_status === 'Assigned' && (
                        <button
                          onClick={() => {
                            setActiveJobForUpdate(j);
                            setNextStatus('En Route');
                          }}
                          className="py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs"
                        >
                          Mark En Route / Arrived
                        </button>
                      )}

                      {j.job_status === 'En Route' && (
                        <button
                          onClick={() => {
                            setActiveJobForUpdate(j);
                            setNextStatus('In Progress');
                          }}
                          className="py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs"
                        >
                          Start Job (In Progress)
                        </button>
                      )}

                      {j.job_status === 'In Progress' && (
                        <button
                          onClick={() => {
                            setActiveJobForUpdate(j);
                            setNextStatus('Completed');
                          }}
                          className="py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs flex items-center gap-1.5"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Mark Job Completed</span>
                        </button>
                      )}

                      <button
                        onClick={() => setUploadJob(j)}
                        className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl flex items-center gap-1.5 ml-auto"
                      >
                        <UploadCloud className="w-4 h-4" />
                        <span>Upload Work Photo</span>
                      </button>
                    </>
                  )}
                  {j.job_status === 'Completed' && (
                    <span className="text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                      <Check className="w-4 h-4" />
                      <span>Task Closed & Verified</span>
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Status Update Modal */}
      {activeJobForUpdate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 border border-slate-200 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-slate-900 text-sm">Update Job Progress</h3>
              <button onClick={() => setActiveJobForUpdate(null)}><X className="w-4 h-4 text-slate-400" /></button>
            </div>
            <p className="text-xs text-slate-500">
              Updating status of booking <span className="font-bold text-slate-800">{activeJobForUpdate.booking_code}</span> to <span className="font-bold text-blue-600">{nextStatus}</span>.
            </p>

            <form onSubmit={handleUpdateStatus} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Technician Notes / Remarks</label>
                <textarea
                  rows={3}
                  placeholder="e.g. Replaced 16A switch and verified voltage stability."
                  value={workNotes}
                  onChange={(e) => setWorkNotes(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={updating}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs disabled:opacity-50"
              >
                {updating ? 'Saving Status...' : `Confirm: Mark as ${nextStatus}`}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Proof Photo Upload Modal */}
      {uploadJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 border border-slate-200 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-slate-900 text-sm">Upload Before/After Proof Photo</h3>
              <button onClick={() => setUploadJob(null)}><X className="w-4 h-4 text-slate-400" /></button>
            </div>
            <form onSubmit={handleUploadProof} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Photo Stage</label>
                <select
                  value={uploadType}
                  onChange={(e) => setUploadType(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-xl text-xs"
                >
                  <option value="after_work">After Completion (Proof of Work)</option>
                  <option value="before_work">Before Starting (Initial Condition)</option>
                </select>
              </div>

              <input
                type="file"
                required
                accept="image/*"
                onChange={(e) => setUploadFile(e.target.files[0])}
                className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />

              <button
                type="submit"
                disabled={uploading}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs disabled:opacity-50"
              >
                {uploading ? 'Uploading Photo...' : 'Upload & Attach Photo'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

