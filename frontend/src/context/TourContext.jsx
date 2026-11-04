import React, { createContext, useContext, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

const TourContext = createContext(null);

export const TOURS = {
  FULL_PLATFORM: 'FULL_PLATFORM',
  CUSTOMER_FLOW: 'CUSTOMER_FLOW',
  PROVIDER_FLOW: 'PROVIDER_FLOW',
  TECH_FLOW: 'TECH_FLOW',
  ADMIN_FLOW: 'ADMIN_FLOW',
};

const TOUR_STEPS = {
  [TOURS.FULL_PLATFORM]: [
    {
      route: '/',
      role: 'customer',
      target: '[data-tour="landing-hero"]',
      title: '🌟 Welcome to TOPS & Taps!',
      content: 'Your home. Our hustle. This guided tour will take you through the complete multi-role platform across all pages.',
      actionText: 'Next: Search Bar',
    },
    {
      route: '/',
      role: 'customer',
      target: '[data-tour="search-bar"]',
      title: '🔍 1. Discovery & Search',
      content: 'Customers can instantly search for repair issues like "AC Repair", "Tap Leak", or "Wiring". Type any keyword or click categories below.',
      actionText: 'Next: Categories',
    },
    {
      route: '/',
      role: 'customer',
      target: '[data-tour="category-grid"]',
      title: '🛠️ 2. Core Service Categories',
      content: 'Browse all 8 core domains: Electrical, Plumbing, AC, Cleaning, Painting, Carpentry, Appliance, and Pest Control.',
      actionText: 'Go to Services Catalog',
    },
    {
      route: '/services',
      role: 'customer',
      target: '[data-tour="services-filter"]',
      title: '🏷️ 3. Services Directory & Filters',
      content: 'Filter through sub-services, view transparent starting prices, and check estimated job durations.',
      actionText: 'Next: How Booking Works',
    },
    {
      route: '/services',
      role: 'customer',
      target: '[data-tour="service-card"]',
      title: '📅 4. Appointment Booking & Slots',
      content: 'Clicking "Book Appointment" opens the interactive drawer to select verified providers, pick date/time slots, and apply promo coupons.',
      actionText: 'Visit Customer Dashboard',
    },
    {
      route: '/customer',
      role: 'customer',
      target: '[data-tour="customer-bookings"]',
      title: '👤 5. Customer Dashboard & Live Tracker',
      content: 'Customers track appointment progress in real time (Pending → Confirmed → Tech Assigned → In Progress → Completed) and download tax receipts.',
      actionText: 'Switch to Service Provider',
    },
    {
      route: '/provider',
      role: 'provider',
      target: '[data-tour="provider-orders"]',
      title: '🏢 6. Provider Dispatch & Operations',
      content: 'Welcome to the Provider Portal! Business owners receive customer requests, accept or reject jobs, and dispatch field technicians.',
      actionText: 'Next: Provider Earnings',
    },
    {
      route: '/provider',
      role: 'provider',
      target: '[data-tour="provider-stats"]',
      title: '💰 7. Net Earnings & Platform Fees',
      content: 'Track gross order volume and net earnings after the automated 15% platform commission is processed.',
      actionText: 'Switch to Technician App',
    },
    {
      route: '/technician',
      role: 'technician',
      target: '[data-tour="tech-jobs"]',
      title: '🔧 8. Field Technician Mobile App',
      content: 'Technicians receive daily job cards with customer phone and location. They mark arrival, start work, and upload completion proof photos.',
      actionText: 'Switch to Super Admin',
    },
    {
      route: '/admin',
      role: 'admin',
      target: '[data-tour="admin-overview"]',
      title: '🛡️ 9. Super Admin Governance & GMV',
      content: 'Central Admin monitors total platform GMV, performs 1-click KYC approvals on new providers, and resolves customer complaints.',
      actionText: 'Complete Tour 🎉',
    },
  ],
  [TOURS.CUSTOMER_FLOW]: [
    {
      route: '/',
      role: 'customer',
      target: '[data-tour="search-bar"]',
      title: 'Find What You Need',
      content: 'Search any home repair problem or service.',
      actionText: 'Next',
    },
    {
      route: '/services',
      role: 'customer',
      target: '[data-tour="service-card"]',
      title: 'Pick a Service & Slot',
      content: 'Choose your preferred date, morning/evening slot, and address.',
      actionText: 'Go to My Bookings',
    },
    {
      route: '/customer',
      role: 'customer',
      target: '[data-tour="customer-bookings"]',
      title: 'Manage & Pay',
      content: 'Pay using the simulated Razorpay test gateway, download invoices, or rate your provider.',
      actionText: 'Finish',
    },
  ],
  [TOURS.PROVIDER_FLOW]: [
    {
      route: '/provider',
      role: 'provider',
      target: '[data-tour="provider-orders"]',
      title: 'Order Dispatch',
      content: 'Review incoming customer requests and click Accept or Assign Technician.',
      actionText: 'Next',
    },
    {
      route: '/provider',
      role: 'provider',
      target: '[data-tour="provider-stats"]',
      title: 'Earnings & Performance',
      content: 'Track gross bookings, completed jobs, and net payout earnings.',
      actionText: 'Finish',
    },
  ],
  [TOURS.TECH_FLOW]: [
    {
      route: '/technician',
      role: 'technician',
      target: '[data-tour="tech-jobs"]',
      title: 'Daily Work Tasks',
      content: 'Tap a task to see customer phone number, address, and notes.',
      actionText: 'Next',
    },
    {
      route: '/technician',
      role: 'technician',
      target: '[data-tour="tech-jobs"]',
      title: 'Status Updates & Photos',
      content: 'Tap En Route, start the job, upload proof of work photos, and mark completed.',
      actionText: 'Finish',
    },
  ],
  [TOURS.ADMIN_FLOW]: [
    {
      route: '/admin',
      role: 'admin',
      target: '[data-tour="admin-overview"]',
      title: 'Platform Analytics',
      content: 'High-level business overview with gross booking volume and platform fees.',
      actionText: 'Next',
    },
    {
      route: '/admin',
      role: 'admin',
      target: '[data-tour="admin-tabs"]',
      title: 'KYC & Dispute Controls',
      content: 'Audit provider verification documents and resolve customer complaints.',
      actionText: 'Finish',
    },
  ],
};

export const TourProvider = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, token, quickLogin, restoreSession } = useAuth();

  const [activeTour, setActiveTour] = useState(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [initialSnapshot, setInitialSnapshot] = useState(null);

  // Auto-trigger guided tour for first-time visitors
  useEffect(() => {
    const hasSeen = localStorage.getItem('topstaps_tour_seen');
    if (!hasSeen && location.pathname === '/') {
      const timer = setTimeout(() => {
        startTour(TOURS.FULL_PLATFORM);
        localStorage.setItem('topstaps_tour_seen', 'true');
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  const startTour = async (tourKey = TOURS.FULL_PLATFORM) => {
    const tour = TOUR_STEPS[tourKey];
    if (!tour || tour.length === 0) return;

    // Snapshot exact location and user session before tour starts
    const snapshot = {
      route: location.pathname + location.search,
      user: user,
      token: token,
    };
    setInitialSnapshot(snapshot);

    const firstStep = tour[0];
    if (firstStep.role) {
      window.__tour_target_route__ = firstStep.route;
      await quickLogin(firstStep.role);
    }
    if (firstStep.route && location.pathname !== firstStep.route) {
      navigate(firstStep.route);
    }
    window.__tour_target_route__ = null;

    setActiveTour(tourKey);
    setCurrentStepIndex(0);
    setIsOpen(true);
  };

  const endTour = () => {
    localStorage.setItem('topstaps_tour_seen', 'true');
    setIsOpen(false);
    setActiveTour(null);
    setCurrentStepIndex(0);

    // Restore user to exact page and authentication state they started with
    if (initialSnapshot) {
      const targetRoute = initialSnapshot.route || '/';
      window.__tour_target_route__ = targetRoute;
      restoreSession(initialSnapshot.user, initialSnapshot.token);
      navigate(targetRoute);
      setTimeout(() => {
        window.__tour_target_route__ = null;
      }, 150);
      setInitialSnapshot(null);
    } else {
      window.__tour_target_route__ = null;
    }
  };

  const nextStep = async () => {
    const tour = TOUR_STEPS[activeTour];
    if (!tour) return;

    if (currentStepIndex >= tour.length - 1) {
      endTour();
      return;
    }

    const nextIndex = currentStepIndex + 1;
    const nextStepObj = tour[nextIndex];

    // If destination route differs or role differs, safely transition
    if (nextStepObj.route && location.pathname !== nextStepObj.route) {
      window.__tour_target_route__ = nextStepObj.route;
      if (nextStepObj.role) {
        await quickLogin(nextStepObj.role);
      }
      navigate(nextStepObj.route);
      setTimeout(() => {
        window.__tour_target_route__ = null;
      }, 100);
    } else {
      if (nextStepObj.role) {
        await quickLogin(nextStepObj.role);
      }
    }

    setCurrentStepIndex(nextIndex);
  };

  const prevStep = async () => {
    if (currentStepIndex <= 0) return;
    const tour = TOUR_STEPS[activeTour];
    const prevIndex = currentStepIndex - 1;
    const prevStepObj = tour[prevIndex];

    if (prevStepObj.route && location.pathname !== prevStepObj.route) {
      window.__tour_target_route__ = prevStepObj.route;
      if (prevStepObj.role) {
        await quickLogin(prevStepObj.role);
      }
      navigate(prevStepObj.route);
      setTimeout(() => {
        window.__tour_target_route__ = null;
      }, 100);
    } else {
      if (prevStepObj.role) {
        await quickLogin(prevStepObj.role);
      }
    }

    setCurrentStepIndex(prevIndex);
  };

  const currentStep = activeTour && TOUR_STEPS[activeTour] ? TOUR_STEPS[activeTour][currentStepIndex] : null;

  return (
    <TourContext.Provider
      value={{
        activeTour,
        currentStepIndex,
        totalSteps: activeTour ? TOUR_STEPS[activeTour].length : 0,
        currentStep,
        isOpen,
        startTour,
        endTour,
        nextStep,
        prevStep,
      }}
    >
      {children}
    </TourContext.Provider>
  );
};

export const useTour = () => useContext(TourContext);
