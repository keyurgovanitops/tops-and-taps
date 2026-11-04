import React, { useState, useEffect, useRef } from 'react';
import { useTour, TOURS } from '../context/TourContext';
import {
  HelpCircle, X, ArrowRight, ArrowLeft, Sparkles, Compass,
  CheckCircle2, Play, Users, Briefcase, Wrench, Shield, GripHorizontal
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

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging]);

  return (
    <>
      {/* Persistent Floating Question Mark Launcher */}
      <div className="fixed bottom-6 right-6 z-50">
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="w-13 h-13 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-2xl shadow-blue-600/50 flex items-center justify-center transition-all hover:scale-105 active:scale-95 group border-2 border-white/80"
            title="Interactive Platform Guide"
          >
            <HelpCircle className="w-7 h-7 group-hover:rotate-12 transition-transform" />
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-white"></span>
            </span>
          </button>

          {/* Guide Menu Modal */}
          {menuOpen && (
            <div className="absolute bottom-16 right-0 w-84 bg-white rounded-3xl shadow-2xl border border-slate-200 p-5 text-xs animate-in fade-in zoom-in-95 duration-150 z-50">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <Logo size="sm" showTagline={true} variant="dark" />
                <button
                  onClick={() => setMenuOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Main Full Platform Tour CTA */}
              <div className="py-4 space-y-3">
                <div className="p-3.5 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white space-y-2 shadow-lg shadow-blue-500/20">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-blue-200">
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>Recommended Starting Point</span>
                  </div>
                  <h4 className="font-black text-sm">Full Website End-to-End Tour</h4>
                  <p className="text-[11px] text-blue-100 leading-relaxed">
                    Walks you through every single page: Landing, Catalog, Customer Booking, Provider Dispatch, Technician App, and Super Admin.
                  </p>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      startTour(TOURS.FULL_PLATFORM);
                    }}
                    className="w-full py-2 bg-white text-blue-700 hover:bg-blue-50 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                  >
                    <Play className="w-3.5 h-3.5 fill-blue-700" />
                    <span>Start Complete 9-Step Tour</span>
                  </button>
                </div>

                {/* Individual Role Journeys */}
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                    Or Explore Specific Role Journeys:
                  </span>
                  <div className="space-y-1.5">
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        startTour(TOURS.CUSTOMER_FLOW);
                      }}
                      className="w-full p-2.5 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 text-left flex items-center justify-between transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-emerald-600" />
                        <div>
                          <p className="font-bold text-slate-800">Customer Journey</p>
                          <p className="text-[10px] text-slate-400">Search → Slot Booking → Razorpay Pay → Invoices</p>
                        </div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                    </button>

                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        startTour(TOURS.PROVIDER_FLOW);
                      }}
                      className="w-full p-2.5 rounded-xl border border-slate-200 hover:border-amber-300 hover:bg-amber-50/50 text-left flex items-center justify-between transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-amber-600" />
                        <div>
                          <p className="font-bold text-slate-800">Service Provider Journey</p>
                          <p className="text-[10px] text-slate-400">Incoming Orders → Tech Dispatch → Net Revenue</p>
                        </div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                    </button>

                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        startTour(TOURS.TECH_FLOW);
                      }}
                      className="w-full p-2.5 rounded-xl border border-slate-200 hover:border-cyan-300 hover:bg-cyan-50/50 text-left flex items-center justify-between transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Wrench className="w-4 h-4 text-cyan-600" />
                        <div>
                          <p className="font-bold text-slate-800">Technician Mobile Journey</p>
                          <p className="text-[10px] text-slate-400">Task List → En Route → Completion Proof Photo</p>
                        </div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                    </button>

                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        startTour(TOURS.ADMIN_FLOW);
                      }}
                      className="w-full p-2.5 rounded-xl border border-slate-200 hover:border-purple-300 hover:bg-purple-50/50 text-left flex items-center justify-between transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-purple-600" />
                        <div>
                          <p className="font-bold text-slate-800">Super Admin Governance</p>
                          <p className="text-[10px] text-slate-400">Platform GMV → KYC Verification → Dispute Resolution</p>
                        </div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
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
                boxShadow: '0 0 0 9999px rgba(15, 23, 42, 0.65)',
                borderRadius: '1.25rem',
              }}
              className="pointer-events-auto transition-all duration-300 ring-4 ring-blue-500 ring-offset-2 ring-offset-transparent animate-pulse"
            ></div>
          ) : (
            <div className="fixed inset-0 bg-slate-900/65 backdrop-blur-xs transition-opacity duration-300 pointer-events-auto"></div>
          )}

          {/* Draggable Tooltip Instruction Card */}
          <div
            style={{
              transform: `translate(calc(-50% + ${dragOffset.x}px), calc(-50% + ${dragOffset.y}px))`,
            }}
            className={`fixed top-1/2 left-1/2 max-w-lg w-[92vw] sm:w-[480px] bg-white rounded-3xl shadow-2xl border-2 border-blue-100 p-6 sm:p-7 z-20 pointer-events-auto animate-in fade-in zoom-in-95 duration-200 transition-shadow ${
              isDragging ? 'shadow-blue-500/30 scale-[1.01] cursor-grabbing ring-2 ring-blue-500' : ''
            }`}
          >
            {/* Draggable Handle Header */}
            <div
              onMouseDown={handleMouseDown}
              onTouchStart={handleTouchStart}
              className="cursor-move select-none -mt-2 -mx-2 pb-3 mb-2 border-b border-slate-100 flex flex-col gap-2"
            >
              <div className="flex items-center justify-center">
                <div className="flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-slate-900 text-white text-[11px] font-bold tracking-wider shadow-md hover:bg-blue-600 transition-all border border-slate-700 hover:border-blue-500 cursor-move">
                  <GripHorizontal className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>DRAG TO REPOSITION</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-blue-600 font-extrabold text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Step {currentStepIndex + 1} of {totalSteps}</span>
                </span>
                <button
                  onClick={endTour}
                  className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                  title="Close Guide"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Progress track */}
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-1">
                <div
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 h-full rounded-full transition-all duration-300"
                  style={{ width: `${((currentStepIndex + 1) / totalSteps) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Instruction Content with Larger, Readable Text */}
            <div className="py-3 space-y-2.5">
              <h3 className="text-xl font-black text-slate-900 tracking-tight leading-snug">
                {currentStep.title}
              </h3>
              <p className="text-sm sm:text-[15px] text-slate-700 leading-relaxed font-medium">
                {currentStep.content}
              </p>
            </div>

            {/* Navigation & Action Controls */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-2">
              <button
                onClick={prevStep}
                disabled={currentStepIndex === 0}
                className="py-2.5 px-3.5 text-xs sm:text-sm font-bold text-slate-600 hover:text-slate-900 disabled:opacity-30 flex items-center gap-1.5 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>

              <div className="flex items-center gap-2.5">
                <button
                  onClick={endTour}
                  className="py-2.5 px-3 text-xs sm:text-sm font-semibold text-slate-400 hover:text-slate-600"
                >
                  Skip
                </button>
                <button
                  onClick={nextStep}
                  className="py-3 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl text-xs sm:text-sm font-extrabold shadow-lg shadow-blue-500/30 flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-95"
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
