import React, { useState, useEffect } from 'react';
import client from '../api/client';
import {
  CreditCard,
  CheckCircle2,
  ShieldCheck,
  X,
  Smartphone,
  Building2,
  AlertCircle,
  Lock,
  ExternalLink,
  Sparkles,
} from 'lucide-react';

export default function PaymentModal({ isOpen, onClose, booking, onSuccess }) {
  const [method, setMethod] = useState('upi'); // 'upi' | 'card' | 'netbanking'
  const [upiId, setUpiId] = useState('success@razorpay');
  const [cardNumber, setCardNumber] = useState('4111 •••• •••• 1111');
  const [selectedBank, setSelectedBank] = useState('HDFC Bank');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [orderData, setOrderData] = useState(null);

  // Load Razorpay checkout script if available
  useEffect(() => {
    if (!isOpen || !booking) return;

    // Prefetch official order details
    client
      .post('/api/payments/razorpay/create-order', { booking_id: booking.id })
      .then((res) => setOrderData(res.data))
      .catch((err) => {
        console.warn('Razorpay order init fallback to standard process:', err);
      });

    // Check if script already loaded
    if (!document.getElementById('razorpay-checkout-script')) {
      const script = document.createElement('script');
      script.id = 'razorpay-checkout-script';
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }, [isOpen, booking]);

  if (!isOpen || !booking) return null;

  const totalWithTax = (booking.final_amount * 1.18).toFixed(2);

  const handlePay = async () => {
    setProcessing(true);
    setError('');

    try {
      // 1. Try real Razorpay Checkout Popup if client provided real test key
      const isCustomKey =
        orderData?.key_id && !orderData.key_id.startsWith('rzp_test_TOPSTaps');

      if (window.Razorpay && isCustomKey && orderData) {
        const options = {
          key: orderData.key_id,
          amount: orderData.amount,
          currency: orderData.currency || 'INR',
          name: 'TOPS & Taps',
          description: `Booking #${booking.booking_code} - ${booking.service_name}`,
          order_id: orderData.order_id,
          prefill: orderData.prefill || {},
          theme: { color: '#0EA5E9' },
          handler: async function (response) {
            try {
              const verifyRes = await client.post(
                '/api/payments/razorpay/verify-payment',
                {
                  booking_id: booking.id,
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  payment_method: 'Razorpay Gateway',
                }
              );
              if (onSuccess) onSuccess(verifyRes.data);
              onClose();
            } catch (err) {
              setError(
                err.response?.data?.detail || 'Signature verification failed'
              );
              setProcessing(false);
            }
          },
          modal: {
            ondismiss: function () {
              setProcessing(false);
            },
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
        return;
      }

      // 2. High-Fidelity Test Mode Verification via Backend
      const mockPaymentId = `pay_rzp_${Math.random().toString(36).substring(2, 10)}${Date.now().toString(36)}`;
      const mockOrderId = orderData?.order_id || `order_test_${Date.now()}`;
      const mockSignature = `sig_verified_${Date.now()}`;

      // Simulate realistic payment gateway handshake delay
      await new Promise((r) => setTimeout(r, 650));

      const res = await client.post('/api/payments/razorpay/verify-payment', {
        booking_id: booking.id,
        razorpay_order_id: mockOrderId,
        razorpay_payment_id: mockPaymentId,
        razorpay_signature: mockSignature,
        payment_method: `Razorpay Test (${method.toUpperCase()})`,
      });

      if (onSuccess) {
        onSuccess(res.data);
      }
      onClose();
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          'Payment processing failed. Please try again.'
      );
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-150">
      <div className="bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-white/15 flex flex-col text-white">
        {/* Gateway Header */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 p-6 relative border-b border-white/10">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 transition-colors cursor-pointer"
            title="Cancel"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-[10px] uppercase tracking-wider text-emerald-400 font-bold">
              Razorpay Test Gateway
            </span>
            <span className="text-[10px] text-slate-400 font-mono">v2.0 Sandbox</span>
          </div>
          <div className="flex justify-between items-baseline">
            <h2 className="text-xl font-black tracking-tight text-white">Checkout</h2>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block uppercase font-medium">Total Payable</span>
              <span className="text-2xl font-black text-cyan-400">
                ₹{totalWithTax}
              </span>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Ref: <span className="font-mono text-cyan-300">{booking.booking_code}</span> • {booking.service_name}
          </p>
        </div>

        {/* Order Breakdown */}
        <div className="p-4 bg-white/5 border-b border-white/10 text-xs space-y-1.5">
          <div className="flex justify-between text-slate-400">
            <span>Service Base Charges</span>
            <span className="font-bold text-white">₹{booking.total_amount}</span>
          </div>
          {booking.discount_amount > 0 && (
            <div className="flex justify-between text-emerald-400 font-medium">
              <span>Applied Promo Discount</span>
              <span>- ₹{booking.discount_amount}</span>
            </div>
          )}
          <div className="flex justify-between text-slate-400">
            <span>GST Tax (9% CGST + 9% SGST)</span>
            <span>₹{(booking.final_amount * 0.18).toFixed(2)}</span>
          </div>
        </div>

        {/* Payment Modes */}
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-2 uppercase tracking-wider text-[11px]">
              Select Payment Instrument
            </label>
            <div className="grid grid-cols-3 gap-2 text-xs">
              {[
                { id: 'upi', label: 'UPI / QR', icon: Smartphone, tag: 'Instant' },
                { id: 'card', label: 'Test Card', icon: CreditCard, tag: 'Visa / MC' },
                { id: 'netbanking', label: 'NetBanking', icon: Building2, tag: 'All Banks' },
              ].map((m) => {
                const Icon = m.icon;
                const active = method === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMethod(m.id)}
                    className={`py-3 px-2 rounded-2xl border flex flex-col items-center gap-1 transition-all cursor-pointer ${
                      active
                        ? 'border-cyan-500 bg-cyan-500/10 text-white font-bold ring-1 ring-cyan-500 shadow-md'
                        : 'border-white/10 bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <Icon className="w-4 h-4 mb-0.5 text-cyan-400" />
                    <span className="leading-tight">{m.label}</span>
                    <span className="text-[9px] text-slate-500 font-normal">{m.tag}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Instrument Details */}
          {method === 'upi' && (
            <div className="p-3.5 bg-slate-950 border border-white/10 rounded-2xl space-y-2">
              <label className="block text-[11px] font-bold text-slate-300">
                Virtual Payment Address (VPA / UPI ID)
              </label>
              <input
                type="text"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="username@bank"
                className="w-full px-3 py-2 text-xs border border-white/10 rounded-xl bg-slate-900 text-white font-mono focus:ring-1 focus:ring-cyan-400 focus:outline-none"
              />
              <p className="text-[10px] text-slate-500">
                Default test VPA: <span className="font-mono text-cyan-400">success@razorpay</span>
              </p>
            </div>
          )}

          {method === 'card' && (
            <div className="p-3.5 bg-slate-950 border border-white/10 rounded-2xl space-y-2">
              <label className="block text-[11px] font-bold text-slate-300">
                Razorpay Test Card Number
              </label>
              <input
                type="text"
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-white/10 rounded-xl bg-slate-900 text-white font-mono focus:ring-1 focus:ring-cyan-400 focus:outline-none"
              />
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <input
                  type="text"
                  defaultValue="12/28"
                  placeholder="MM/YY"
                  className="px-2.5 py-1.5 border border-white/10 rounded-xl bg-slate-900 text-white font-mono"
                />
                <input
                  type="password"
                  defaultValue="123"
                  placeholder="CVV"
                  className="px-2.5 py-1.5 border border-white/10 rounded-xl bg-slate-900 text-white font-mono"
                />
              </div>
            </div>
          )}

          {method === 'netbanking' && (
            <div className="p-3.5 bg-slate-950 border border-white/10 rounded-2xl space-y-2">
              <label className="block text-[11px] font-bold text-slate-300">
                Select Test Banking Partner
              </label>
              <select
                value={selectedBank}
                onChange={(e) => setSelectedBank(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-white/10 rounded-xl bg-slate-900 text-white focus:ring-1 focus:ring-cyan-400 focus:outline-none"
              >
                <option>HDFC Bank</option>
                <option>State Bank of India</option>
                <option>ICICI Bank</option>
                <option>Axis Bank</option>
                <option>Kotak Mahindra Bank</option>
              </select>
            </div>
          )}

          {/* Test Sandbox Badge */}
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-2.5 text-xs text-emerald-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-[11px] leading-snug">
              Razorpay Sandbox Active: Automatic payment verification &amp; instant 18% GST tax invoice generation.
            </span>
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-start gap-2 text-xs text-red-400">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* CTA Button */}
          <button
            onClick={handlePay}
            disabled={processing}
            className="w-full py-3.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-black rounded-2xl text-xs transition-all shadow-xl shadow-blue-600/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            {processing ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                <span>Authorizing Razorpay Gateway...</span>
              </span>
            ) : (
              <>
                <Lock className="w-4 h-4 text-cyan-300" />
                <span>Authorize &amp; Pay ₹{totalWithTax}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
