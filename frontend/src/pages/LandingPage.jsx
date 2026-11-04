import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  Search, Shield, Star, CheckCircle2, ArrowRight, Zap, Droplets,
  Wind, Sparkles, Paintbrush, Hammer, Tv, ShieldAlert, Award, Clock,
  MapPin, PhoneCall, Check, TrendingUp, Users, ChevronRight
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
  const { user } = useAuth();
  const [categories, setCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [authOpen, setAuthOpen] = useState(false);

  useEffect(() => {
    client.get('/api/services/categories')
      .then((res) => setCategories(res.data))
      .catch((err) => console.warn('Could not load categories:', err));
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
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-blue-600 selection:text-white overflow-hidden">
      
      {/* ─── Hero Section with Ambient Lights ─── */}
      <section data-tour="landing-hero" className="relative pt-24 pb-20 lg:pt-32 lg:pb-32 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Ambient Radial Spotlight Mesh */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-gradient-to-tr from-blue-600/25 via-indigo-600/20 to-cyan-400/20 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute top-10 right-10 w-96 h-96 bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center space-y-6 max-w-4xl mx-auto">
            {/* Status Pill Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/90 border border-slate-700/60 shadow-lg shadow-black/40 backdrop-blur-xl">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
              </span>
              <span className="text-xs font-black uppercase tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-300">
                Next-Gen Home Services Platform
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-xs font-semibold text-slate-400">Live in 50+ Cities</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.08] text-white">
              Your Home Repairs, <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-400">
                Elevated to Perfection.
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-slate-300 text-sm sm:text-lg max-w-2xl mx-auto leading-relaxed font-normal">
              On-demand electrical, plumbing, AC maintenance, and home care. Upfront fixed pricing, guaranteed arrival slots, and background-verified technicians.
            </p>

            {/* Modern Search Console */}
            <form
              data-tour="search-bar"
              onSubmit={handleSearch}
              className="max-w-2xl mx-auto mt-8 flex flex-col sm:flex-row gap-2 bg-slate-900/80 p-2.5 rounded-2xl border border-slate-800 shadow-2xl shadow-black/80 backdrop-blur-xl hover:border-slate-700 transition-colors"
            >
              <div className="relative flex-1 flex items-center">
                <Search className="w-5 h-5 text-slate-400 ml-3 shrink-0" />
                <input
                  type="text"
                  placeholder="Search 'Inverter AC', 'Switchboard', 'Tap Leak', 'Deep Cleaning'..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent px-3.5 py-3 text-sm text-white placeholder-slate-500 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="py-3.5 px-7 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 group active:scale-[0.98]"
              >
                <span>Find Services</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </form>

            {/* Quick Trending Tags */}
            <div className="flex flex-wrap justify-center items-center gap-2 pt-2 text-xs">
              <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px] mr-1">Trending:</span>
              {['AC Servicing', 'Ceiling Fan Wiring', 'Drain Cleaning', 'Wall Painting', 'Kitchen Deep Clean'].map((tag) => (
                <button
                  key={tag}
                  onClick={() => navigate(`/services?q=${encodeURIComponent(tag)}`)}
                  className="px-3 py-1 rounded-full bg-slate-900/80 hover:bg-slate-800 border border-slate-800/80 hover:border-slate-700 text-slate-300 transition-all text-xs"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* ─── Floating Live Dispatch Simulation Card ─── */}
          <div className="mt-14 max-w-xl mx-auto p-4 rounded-2xl bg-gradient-to-r from-slate-900/90 via-slate-900 to-indigo-950/70 border border-slate-800 shadow-2xl backdrop-blur-xl animate-float">
            <div className="flex items-center justify-between text-xs pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="font-bold text-emerald-400 uppercase tracking-wider text-[10px]">Live Service Dispatch</span>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">Job #BK-789021</span>
            </div>
            <div className="pt-3 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-blue-600/30">
                  RS
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white leading-tight">Rahul Sharma</h4>
                  <p className="text-xs text-slate-400">Master Electrician • ⭐ 4.98 (240+ jobs)</p>
                </div>
              </div>
              <div className="text-right">
                <span className="inline-block px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
                  Arriving in 8 mins
                </span>
                <span className="block text-[10px] text-slate-500 mt-1 font-mono">OTP: 4921</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Platform Trust Metrics ─── */}
      <section className="border-y border-slate-800/80 bg-slate-900/50 backdrop-blur-md py-10 px-4">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div>
            <span className="text-3xl sm:text-4xl font-black text-white tracking-tight">50,000+</span>
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mt-1">Homes Serviced</p>
          </div>
          <div>
            <span className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400 tracking-tight">4.92 ★</span>
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mt-1">Average Craft Rating</p>
          </div>
          <div>
            <span className="text-3xl sm:text-4xl font-black text-cyan-400 tracking-tight">&lt; 45 Mins</span>
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mt-1">Guaranteed Dispatch</p>
          </div>
          <div>
            <span className="text-3xl sm:text-4xl font-black text-emerald-400 tracking-tight">₹50,000</span>
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mt-1">Damage Protection Cover</p>
          </div>
        </div>
      </section>

      {/* ─── Service Categories Grid ─── */}
      <section data-tour="category-grid" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs font-black uppercase tracking-[0.25em] text-cyan-400">Complete Home Services</span>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight mt-1">
            Browse Core Service Domains
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-2">
            Every service backed by verified regional providers and upfront rate cards.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
          {categories.map((cat) => {
            const Icon = iconMap[cat.icon] || Zap;
            return (
              <div
                key={cat.id}
                onClick={() => navigate(`/services?cat=${cat.id}`)}
                className="group relative rounded-2xl bg-slate-900/70 border border-slate-800 p-6 hover:border-blue-500/50 hover:bg-slate-900 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-blue-600/10 cursor-pointer flex flex-col justify-between overflow-hidden"
              >
                {/* Glow backlight on hover */}
                <div className="absolute -right-8 -top-8 w-24 h-24 bg-blue-600/10 rounded-full blur-2xl group-hover:bg-blue-600/20 transition-all"></div>

                <div>
                  <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-blue-600/20 via-slate-800 to-indigo-950/40 border border-blue-500/20 text-cyan-400 group-hover:text-white group-hover:bg-blue-600 flex items-center justify-center transition-all duration-300 mb-4 shadow-md">
                    <Icon className="w-6 h-6 transform group-hover:scale-110 transition-transform" />
                  </div>
                  <h3 className="font-bold text-white text-base group-hover:text-cyan-400 transition-colors">
                    {cat.name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
                    {cat.description}
                  </p>
                </div>

                <div className="pt-5 flex items-center justify-between text-xs font-bold text-blue-400 group-hover:text-cyan-300 transition-colors">
                  <span>Explore Catalog</span>
                  <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ─── The TOPS & Taps Guarantee (3 Pillars) ─── */}
      <section className="bg-slate-900/60 border-y border-slate-800 py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-black uppercase tracking-[0.25em] text-blue-400">Peace of Mind</span>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight mt-1">
              The TOPS &amp; Taps Standard
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-2">
              Why thousands of homeowners trust us over chaotic unverified local contractors.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-7 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <Shield className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">Upfront Fixed Pricing</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                No awkward bargaining at your doorstep. Standardized transparent rate cards with instant coupons and itemized GST receipts.
              </p>
            </div>

            <div className="p-7 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                <Award className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">30-Day Free Rework Warranty</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                If something isn't right after the service, our quality guarantee covers a free re-inspection and rework with zero pushback.
              </p>
            </div>

            <div className="p-7 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">Guaranteed Slot Arrival</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Book guaranteed 2-hour arrival windows. Real-time technician assignment with live contact details and automated status updates.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── High-Impact CTA Banner ─── */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <div className="relative rounded-3xl p-8 sm:p-14 bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 border border-white/10 shadow-2xl overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-4 max-w-xl z-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-xs font-bold text-white backdrop-blur-md">
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>₹100 Off Your First Booking with code TOPSTAPS100</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-black leading-tight text-white tracking-tight">
              Book a Certified Craftsman in 60 Seconds.
            </h2>
            <p className="text-xs sm:text-sm text-blue-100 leading-relaxed">
              Experience the future of home repairs with instant slot confirmations and seamless cashless checkout.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto z-10">
            <button
              onClick={() => navigate('/services')}
              className="px-7 py-4 bg-white hover:bg-slate-100 text-slate-950 font-black text-sm rounded-xl transition-all shadow-xl shadow-black/30 active:scale-[0.98]"
            >
              Explore Services Catalog
            </button>
            {!user && (
              <button
                onClick={() => setAuthOpen(true)}
                className="px-7 py-4 bg-slate-950/60 hover:bg-slate-950 border border-white/20 text-white font-black text-sm rounded-xl transition-all active:scale-[0.98]"
              >
                Sign In to Account
              </button>
            )}
          </div>
        </div>
      </section>

      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  );
}
