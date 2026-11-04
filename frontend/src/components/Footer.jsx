import React from 'react';
import { Wrench, ShieldCheck, Heart, Award, Clock } from 'lucide-react';
import Logo from './Logo';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 text-xs border-t border-slate-800 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <div className="space-y-3">
            <Logo size="lg" showTagline={true} variant="light" />
            <p className="text-slate-400 text-xs leading-relaxed pt-1">
              Modern startup-style platform connecting certified electricians, plumbers, and technicians with households across the city.
            </p>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-3">Popular Services</h4>
            <ul className="space-y-2 text-slate-400">
              <li>Electrical Wiring & Fixtures</li>
              <li>Plumbing & Drain Unclogging</li>
              <li>AC Foam Jet Servicing</li>
              <li>Deep Home Sanitization</li>
              <li>Termite & Pest Control</li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-3">SaaS User Portals</h4>
            <ul className="space-y-2 text-slate-400">
              <li>Super Admin Oversight</li>
              <li>Customer Self-Service</li>
              <li>Service Provider Dispatch</li>
              <li>Field Technician App</li>
              <li>Razorpay Test Sandbox</li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-3">Service Guarantee</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-slate-300">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>100% Background-Verified Pros</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <Clock className="w-4 h-4 text-blue-400" />
                <span>On-Time Arrival Guarantee</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <Award className="w-4 h-4 text-amber-400" />
                <span>30-Day Service Warranty</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500">
          <p>© 2026 TOPS &amp; Taps Technologies Pvt. Ltd. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Built with ⚡ Python FastAPI, React, and MySQL for Vibe Coding Capstone
          </p>
        </div>
      </div>
    </footer>
  );
}

