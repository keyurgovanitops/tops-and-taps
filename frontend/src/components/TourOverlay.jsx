import React, { useState, useEffect, useRef } from 'react';
import { useTour, TOURS } from '../context/TourContext';
import {
  HelpCircle, X, ArrowRight, ArrowLeft, Sparkles, Compass,
  CheckCircle2, Play, Users, Briefcase, Wrench, Shield, GripHorizontal,
  ChevronRight
} from 'lucide-react';
import Logo from './Logo';

export default function TourOverlay() {
  const {
    isOpen,
    currentStep,
    currentStepIndex,
    totalSteps,
    nextStep,
    prevStep,
    endTour,
    startTour,
  } = useTour();

  const [menuOpen, setMenuOpen] = useState(false);
  const [targetRect, setTargetRect] = useState(null);
  const pollRef = useRef(null);

  // Draggable Card State
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ mouseX: 0, mouseY: 0, initialOffsetX: 0, initialOffsetY: 0 });

  // Reset drag offset when step changes
  useEffect(() => {
    setDragOffset({ x: 0, y: 0 });
  }, [currentStepIndex, isOpen]);

  // Locate and measure target element
  useEffect(() => {
    if (!isOpen || !currentStep) {
      setTargetRect(null);
      return;
    }

    const findTarget = () => {
      const el = document.querySelector(currentStep.target);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const rect = el.getBoundingClientRect();
        setTargetRect({
          top: rect.top - 8,
          left: rect.left - 8,
          width: rect.width + 16,
          height: rect.height + 16,
        });
      } else {
        setTargetRect(null);
      }
    };

    findTarget();
    pollRef.current = setInterval(findTarget, 250);

    const handleUpdate = () => findTarget();
    window.addEventListener('resize', handleUpdate);
    window.addEventListener('scroll', handleUpdate);

    return () => {
      clearInterval(pollRef.current);
      window.removeEventListener('resize', handleUpdate);
      window.removeEventListener('scroll', handleUpdate);
    };
  }, [isOpen, currentStep]);

  // Mouse & Touch Drag Handlers
  const handleMouseDown = (e) => {
    if (e.target.closest('button') || e.target.closest('a')) return;
    setIsDragging(true);
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      initialOffsetX: dragOffset.x,
      initialOffsetY: dragOffset.y,
    };
  };

  const handleTouchStart = (e) => {
    if (e.target.closest('button') || e.target.closest('a')) return;
    const touch = e.touches[0];
    setIsDragging(true);
    dragStartRef.current = {
      mouseX: touch.clientX,
      mouseY: touch.clientY,
      initialOffsetX: dragOffset.x,
      initialOffsetY: dragOffset.y,
    };
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;
      const dx = e.clientX - dragStartRef.current.mouseX;
      const dy = e.clientY - dragStartRef.current.mouseY;
      setDragOffset({
        x: dragStartRef.current.initialOffsetX + dx,
        y: dragStartRef.current.initialOffsetY + dy,
      });
    };

    const handleTouchMove = (e) => {
      if (!isDragging) return;
      const touch = e.touches[0];
      const dx = touch.clientX - dragStartRef.current.mouseX;
      const dy = touch.clientY - dragStartRef.current.mouseY;
      setDragOffset({
        x: dragStartRef.current.initialOffsetX + dx,
        y: dragStartRef.current.initialOffsetY + dy,
      });
    };

    const handleEnd = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleEnd);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleEnd);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging]);

  return (
    <>
      {/* Floating Tour Guide Launcher Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="group flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-slate-900/95 hover:bg-slate-900 border border-cyan-500/40 hover:border-cyan-400 text-white shadow-2xl shadow-cyan-500/20 backdrop-blur-xl transition-all hover:scale-105 active:scale-95 cursor-pointer"
            title="Interactive Platform Demo Tour"
          >
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-400"></span>
            </span>
            <Compass className="w-4 h-4 text-cyan-400 group-hover:rotate-45 transition-transform" />
            <span className="text-xs font-black tracking-wide">Interactive Guide</span>
          </button>

          {/* Tour Selection Menu */}
          {menuOpen && (
            <div className="absolute bottom-16 right-0 w-80 sm:w-96 bg-slate-900 border border-white/15 rounded-3xl shadow-2xl p-5 text-xs text-slate-300 animate-in fade-in zoom-in-95 duration-200 z-50">
              <div className="flex items-start justify-between pb-3 border-b border-white/10">
                <div>
                  <h3 className="font-black text-white text-sm flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    <span>Explore TOPS &amp; Taps</span>
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Take an automated guided walkthrough of all 4 roles and workflows.
                  </p>
                </div>
                <button
                  onClick={() => setMenuOpen(false)}
                  className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="mt-4 space-y-2">
                {/* 1. Full Platform Master Tour */}
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    startTour(TOURS.FULL_PLATFORM);
                  }}
                  className="w-full p-3 rounded-2xl bg-gradient-to-r from-blue-600/30 to-cyan-600/20 hover:from-blue-600/40 hover:to-cyan-600/30 border border-cyan-500/40 text-left flex items-center justify-between transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-bold">
                      <Play className="w-4 h-4 fill-cyan-400" />
                    </div>
                    <div>
                      <p className="font-bold text-white text-xs group-hover:text-cyan-300 transition-colors">
                        Full Platform Walkthrough (Recommended)
                      </p>
                      <p className="text-[10px] text-slate-400">Customer ➔ Provider ➔ Technician ➔ Super Admin</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-cyan-400 group-hover:translate-x-0.5 transition-transform" />
                </button>

                <div className="pt-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-2 px-1">
                    Role-Specific Quick Flows
                  </span>
                  <div className="space-y-1.5">
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        startTour(TOURS.CUSTOMER_FLOW);
                      }}
                      className="w-full p-2.5 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 text-left flex items-center justify-between transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-emerald-400" />
                        <div>
                          <p className="font-bold text-white text-xs">Customer Journey</p>
                          <p className="text-[10px] text-slate-400">Catalog ➔ Slot Booking ➔ Razorpay ➔ Invoices</p>
                        </div>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                    </button>

                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        startTour(TOURS.PROVIDER_FLOW);
                      }}
                      className="w-full p-2.5 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 text-left flex items-center justify-between transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-amber-400" />
                        <div>
                          <p className="font-bold text-white text-xs">Service Provider Journey</p>
                          <p className="text-[10px] text-slate-400">Incoming Orders ➔ Tech Dispatch ➔ 15% Cut</p>
                        </div>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                    </button>

                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        startTour(TOURS.TECH_FLOW);
                      }}
                      className="w-full p-2.5 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 text-left flex items-center justify-between transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Wrench className="w-4 h-4 text-cyan-400" />
                        <div>
                          <p className="font-bold text-white text-xs">Technician Mobile Journey</p>
                          <p className="text-[10px] text-slate-400">Job Cards ➔ En Route ➔ Photo Proof Upload</p>
                        </div>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                    </button>

                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        startTour(TOURS.ADMIN_FLOW);
                      }}
                      className="w-full p-2.5 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 text-left flex items-center justify-between transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-purple-400" />
                        <div>
                          <p className="font-bold text-white text-xs">Super Admin Governance</p>
                          <p className="text-[10px] text-slate-400">Gross GMV ➔ KYC Approvals ➔ Dispute Mediation</p>
                        </div>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Active Guided Tour Spotlight Overlay */}
      {isOpen && currentStep && (
        <div className="fixed inset-0 z-[100] pointer-events-none select-none">
          {/* Spotlight Highlight Box (darkens rest of the page) */}
          {targetRect ? (
            <div
              style={{
                position: 'fixed',
                top: `${targetRect.top}px`,
                left: `${targetRect.left}px`,
                width: `${targetRect.width}px`,
                height: `${targetRect.height}px`,
                boxShadow: '0 0 0 9999px rgba(3, 7, 18, 0.75)',
                borderRadius: '1.25rem',
              }}
              className="pointer-events-auto transition-all duration-300 ring-4 ring-cyan-400 ring-offset-2 ring-offset-slate-950 animate-pulse"
            ></div>
          ) : (
            <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs transition-opacity duration-300 pointer-events-auto"></div>
          )}

          {/* Draggable Tooltip Instruction Card */}
          <div
            style={{
              transform: `translate(calc(-50% + ${dragOffset.x}px), calc(-50% + ${dragOffset.y}px))`,
            }}
            className={`fixed top-1/2 left-1/2 max-w-lg w-[92vw] sm:w-[480px] bg-slate-900/95 backdrop-blur-2xl rounded-3xl shadow-2xl border border-cyan-500/40 p-6 sm:p-7 z-20 pointer-events-auto animate-in fade-in zoom-in-95 duration-200 text-white ${
              isDragging ? 'shadow-cyan-500/30 scale-[1.01] cursor-grabbing ring-2 ring-cyan-400' : ''
            }`}
          >
            {/* Draggable Handle Header */}
            <div
              onMouseDown={handleMouseDown}
              onTouchStart={handleTouchStart}
              className="cursor-move select-none -mt-2 -mx-2 pb-3 mb-2 border-b border-white/10 flex flex-col gap-2"
            >
              <div className="flex items-center justify-center">
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950 text-cyan-300 text-[10px] font-bold tracking-wider shadow-md border border-cyan-500/30 cursor-move">
                  <GripHorizontal className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>DRAG TO MOVE</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-cyan-400 font-extrabold text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-cyan-300" />
                  <span>Step {currentStepIndex + 1} of {totalSteps}</span>
                </span>
                <button
                  onClick={endTour}
                  className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
                  title="Close Guide"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Progress track */}
              <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden mt-1">
                <div
                  className="bg-gradient-to-r from-blue-500 to-cyan-400 h-full rounded-full transition-all duration-300 shadow-sm shadow-cyan-400/50"
                  style={{ width: `${((currentStepIndex + 1) / totalSteps) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Instruction Content */}
            <div className="py-3 space-y-2">
              <h3 className="text-xl font-black text-white tracking-tight leading-snug">
                {currentStep.title}
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed font-normal">
                {currentStep.content}
              </p>
            </div>

            {/* Navigation & Action Controls */}
            <div className="flex items-center justify-between pt-4 border-t border-white/10 mt-2">
              <button
                onClick={prevStep}
                disabled={currentStepIndex === 0}
                className="py-2.5 px-3.5 text-xs sm:text-sm font-bold text-slate-400 hover:text-white disabled:opacity-30 flex items-center gap-1.5 rounded-xl hover:bg-white/5 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>

              <div className="flex items-center gap-2.5">
                <button
                  onClick={endTour}
                  className="py-2.5 px-3 text-xs sm:text-sm font-semibold text-slate-400 hover:text-white cursor-pointer"
                >
                  Skip
                </button>
                <button
                  onClick={nextStep}
                  className="py-3 px-6 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-2xl text-xs sm:text-sm font-black shadow-lg shadow-blue-500/25 flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
                >
                  <span>{currentStep.actionText || (currentStepIndex === totalSteps - 1 ? 'Finish Tour 🎉' : 'Next Step')}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
