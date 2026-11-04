import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';
import {
  Wrench, Bell, User, LogOut, ShieldCheck, ChevronDown, Sparkles,
  Layers, CheckCircle2, RefreshCw, ArrowRight
} from 'lucide-react';
import Logo from './Logo';
import NotificationModal from './NotificationModal';
import AuthModal from './AuthModal';

export default function Navbar() {
  const { user, role, logout, quickLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [authOpen, setAuthOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [profileOpen, setProfileOpen] = useState(false);
  const [roleSwitching, setRoleSwitching] = useState(false);

  useEffect(() => {
    if (user) {
      client.get('/api/notifications')
        .then((res) => setUnreadCount(res.data.unread_count || 0))
        .catch(() => {});
    }
  }, [user, notifOpen]);

  const getDashboardRoute = (targetRole = role) => {
    switch (targetRole) {
      case 'admin':
        return '/admin';
      case 'provider':
        return '/provider';
      case 'technician':
        return '/technician';
      case 'customer':
      default:
        return '/customer';
    }
  };

  const handleQuickSwitch = async (targetRole) => {
    setRoleSwitching(true);
    setProfileOpen(false);
    try {
      const res = await quickLogin(targetRole);
      if (res?.success) {
        navigate(getDashboardRoute(targetRole));
      }
    } catch (err) {
      console.warn(err);
    } finally {
      setRoleSwitching(false);
    }
  };

  const getRoleBadge = () => {
    switch (role) {
      case 'admin':
        return (
          <span className="bg-purple-500/10 border border-purple-500/30 text-purple-300 font-bold px-2.5 py-0.5 rounded-full text-[11px] flex items-center gap-1 shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse"></span>
            Super Admin
          </span>
        );
      case 'provider':
        return (
          <span className="bg-amber-500/10 border border-amber-500/30 text-amber-300 font-bold px-2.5 py-0.5 rounded-full text-[11px] flex items-center gap-1 shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
            Service Partner
          </span>
        );
      case 'technician':
        return (
          <span className="bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-bold px-2.5 py-0.5 rounded-full text-[11px] flex items-center gap-1 shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
            Technician
          </span>
        );
      case 'customer':
      default:
        return (
          <span className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-bold px-2.5 py-0.5 rounded-full text-[11px] flex items-center gap-1 shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            Customer
          </span>
        );
    }
  };

  return (
    <>
      <nav className="sticky top-0 z-40 bg-slate-950/85 backdrop-blur-xl border-b border-white/10 text-white transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center hover:opacity-95 transition-opacity">
            <Logo size="md" showTagline={true} variant="light" />
          </Link>

          {/* Center Navigation Links */}
          <div className="hidden md:flex items-center gap-6 text-xs font-semibold tracking-wide">
            <Link
              to="/services"
              data-tour="explore-nav"
              className={`px-3 py-1.5 rounded-lg transition-all ${
                location.pathname === '/services'
                  ? 'bg-white/10 text-cyan-400 font-bold shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              Explore Services
            </Link>

            {user && (
              <Link
                to={getDashboardRoute()}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  location.pathname === getDashboardRoute()
                    ? 'bg-blue-600/30 border border-blue-500/40 text-blue-300 font-bold'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                <span>My Dashboard</span>
              </Link>
            )}

            {/* Live Operational Status Pill */}
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] text-slate-300 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Render API Live</span>
            </div>
          </div>

          {/* Right User Actions */}
          <div className="flex items-center gap-3">
            {user ? (
              <>
                {/* Active Role Badge */}
                <div className="hidden sm:block">
                  {getRoleBadge()}
                </div>

                {/* Notifications Button */}
                <button
                  onClick={() => setNotifOpen(true)}
                  className="relative p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-all border border-transparent hover:border-white/10"
                  title="Notifications"
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-cyan-400 rounded-full animate-ping"></span>
                  )}
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-cyan-400 rounded-full"></span>
                  )}
                </button>

                {/* User Profile Menu */}
                <div className="relative">
                  <button
                    onClick={() => setProfileOpen(!profileOpen)}
                    className="flex items-center gap-2 py-1.5 px-2.5 rounded-xl border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 transition-all"
                  >
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-600 to-cyan-500 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                      {user.full_name ? user.full_name[0].toUpperCase() : 'U'}
                    </div>
                    <span className="text-xs font-semibold text-slate-200 max-w-[100px] truncate hidden sm:inline">
                      {user.full_name?.split(' ')[0]}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  {/* Dropdown Menu */}
                  {profileOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl p-2 text-xs text-slate-300 animate-in fade-in zoom-in-95 duration-150 z-50">
                      <div className="p-3 border-b border-white/10 bg-white/5 rounded-xl mb-2">
                        <p className="font-bold text-white text-sm truncate">{user.full_name}</p>
                        <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                        <div className="mt-2">{getRoleBadge()}</div>
                      </div>

                      <Link
                        to={getDashboardRoute()}
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white/5 text-slate-200 hover:text-white font-medium transition-colors"
                      >
                        <span>Open Dashboard</span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                      </Link>

                      {/* Fast Role Switcher */}
                      <div className="mt-2 pt-2 border-t border-white/10">
                        <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                          Quick Role Switcher
                        </span>
                        <div className="grid grid-cols-2 gap-1 p-1">
                          {[
                            { id: 'customer', label: 'Customer', name: 'Priya' },
                            { id: 'provider', label: 'Provider', name: 'Sparky' },
                            { id: 'technician', label: 'Technician', name: 'Rahul' },
                            { id: 'admin', label: 'Admin', name: 'Super' },
                          ].map((item) => (
                            <button
                              key={item.id}
                              onClick={() => handleQuickSwitch(item.id)}
                              disabled={roleSwitching || role === item.id}
                              className={`p-2 rounded-lg text-left transition-all ${
                                role === item.id
                                  ? 'bg-blue-600/30 border border-blue-500/40 text-cyan-300 font-bold'
                                  : 'hover:bg-white/5 text-slate-400 hover:text-white'
                              }`}
                            >
                              <p className="text-[11px] font-bold">{item.label}</p>
                              <p className="text-[9px] text-slate-500">({item.name})</p>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="mt-2 pt-2 border-t border-white/10">
                        <button
                          onClick={() => {
                            setProfileOpen(false);
                            logout();
                            navigate('/');
                          }}
                          className="w-full text-left px-3 py-2 rounded-lg hover:bg-red-500/10 text-red-400 hover:text-red-300 font-semibold flex items-center gap-1.5 transition-colors"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setAuthOpen(true)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
                >
                  Sign In
                </button>
                <button
                  onClick={() => setAuthOpen(true)}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-blue-500/25 flex items-center gap-1.5"
                >
                  <span>Get Started</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Modals */}
      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
      <NotificationModal isOpen={notifOpen} onClose={() => setNotifOpen(false)} />
    </>
  );
}
