import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  Search, Shield, Star, CheckCircle2, ArrowRight, Zap, Droplets,
  Wind, Sparkles, Paintbrush, Hammer, Tv, ShieldAlert, Award, Clock
} from 'lucide-react';
import AuthModal from '../components/AuthModal';

const iconMap = {
  Zap: Zap,
  Droplets: Droplets,
  Wind: Wind,
  Sparkles: Sparkles,
  Paintbrush: Paintbrush,
  Hammer: Hammer,
  Tv: Tv,
  ShieldAlert: ShieldAlert,
};

export default function LandingPage() {
  const navigate = useNavigate();
  const { user, quickLogin } = useAuth();
  const [categories, setCategories] = useState([]);
  const [featuredServices, setFeaturedServices] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [authOpen, setAuthOpen] = useState(false);

  useEffect(() => {
    client.get('/api/services/categories')
      .then((res) => setCategories(res.data))
      .catch((err) => console.warn(err));

    client.get('/api/services')
      .then((res) => setFeaturedServices(res.data.slice(0, 6)))
      .catch((err) => console.warn(err));
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/services?q=${encodeURIComponent(searchQuery)}`);
    } else {
      navigate('/services');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* Hero Section */}
      <section data-tour="landing-hero" className="relative overflow-hidden bg-gradient-to-b from-blue-900 via-indigo-900 to-slate-900 text-white py-20 lg:py-28 px-4">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(59,130,246,0.2),transparent_50%)] pointer-events-none"></div>
        <div className="max-w-5xl mx-auto text-center relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-semibold backdrop-blur-md">
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span className="font-extrabold text-white">TOPS &amp; Taps</span>
            <span className="text-blue-300">•</span>
            <span>Your home. Our hustle.</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-tight">
            Top-Tier Home Care. <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-blue-400 via-teal-300 to-indigo-300 bg-clip-text text-transparent">
              Zero Stress. Instant Booking.
            </span>
          </h1>

          <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            Connect with top-rated electricians, plumbers, AC technicians, and cleaners. Fast slot booking, transparent pricing, and secure payments.
          </p>

          {/* Search Bar */}
          <form data-tour="search-bar" onSubmit={handleSearch} className="max-w-2xl mx-auto mt-8 flex flex-col sm:flex-row gap-2 bg-white/10 p-2 rounded-2xl backdrop-blur-md border border-white/20 shadow-2xl">
            <div className="relative flex-1 flex items-center">
              <Search className="w-5 h-5 text-slate-400 ml-3.5" />
              <input
                type="text"
                placeholder="Search 'AC Repair', 'Tap Leak', 'Electrician'..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent px-3 py-3 text-sm text-white placeholder-slate-400 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="py-3 px-6 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2"
            >
              <span>Search Services</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Category Badges */}
          <div className="flex flex-wrap justify-center items-center gap-2 pt-4 text-xs">
            <span className="text-slate-400 font-semibold mr-1">Popular:</span>
            {['Electrical', 'Plumbing', 'AC Servicing', 'Deep Cleaning', 'Pest Control'].map((item) => (
              <button
                key={item}
                onClick={() => navigate(`/services?q=${encodeURIComponent(item)}`)}
                className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded-full text-slate-200 border border-white/10 transition-colors"
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 4 Roles Interactive Showcase Banner */}
      <section data-tour="role-switcher" className="max-w-7xl mx-auto px-4 -mt-8 relative z-20">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-5 md:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-100 flex flex-col justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-blue-600">Role 1</span>
              <h3 className="font-bold text-slate-900 text-sm mt-0.5">Customer Portal</h3>
              <p className="text-xs text-slate-600 mt-1">Book slots, track real-time technician arrival, pay via Razorpay test mode.</p>
            </div>
            <button
              onClick={() => quickLogin('customer').then(() => navigate('/customer'))}
              className="mt-3 text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <span>Test Customer Flow</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-100 flex flex-col justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-amber-700">Role 2</span>
              <h3 className="font-bold text-slate-900 text-sm mt-0.5">Service Provider</h3>
              <p className="text-xs text-slate-600 mt-1">Accept bookings, assign technicians, configure pricing & coverage areas.</p>
            </div>
            <button
              onClick={() => quickLogin('provider').then(() => navigate('/provider'))}
              className="mt-3 text-xs font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1"
            >
              <span>Test Provider Flow</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="p-4 rounded-xl bg-cyan-50/60 border border-cyan-100 flex flex-col justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-cyan-700">Role 3</span>
              <h3 className="font-bold text-slate-900 text-sm mt-0.5">Field Technician</h3>
              <p className="text-xs text-slate-600 mt-1">Mobile job cards, mark arrival, upload completion photos & work remarks.</p>
            </div>
            <button
              onClick={() => quickLogin('technician').then(() => navigate('/technician'))}
              className="mt-3 text-xs font-bold text-cyan-700 hover:text-cyan-800 flex items-center gap-1"
            >
              <span>Test Technician Flow</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="p-4 rounded-xl bg-purple-50/60 border border-purple-100 flex flex-col justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-purple-700">Role 4</span>
              <h3 className="font-bold text-slate-900 text-sm mt-0.5">Super Admin</h3>
              <p className="text-xs text-slate-600 mt-1">Platform revenue, 1-click KYC verification, dispute & coupon manager.</p>
            </div>
            <button
              onClick={() => quickLogin('admin').then(() => navigate('/admin'))}
              className="mt-3 text-xs font-bold text-purple-700 hover:text-purple-800 flex items-center gap-1"
            >
              <span>Test Admin Flow</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* Service Categories Grid */}
      <section data-tour="category-grid" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Browse Home Services
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-2">
            Choose from all 8 core home maintenance and repair categories
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
          {categories.map((cat) => {
            const Icon = iconMap[cat.icon] || Zap;
            return (
              <div
                key={cat.id}
                onClick={() => navigate(`/services?cat=${cat.id}`)}
                className="group bg-white rounded-2xl p-5 border border-slate-200 hover:border-blue-400 hover:shadow-xl transition-all cursor-pointer flex flex-col items-center text-center relative overflow-hidden"
              >
                <div className="w-14 h-14 rounded-2xl bg-blue-50 group-hover:bg-blue-600 text-blue-600 group-hover:text-white flex items-center justify-center transition-colors mb-3">
                  <Icon className="w-7 h-7" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm group-hover:text-blue-600 transition-colors">
                  {cat.name}
                </h3>
                <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                  {cat.description}
                </p>
                <span className="mt-3 text-[10px] font-bold text-blue-600 uppercase tracking-wider flex items-center gap-0.5">
                  <span>View Services</span>
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-slate-100/70 border-y border-slate-200 py-16 px-4">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              How TOPS &amp; Taps Works
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-2">
              Simple 4-step workflow from discovery to completion
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { step: '01', title: 'Select Service', desc: 'Browse transparent pricing and verified provider profiles.' },
              { step: '02', title: 'Pick Slot & Address', desc: 'Select your preferred appointment date and time slot.' },
              { step: '03', title: 'Technician Dispatched', desc: 'Live status tracking from arrival to job completion.' },
              { step: '04', title: 'Pay & Review', desc: 'Pay safely with test gateway simulation and rate service.' },
            ].map((s) => (
              <div key={s.step} className="bg-white p-6 rounded-2xl border border-slate-200 relative shadow-xs">
                <span className="text-2xl font-black text-blue-600/30 block mb-2">{s.step}</span>
                <h3 className="font-bold text-slate-900 text-sm mb-1">{s.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust & Guarantee */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-8 sm:p-12 text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl">
          <div className="space-y-4 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-xs font-bold text-white">
              <Award className="w-4 h-4 text-amber-300" />
              <span>SaaS Quality Assurance</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black leading-tight">
              Ready to experience modern home service booking?
            </h2>
            <p className="text-xs sm:text-sm text-blue-100 leading-relaxed">
              Full-featured role-based system covering Admin governance, Provider dispatching, Technician mobile execution, and Customer booking.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <button
              onClick={() => navigate('/services')}
              className="px-6 py-3.5 bg-white text-blue-700 font-bold text-sm rounded-xl hover:bg-blue-50 transition-all shadow-lg"
            >
              Explore Services Catalog
            </button>
            <button
              onClick={() => setAuthOpen(true)}
              className="px-6 py-3.5 bg-blue-800/60 hover:bg-blue-800 border border-white/20 text-white font-bold text-sm rounded-xl transition-all"
            >
              Switch Role / Sign In
            </button>
          </div>
        </div>
      </section>

      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  );
}

