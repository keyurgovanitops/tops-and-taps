import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';
import {
  Wrench, Bell, User, LogOut, ShieldCheck, ChevronDown, Sparkles
} from 'lucide-react';
import Logo from './Logo';
import NotificationModal from './NotificationModal';
import AuthModal from './AuthModal';

export default function Navbar() {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  const [authOpen, setAuthOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    if (user) {
      client.get('/api/notifications')
        .then((res) => setUnreadCount(res.data.unread_count || 0))
        .catch(() => {});
    }
  }, [user, notifOpen]);

  const getDashboardRoute = () => {
    switch (role) {
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

  const getRoleBadge = () => {
    switch (role) {
      case 'admin':
        return <span className="bg-purple-100 text-purple-700 font-bold px-2 py-0.5 rounded text-[11px]">Super Admin</span>;
      case 'provider':
        return <span className="bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded text-[11px]">Service Provider</span>;
      case 'technician':
        return <span className="bg-cyan-100 text-cyan-800 font-bold px-2 py-0.5 rounded text-[11px]">Technician</span>;
      case 'customer':
        return <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded text-[11px]">Customer</span>;
      default:
        return null;
    }
  };

  return (
    <>
      <nav className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand */}
          <Link to="/" className="flex items-center">
            <Logo size="md" showTagline={true} variant="dark" />
          </Link>

          {/* Center Links */}
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <Link to="/services" data-tour="explore-nav" className="hover:text-blue-600 transition-colors">
              Explore Services
            </Link>
            {user && (
              <Link to={getDashboardRoute()} className="hover:text-blue-600 transition-colors flex items-center gap-1.5 font-semibold text-slate-800">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span>My Dashboard</span>
              </Link>
            )}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            {user ? (
              <>
                {/* Role badge */}
                <div className="hidden sm:block">
                  {getRoleBadge()}
                </div>

                {/* Notifications Button */}
                <button
                  onClick={() => setNotifOpen(true)}
                  className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all"
                  title="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-600 rounded-full animate-ping"></span>
                  )}
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-600 rounded-full"></span>
                  )}
                </button>

                {/* User menu button */}
                <div className="relative">
                  <button
                    onClick={() => setProfileOpen(!profileOpen)}
                    className="flex items-center gap-2 py-1.5 px-2.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50 transition-all"
                  >
                    <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                      {user.full_name ? user.full_name[0].toUpperCase() : 'U'}
                    </div>
                    <span className="text-xs font-semibold text-slate-800 max-w-[100px] truncate hidden sm:inline">
                      {user.full_name}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  {/* Dropdown Menu */}
                  {profileOpen && (
                    <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 text-xs text-slate-700 animate-in fade-in zoom-in-95 duration-150 z-50">
                      <div className="px-3 py-2 border-b border-slate-100">
                        <p className="font-bold text-slate-900 truncate">{user.full_name}</p>
                        <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                      </div>
                      <Link
                        to={getDashboardRoute()}
                        onClick={() => setProfileOpen(false)}
                        className="block px-3 py-2 hover:bg-slate-50 font-medium"
                      >
                        Go to Dashboard
                      </Link>
                      <button
                        onClick={() => {
                          setProfileOpen(false);
                          logout();
                          navigate('/');
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-red-50 text-red-600 font-semibold flex items-center gap-1.5"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setAuthOpen(true)}
                  className="px-4 py-2 text-xs font-bold text-slate-700 hover:text-slate-900 transition-colors"
                >
                  Sign In
                </button>
                <button
                  onClick={() => setAuthOpen(true)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-blue-500/20"
                >
                  Get Started
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

