import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useTour, TOURS } from '../context/TourContext';
import {
  Search, Shield, Star, CheckCircle2, ArrowRight, Zap, Droplets,
  Wind, Sparkles, Paintbrush, Hammer, Tv, ShieldAlert, Award, Clock,
  MapPin, PhoneCall, Check, TrendingUp, Users, ChevronRight, Calculator,
  Lock, RefreshCw, Wrench, ShieldCheck
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

const estimatorServices = [
  { id: 1, name: 'Switchboard Repair & Modular Wiring', base: 299, cat: 'Electrical' },
  { id: 2, name: 'Inverter Split AC Foam Jet Deep Clean', base: 599, cat: 'AC Maintenance' },
  { id: 3, name: 'Kitchen Sink Tap & Drain Unclogging', base: 249, cat: 'Plumbing' },
  { id: 4, name: 'Complete 2BHK Deep Sanitization', base: 1499, cat: 'Cleaning' },
  { id: 5, name: 'Door Lock & Latch Replacement', base: 349, cat: 'Carpentry' },
];

const customerTestimonials = [
  {
    name: 'Pooja Deshmukh',
    city: 'Powai, Mumbai',
    service: 'AC Jet Servicing',
    rating: 5,
    comment: 'Technician arrived in exactly 20 minutes! Cleaned our split AC with proper pressure jet equipment and zero mess. Cashless checkout was super smooth.',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80'
  },
  {
    name: 'Vikram Malhotra',
    city: 'Bandra West, Mumbai',
    service: 'Main Switchboard Repair',
    rating: 5,
    comment: 'Upfront pricing without any annoying bargaining. The GST tax invoice was generated in 2 seconds right after payment. Truly top tier!',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80'
  },
  {
    name: 'Ananya Roy',
    city: 'Hiranandani, Mumbai',
    service: 'Plumbing & Faucet Fix',
    rating: 5,
    comment: 'The 30-day rework warranty gave me complete peace of mind. Background-verified technician with uniform and ID. Highly recommended!',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop&q=80'
  }
];

export default function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { startTour } = useTour();
  const [categories, setCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [authOpen, setAuthOpen] = useState(false);

  // Estimator state
  const [estSelected, setEstSelected] = useState(estimatorServices[0]);
  const [estCouponApplied, setEstCouponApplied] = useState(true);

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

  const estPrice = estCouponApplied ? Math.max(estSelected.base - 50, 99) : estSelected.base;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-cyan-500 selection:text-black overflow-hidden">
      
      {/* ─── Hero Section with Ambient Lights ─── */}
      <section data-tour="landing-hero" className="relative pt-20 pb-20 lg:pt-28 lg:pb-32 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Layered Ambient Radial Glow Mesh */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[750px] h-[550px] bg-gradient-to-tr from-blue-600/20 via-indigo-600/15 to-cyan-400/20 rounded-full blur-[140px] pointer-events-none"></div>
        <div className="absolute top-10 right-10 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-purple-600/10 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center space-y-6 max-w-4xl mx-auto">
            {/* Live Status Pill Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/90 border border-white/10 shadow-xl shadow-black/60 backdrop-blur-2xl">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400"></span>
              </span>
              <span className="text-xs font-black uppercase tracking-[0.2em] text-cyan-400">
                TOPS &amp; Taps • Certified Craftsman Network
              </span>
              <span className="text-slate-600 hidden sm:inline">•</span>
              <button
                type="button"
                onClick={() => startTour(TOURS.FULL_PLATFORM)}
                className="hidden sm:inline-flex items-center gap-1 text-xs font-bold text-amber-300 hover:text-amber-200 transition-colors cursor-pointer"
              >
                <span>✨ Start Interactive Tour ➔</span>
              </button>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.08] text-white">
              Premium Home Care, <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400">
                Delivered on Demand.
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-slate-300 text-sm sm:text-lg max-w-2xl mx-auto leading-relaxed font-normal">
              Book certified electricians, master plumbers, and AC technicians in 60 seconds. Guaranteed arrival windows, transparent fixed rates, and a 30-day rework warranty.
            </p>

            {/* Modern Search Console */}
            <form
              data-tour="search-bar"
              onSubmit={handleSearch}
              className="max-w-2xl mx-auto mt-8 flex flex-col sm:flex-row gap-2 bg-slate-900/90 p-2.5 rounded-2xl border border-white/15 shadow-2xl shadow-black/80 backdrop-blur-2xl hover:border-cyan-500/40 transition-all"
            >
              <div className="relative flex-1 flex items-center">
                <Search className="w-5 h-5 text-cyan-400 ml-3 shrink-0" />
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
                className="py-3.5 px-7 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-black text-sm rounded-xl transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 cursor-pointer group active:scale-[0.98]"
              >
                <span>Find Services</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </form>

            {/* Quick Trending Tags */}
            <div className="flex flex-wrap justify-center items-center gap-2 pt-2 text-xs">
              <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] mr-1">Trending:</span>
              {['AC Foam Jet', 'Ceiling Fan Wiring', 'Drain Cleaning', 'Wall Painting', 'Kitchen Deep Clean'].map((tag) => (
                <button
                  key={tag}
                  onClick={() => navigate(`/services?q=${encodeURIComponent(tag)}`)}
                  className="px-3 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-cyan-400/40 text-slate-300 hover:text-white transition-all text-xs cursor-pointer"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* ─── Floating Live Dispatch Simulation Card ─── */}
          <div className="mt-14 max-w-xl mx-auto p-4 rounded-3xl bg-slate-900/90 border border-white/15 shadow-2xl backdrop-blur-xl animate-float">
            <div className="flex items-center justify-between text-xs pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="font-bold text-emerald-400 uppercase tracking-wider text-[10px]">Live Dispatch Handshake</span>
              </div>
              <span className="text-[11px] text-cyan-300 font-mono">Order #BK-9634A</span>
            </div>
            <div className="pt-3 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white font-black text-base shadow-lg shadow-cyan-500/25">
                  RS
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white leading-tight">Rahul Sharma</h4>
                  <p className="text-xs text-slate-400">Master Electrician • ⭐ 4.98 (240+ jobs)</p>
                </div>
              </div>
              <div className="text-right">
                <span className="inline-block px-3 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
                  Arriving in 12 mins
                </span>
                <span className="block text-[10px] text-slate-400 mt-1 font-mono">OTP: 4921</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Platform Trust Metrics ─── */}
      <section className="border-y border-white/10 bg-slate-900/40 backdrop-blur-md py-12 px-4">
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
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mt-1">Protection Warranty</p>
          </div>
        </div>
      </section>

      {/* ─── Interactive Instant Cost Estimator ─── */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <div className="bg-gradient-to-br from-slate-900/90 via-slate-900/70 to-blue-950/40 rounded-3xl border border-white/10 p-8 sm:p-12 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="max-w-xl space-y-3 mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-bold uppercase tracking-wider">
              <Calculator className="w-3.5 h-3.5" />
              <span>Instant Repair Cost Calculator</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Transparent Pricing. No Surprise Extra Charges.
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Select your required home service to preview exact labor charges before booking.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
            {/* Selector */}
            <div className="lg:col-span-2 space-y-3">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                Select Your Task
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {estimatorServices.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setEstSelected(item)}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                      estSelected.id === item.id
                        ? 'border-cyan-500 bg-cyan-500/10 text-white font-bold ring-1 ring-cyan-500 shadow-lg shadow-cyan-500/10'
                        : 'border-white/10 bg-white/5 hover:bg-white/10 text-slate-300'
                    }`}
                  >
                    <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 block mb-1">
                      {item.cat}
                    </span>
                    <p className="text-xs font-bold leading-tight">{item.name}</p>
                    <span className="text-xs text-slate-400 mt-2 block font-mono">Standard Fee: ₹{item.base}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Calculation Card */}
            <div className="p-6 rounded-3xl bg-slate-950 border border-cyan-500/30 space-y-4 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-white/10 text-xs">
                <span className="text-slate-400 font-medium">Estimated Payable</span>
                <span className="text-emerald-400 font-bold">18% GST Included</span>
              </div>

              <div>
                <span className="text-[11px] text-slate-400 block">Final Price with Warranty</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-4xl font-black text-white">₹{(estPrice * 1.18).toFixed(0)}</span>
                  <span className="text-sm text-slate-500 line-through">₹{(estSelected.base * 1.18).toFixed(0)}</span>
                </div>
              </div>

              {/* Coupon Toggle */}
              <div
                onClick={() => setEstCouponApplied(!estCouponApplied)}
                className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between cursor-pointer hover:border-cyan-400/40 transition-colors"
              >
                <div className="flex items-center gap-2 text-xs">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <div>
                    <p className="font-bold text-white text-[11px]">Promo Code: WELCOME50</p>
                    <p className="text-[10px] text-emerald-400">₹50 Flat Discount Applied</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={estCouponApplied}
                  readOnly
                  className="rounded text-cyan-500 focus:ring-0"
                />
              </div>

              <button
                onClick={() => navigate('/services')}
                className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold rounded-2xl text-xs transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Book This Service Now</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Service Categories Grid ─── */}
      <section data-tour="category-grid" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs font-black uppercase tracking-[0.25em] text-cyan-400">Complete Home Services</span>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight mt-1">
            Browse Core Service Domains
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-2">
            Every service backed by verified regional providers, standardized equipment, and upfront rate cards.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
          {categories.map((cat) => {
            const Icon = iconMap[cat.icon] || Zap;
            return (
              <div
                key={cat.id}
                onClick={() => navigate(`/services?cat=${cat.id}`)}
                className="group relative rounded-3xl bg-slate-900/80 backdrop-blur-md border border-white/10 p-6 hover:border-cyan-500/50 hover:bg-slate-900 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-cyan-500/10 cursor-pointer flex flex-col justify-between overflow-hidden"
              >
                {/* Glow backlight on hover */}
                <div className="absolute -right-8 -top-8 w-24 h-24 bg-blue-600/10 rounded-full blur-2xl group-hover:bg-cyan-500/20 transition-all"></div>

                <div>
                  <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 group-hover:text-white group-hover:bg-cyan-600 flex items-center justify-center transition-all duration-300 mb-4 shadow-md">
                    <Icon className="w-6 h-6 transform group-hover:scale-110 transition-transform" />
                  </div>
                  <h3 className="font-bold text-white text-base group-hover:text-cyan-300 transition-colors">
                    {cat.name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
                    {cat.description}
                  </p>
                </div>

                <div className="pt-5 flex items-center justify-between text-xs font-bold text-cyan-400 group-hover:text-cyan-300 transition-colors">
                  <span>Explore Catalog</span>
                  <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ─── How it Works (4-Step Visual Stepper) ─── */}
      <section className="border-y border-white/10 bg-slate-900/40 backdrop-blur-md py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-black uppercase tracking-[0.25em] text-cyan-400">Streamlined Workflow</span>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight mt-1">
              How TOPS &amp; Taps Works
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-2">
              From discovering the problem to verified technician arrival in 4 simple steps.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { step: '01', title: 'Select Service', desc: 'Browse verified rate cards and pick the exact repair task needed.', icon: Search },
              { step: '02', title: 'Pick Slot & Partner', desc: 'Choose a convenient 2-hour arrival window and input your location.', icon: Clock },
              { step: '03', title: 'Live Field Dispatch', desc: 'Verified technician arrives with tools, uniform, and photo ID verification.', icon: Wrench },
              { step: '04', title: 'Pay Cashless & Relax', desc: 'Secure settlement via Razorpay with instant GST invoice and 30-day warranty.', icon: ShieldCheck },
            ].map((s, idx) => {
              const StepIcon = s.icon;
              return (
                <div
                  key={idx}
                  className="p-6 rounded-3xl bg-slate-900/80 border border-white/10 space-y-3 relative group hover:border-cyan-500/40 transition-colors"
                >
                  <span className="text-3xl font-black text-white/15 font-mono block">
                    {s.step}
                  </span>
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
                    <StepIcon className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-white">{s.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{s.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── Verified Customer Testimonials ─── */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs font-black uppercase tracking-[0.25em] text-cyan-400">Customer Proof</span>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight mt-1">
            Real Reviews from Real Homeowners
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-2">
            Over 50,000 households across Mumbai trust our certified craftsmen network.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {customerTestimonials.map((t, idx) => (
            <div
              key={idx}
              className="p-6 rounded-3xl bg-slate-900/80 border border-white/10 space-y-4 shadow-xl flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center gap-1 text-amber-400">
                  {[...Array(t.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400" />
                  ))}
                </div>
                <p className="text-xs text-slate-300 leading-relaxed italic">
                  "{t.comment}"
                </p>
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-white/10">
                <img
                  src={t.avatar}
                  alt={t.name}
                  className="w-10 h-10 rounded-full object-cover border border-cyan-500/30"
                />
                <div>
                  <h4 className="text-xs font-bold text-white">{t.name}</h4>
                  <p className="text-[10px] text-slate-400">{t.city} • <span className="text-cyan-400">{t.service}</span></p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── High-Impact Seamless CTA Banner (Zero White Gaps!) ─── */}
      <section className="max-w-6xl mx-auto px-4 pb-20">
        <div className="relative rounded-3xl p-8 sm:p-14 bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-950 border border-cyan-500/30 shadow-2xl overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-4 max-w-xl z-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-xs font-bold text-cyan-300 backdrop-blur-md">
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>₹100 Off Your First Booking with code TOPSTAPS100</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-black leading-tight text-white tracking-tight">
              Book a Certified Craftsman in 60 Seconds.
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Experience the future of home repairs with instant slot confirmations and seamless cashless Razorpay checkout.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto z-10">
            <button
              onClick={() => navigate('/services')}
              className="px-7 py-4 bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-black text-sm rounded-2xl transition-all shadow-xl shadow-cyan-500/25 cursor-pointer active:scale-[0.98]"
            >
              Explore Services Catalog
            </button>
            {!user && (
              <button
                onClick={() => setAuthOpen(true)}
                className="px-7 py-4 bg-white/5 hover:bg-white/10 border border-white/20 text-white font-bold text-sm rounded-2xl transition-all cursor-pointer active:scale-[0.98]"
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
