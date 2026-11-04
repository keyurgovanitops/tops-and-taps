import React from 'react';
import { Wrench, ShieldCheck, Heart, Award, Clock, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import Logo from './Logo';

export default function Footer() {
  return (
    <footer className="bg-slate-950 text-slate-400 text-xs border-t border-white/10 pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-white/10">
          {/* Brand & Mission */}
          <div className="space-y-4">
            <Logo size="md" showTagline={true} variant="light" />
            <p className="text-slate-400 text-xs leading-relaxed pt-1">
              "Your home. Our hustle." <br />
              India's premier on-demand craftsmen network connecting certified electricians, master plumbers, and AC technicians with verified upfront pricing.
            </p>
            <div className="flex items-center gap-2 text-[11px] text-cyan-400 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>100% Platform Uptime Guaranteed</span>
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-4 text-cyan-400">
              Core Services
            </h4>
            <ul className="space-y-2.5 text-slate-400">
              <li>
                <Link to="/services" className="hover:text-cyan-300 transition-colors flex items-center gap-1">
                  <span>Electrical Installations</span>
                  <ArrowUpRight className="w-3 h-3 text-slate-600" />
                </Link>
              </li>
              <li>
                <Link to="/services" className="hover:text-cyan-300 transition-colors flex items-center gap-1">
                  <span>Plumbing & Leak Repairs</span>
                  <ArrowUpRight className="w-3 h-3 text-slate-600" />
                </Link>
              </li>
              <li>
                <Link to="/services" className="hover:text-cyan-300 transition-colors flex items-center gap-1">
                  <span>Inverter AC Deep Jet Clean</span>
                  <ArrowUpRight className="w-3 h-3 text-slate-600" />
                </Link>
              </li>
              <li>
                <Link to="/services" className="hover:text-cyan-300 transition-colors flex items-center gap-1">
                  <span>Home Sanitization & Cleaning</span>
                  <ArrowUpRight className="w-3 h-3 text-slate-600" />
                </Link>
              </li>
              <li>
                <Link to="/services" className="hover:text-cyan-300 transition-colors flex items-center gap-1">
                  <span>Carpentry & Furniture Fixes</span>
                  <ArrowUpRight className="w-3 h-3 text-slate-600" />
                </Link>
              </li>
            </ul>
          </div>

          {/* SaaS User Portals */}
          <div>
            <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-4 text-cyan-400">
              SaaS Ecosystem
            </h4>
            <ul className="space-y-2.5 text-slate-400">
              <li>
                <Link to="/customer" className="hover:text-cyan-300 transition-colors">
                  Customer Self-Service Portal
                </Link>
              </li>
              <li>
                <Link to="/provider" className="hover:text-cyan-300 transition-colors">
                  Service Partner Dispatch Console
                </Link>
              </li>
              <li>
                <Link to="/technician" className="hover:text-cyan-300 transition-colors">
                  Field Technician Mobile App
                </Link>
              </li>
              <li>
                <Link to="/admin" className="hover:text-cyan-300 transition-colors">
                  Super Admin Central Governance
                </Link>
              </li>
              <li>
                <span className="text-slate-500 font-mono text-[11px]">
                  Razorpay Sandbox Enabled (INR)
                </span>
              </li>
            </ul>
          </div>

          {/* Service Guarantee */}
          <div>
            <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-4 text-cyan-400">
              Platform Standards
            </h4>
            <div className="space-y-3">
              <div className="flex items-start gap-2.5 text-slate-300">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-white block">Police-Verified Pros</span>
                  <span className="text-[11px] text-slate-400">100% government ID &amp; KYC audited.</span>
                </div>
              </div>
              <div className="flex items-start gap-2.5 text-slate-300">
                <Clock className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-white block">Strict 2-Hour Arrival</span>
                  <span className="text-[11px] text-slate-400">Live technician tracking &amp; OTP verification.</span>
                </div>
              </div>
              <div className="flex items-start gap-2.5 text-slate-300">
                <Award className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-white block">30-Day Free Rework</span>
                  <span className="text-[11px] text-slate-400">Zero-hassle warranty on all labor.</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500 text-[11px]">
          <p>© 2026 TOPS &amp; Taps Technologies Pvt. Ltd. All rights reserved.</p>
          <p className="flex items-center gap-1.5 font-mono">
            <span>FastAPI</span> • <span>React 19</span> • <span>Tailwind v4</span> • <span>MySQL</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
