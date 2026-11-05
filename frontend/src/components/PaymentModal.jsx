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
  QrCode,
  ArrowRight,
  RefreshCw,
  Wallet,
  Check,
  Shield,
  HelpCircle,
  ExternalLink
} from 'lucide-react';

export default function PaymentModal({ isOpen, onClose, booking, onSuccess }) {
  const [method, setMethod] = useState('upi'); // 'upi' | 'card' | 'netbanking' | 'wallet'
  const [upiId, setUpiId] = useState('success@razorpay');
  const [cardNumber, setCardNumber] = useState('4111 2222 3333 4444');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvv, setCardCvv] = useState('123');
  const [cardName, setCardName] = useState('Priya Sharma');
  const [selectedBank, setSelectedBank] = useState('HDFC Bank');
  const [selectedWallet, setSelectedWallet] = useState('Paytm');
  const [processing, setProcessing] = useState(false);
  const [showOtpScreen, setShowOtpScreen] = useState(false);
  const [otpValue, setOtpValue] = useState('123456');
  const [paymentSuccessData, setPaymentSuccessData] = useState(null);
  const [error, setError] = useState('');
  const [orderData, setOrderData] = useState(null);
  const [customKeyInput, setCustomKeyInput] = useState('');
  const [showKeyConfig, setShowKeyConfig] = useState(false);
  const [qrTimer, setQrTimer] = useState(600); // 10 minutes countdown

  // Countdown timer for QR Code
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setQrTimer((prev) => (prev > 1 ? prev - 1 : 600));
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  // Format QR seconds to mm:ss
  const formatTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Prefetch order details
  useEffect(() => {
    if (!isOpen || !booking) return;

    client
      .post('/api/payments/razorpay/create-order', { booking_id: booking.id })
      .then((res) => {
        setOrderData(res.data);
        if (res.data?.is_live_gateway && !document.getElementById('razorpay-checkout-script')) {
          const script = document.createElement('script');
          script.id = 'razorpay-checkout-script';
          script.src = 'https://checkout.razorpay.com/v1/checkout.js';
          script.async = true;
          document.body.appendChild(script);
        }
      })
      .catch((err) => {
        console.warn('Razorpay order init fallback to standard process:', err);
      });
  }, [isOpen, booking]);

  if (!isOpen || !booking) return null;

  const totalWithTax = (booking.final_amount * 1.18).toFixed(2);
  const gstAmount = (booking.final_amount * 0.18).toFixed(2);

  // Trigger Native Razorpay Modal if custom key is entered or live gateway confirmed
  const triggerNativeCheckout = (keyId) => {
    if (!window.Razorpay) {
      alert('Razorpay Checkout script is still loading. Please try again in 2 seconds.');
      return;
    }

    try {
      const options = {
        key: keyId,
        amount: Math.round(booking.final_amount * 1.18 * 100),
        currency: 'INR',
        name: 'TOPS & Taps',
        description: `Booking #${booking.booking_code} - ${booking.service_name}`,
        image: 'https://cdn.iconscout.com/icon/free/png-256/free-razorpay-logo-icon-download-in-svg-png-gif-file-formats--payment-gateway-brand-logos-pack-icons-675724.png',
        handler: async function (response) {
          try {
            const verifyRes = await client.post('/api/payments/razorpay/verify-payment', {
              booking_id: booking.id,
              razorpay_order_id: response.razorpay_order_id || `order_${Date.now()}`,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature || `sig_${Date.now()}`,
              payment_method: 'Razorpay Cloud Gateway',
            });
            if (onSuccess) onSuccess(verifyRes.data);
            onClose();
          } catch (err) {
            setError(err.response?.data?.detail || 'Signature verification failed');
          }
        },
        prefill: {
          name: booking.customer_name || 'Customer',
          email: 'customer@gmail.com',
          contact: '9876543210',
        },
        theme: { color: '#0c2340' },
        modal: {
          ondismiss: function () {
            setProcessing(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (resp) {
        console.warn('Razorpay payment failed:', resp.error);
        setError(resp.error?.description || 'Payment rejected by gateway');
        setProcessing(false);
      });
      rzp.open();
    } catch (err) {
      console.warn('Failed to open native checkout:', err);
      setError('Could not open Razorpay checkout. ' + (err.message || ''));
    }
  };

  // Handler when clicking "Pay ₹..." in modal
  const handleInitiatePay = () => {
    // If user provided a real custom test key from dashboard.razorpay.com
    if (customKeyInput.trim().startsWith('rzp_test_')) {
      triggerNativeCheckout(customKeyInput.trim());
      return;
    }

    if (orderData?.is_live_gateway && orderData?.key_id && !orderData.key_id.startsWith('rzp_test_TOPSTaps')) {
      triggerNativeCheckout(orderData.key_id);
      return;
    }

    // Launch Authentic Razorpay Test OTP / Simulation Screen
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      setShowOtpScreen(true);
    }, 600);
  };

  // Handler for OTP Simulation Screen (Success / Failure)
  const handleSimulateCompletion = async (isSuccess) => {
    if (!isSuccess) {
      setShowOtpScreen(false);
      setError('Payment cancelled by user at Razorpay Test Bank.');
      return;
    }

    setProcessing(true);
    setError('');

    const mockPaymentId = `pay_rzp_${Math.random().toString(36).substring(2, 10)}${Date.now().toString(36)}`;
    const mockOrderId = orderData?.order_id || `order_${Date.now()}`;
    const mockSignature = `sig_verified_${Date.now()}`;

    try {
      const res = await client.post('/api/payments/razorpay/verify-payment', {
        booking_id: booking.id,
        razorpay_order_id: mockOrderId,
        razorpay_payment_id: mockPaymentId,
        razorpay_signature: mockSignature,
        payment_method: `Razorpay Sandbox (${method.toUpperCase()})`,
      });

      setShowOtpScreen(false);
      setPaymentSuccessData(res.data);

      setTimeout(() => {
        if (onSuccess) onSuccess(res.data);
        onClose();
      }, 1600);
    } catch (err) {
      setError(err.response?.data?.detail || 'Payment verification failed');
      setShowOtpScreen(false);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      {/* Authentic Razorpay Modal Container */}
      <div className="bg-white text-slate-900 rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden border border-slate-700/30 flex flex-col relative animate-in zoom-in-95 duration-150">
        
        {/* Top Razorpay Brand & Test Mode Ribbon */}
        <div className="bg-[#0c2340] text-white px-6 py-3 flex items-center justify-between border-b border-blue-900/40">
          <div className="flex items-center gap-3">
            {/* Razorpay Logo Mark */}
            <div className="flex items-center gap-1.5 font-bold tracking-tight">
              <div className="w-6 h-6 rounded-md bg-blue-500 flex items-center justify-center text-white font-black text-xs shadow-inner">
                R
              </div>
              <span className="text-base tracking-wide font-black">
                Razorpay <span className="text-cyan-400 font-normal text-xs uppercase tracking-wider ml-1">Standard Checkout</span>
              </span>
            </div>
            <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-400/30">
              Test Mode Sandbox
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowKeyConfig(!showKeyConfig)}
              className="text-[11px] px-2.5 py-1 rounded-lg bg-blue-900/60 hover:bg-blue-800 text-cyan-300 border border-cyan-500/30 transition-colors flex items-center gap-1 cursor-pointer"
              title="Add personal Razorpay Key from dashboard.razorpay.com"
            >
              <ExternalLink className="w-3 h-3" />
              <span>{showKeyConfig ? 'Hide Key Config' : 'Use Own Key'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Optional Custom API Key Bar */}
        {showKeyConfig && (
          <div className="bg-blue-950 p-3 text-xs text-white border-b border-blue-800 flex flex-col sm:flex-row items-center gap-2">
            <span className="text-cyan-300 font-semibold shrink-0">Dashboard API Key ID:</span>
            <input
              type="text"
              value={customKeyInput}
              onChange={(e) => setCustomKeyInput(e.target.value)}
              placeholder="rzp_test_XXXXXXXXXXXXXX (from dashboard.razorpay.com)"
              className="w-full bg-slate-900 border border-cyan-500/40 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:ring-1 focus:ring-cyan-400"
            />
            <button
              onClick={() => {
                if (customKeyInput.trim().startsWith('rzp_test_')) {
                  triggerNativeCheckout(customKeyInput.trim());
                } else {
                  alert('Please enter a valid key starting with rzp_test_');
                }
              }}
              className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold shrink-0 cursor-pointer"
            >
              Launch Popup
            </button>
          </div>
        )}

        {/* OTP Simulation View (Razorpay Test Bank Screen) */}
        {showOtpScreen ? (
          <div className="p-8 bg-slate-50 flex flex-col items-center justify-center text-center space-y-5 min-h-[420px]">
            <div className="w-14 h-14 rounded-2xl bg-[#0c2340] text-white flex items-center justify-center shadow-lg">
              <Building2 className="w-7 h-7 text-cyan-400" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-100 px-3 py-1 rounded-full">
                Razorpay Test Bank Simulator
              </span>
              <h3 className="text-xl font-black text-slate-900 mt-2">
                Authorize Transaction
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">
                Simulating two-factor bank authentication for order{' '}
                <span className="font-mono font-bold text-slate-800">{booking.booking_code}</span>
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm w-full max-w-sm text-left space-y-3">
              <div className="flex justify-between text-xs text-slate-600">
                <span>Merchant:</span>
                <span className="font-bold text-slate-900">TOPS &amp; Taps Pvt Ltd</span>
              </div>
              <div className="flex justify-between text-xs text-slate-600">
                <span>Amount:</span>
                <span className="font-bold text-emerald-600 text-sm">₹{totalWithTax}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-600">
                <span>Payment Mode:</span>
                <span className="font-mono font-semibold uppercase">{method}</span>
              </div>
              <div className="pt-2 border-t border-slate-100">
                <label className="block text-[11px] font-bold text-slate-500 uppercase">
                  One Time Password (OTP)
                </label>
                <input
                  type="text"
                  value={otpValue}
                  onChange={(e) => setOtpValue(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border rounded-xl text-center text-lg font-mono font-black tracking-widest bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
                <p className="text-[10px] text-slate-400 text-center mt-1">
                  Default test OTP is prefilled. Click Simulate Success to proceed.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
              <button
                onClick={() => handleSimulateCompletion(true)}
                disabled={processing}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-600/30 cursor-pointer disabled:opacity-60"
              >
                {processing ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                <span>Simulate Success</span>
              </button>
              <button
                onClick={() => handleSimulateCompletion(false)}
                disabled={processing}
                className="flex-1 py-3 bg-slate-200 hover:bg-red-100 hover:text-red-700 text-slate-700 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
                <span>Simulate Failure</span>
              </button>
            </div>
          </div>
        ) : paymentSuccessData ? (
          /* Payment Success Confirmation View */
          <div className="p-8 bg-slate-50 flex flex-col items-center justify-center text-center space-y-4 min-h-[420px]">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-lg animate-bounce">
              <Check className="w-8 h-8 stroke-[3]" />
            </div>
            <h3 className="text-2xl font-black text-slate-900">Payment Successful!</h3>
            <p className="text-xs text-slate-600 max-w-sm">
              ₹{totalWithTax} paid successfully to TOPS &amp; Taps. Tax invoice has been generated automatically.
            </p>
            <div className="bg-white p-4 rounded-xl border border-slate-200 text-xs font-mono text-slate-700 space-y-1">
              <div>TxID: <span className="font-bold text-blue-600">{paymentSuccessData.transaction_id}</span></div>
              <div>Booking: <span className="font-bold text-slate-900">{booking.booking_code}</span></div>
            </div>
            <p className="text-[11px] text-slate-400">Closing checkout and updating dashboard...</p>
          </div>
        ) : (
          /* Standard Razorpay 2-Column Checkout Layout */
          <div className="grid grid-cols-1 md:grid-cols-12 min-h-[440px]">
            
            {/* Left Column: Merchant Branding & Order Summary (Razorpay Signature Navy) */}
            <div className="md:col-span-5 bg-[#0c2340] p-6 text-white flex flex-col justify-between border-r border-slate-800">
              <div className="space-y-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white font-black text-base shadow-lg">
                    T
                  </div>
                  <div>
                    <h4 className="font-black text-sm text-white leading-tight">TOPS &amp; Taps</h4>
                    <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-semibold">
                      <ShieldCheck className="w-3 h-3" />
                      <span>Razorpay Trusted Business</span>
                    </div>
                  </div>
                </div>

                {/* Amount Card */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-3.5 space-y-2">
                  <div className="flex justify-between items-baseline">
                    <span className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Amount to Pay</span>
                    <span className="text-2xl font-black text-cyan-400 tracking-tight">₹{totalWithTax}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 border-t border-white/10 pt-2 space-y-1">
                    <div className="flex justify-between">
                      <span>Service Charge</span>
                      <span className="text-white font-medium">₹{booking.final_amount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>GST (18%)</span>
                      <span className="text-white font-medium">₹{gstAmount}</span>
                    </div>
                    <div className="flex justify-between text-cyan-300 font-mono text-[10px] pt-1">
                      <span>Ref Code:</span>
                      <span>{booking.booking_code}</span>
                    </div>
                  </div>
                </div>

                {/* Payment Instruments Sidebar */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Payment Options
                  </span>
                  {[
                    { id: 'upi', label: 'UPI / QR Code', icon: Smartphone, sub: 'Google Pay, PhonePe, Paytm' },
                    { id: 'card', label: 'Cards (Credit/Debit)', icon: CreditCard, sub: 'Visa, MasterCard, RuPay' },
                    { id: 'netbanking', label: 'Netbanking', icon: Building2, sub: 'All Indian Banks' },
                    { id: 'wallet', label: 'Wallets', icon: Wallet, sub: 'Paytm, PhonePe, Mobikwik' },
                  ].map((item) => {
                    const Icon = item.icon;
                    const active = method === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => { setMethod(item.id); setError(''); }}
                        className={`w-full text-left p-3 rounded-xl flex items-center gap-3 transition-all cursor-pointer ${
                          active
                            ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-600/30 border border-blue-400/40'
                            : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white border border-transparent'
                        }`}
                      >
                        <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-white' : 'text-cyan-400'}`} />
                        <div className="min-w-0">
                          <p className="text-xs leading-tight font-bold">{item.label}</p>
                          <p className={`text-[10px] truncate ${active ? 'text-blue-100' : 'text-slate-400'}`}>
                            {item.sub}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Razorpay PCI DSS Trust Seal */}
              <div className="pt-4 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-400">
                <span className="flex items-center gap-1">
                  <Lock className="w-3 h-3 text-emerald-400" />
                  <span>256-Bit SSL Encrypted</span>
                </span>
                <span className="font-bold text-slate-300">PCI-DSS Level 1</span>
              </div>
            </div>

            {/* Right Column: Interactive Instrument Body */}
            <div className="md:col-span-7 p-6 bg-slate-50 flex flex-col justify-between">
              <div>
                {/* Method Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
                  <h4 className="text-sm font-black text-slate-800 uppercase tracking-wide">
                    {method === 'upi' && 'Pay via UPI / QR Code'}
                    {method === 'card' && 'Credit / Debit Card'}
                    {method === 'netbanking' && 'Select Netbanking Partner'}
                    {method === 'wallet' && 'Select Mobile Wallet'}
                  </h4>
                  <span className="text-[11px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                    Instant Settlement
                  </span>
                </div>

                {/* 1. UPI Mode */}
                {method === 'upi' && (
                  <div className="space-y-4">
                    {/* Simulated Dynamic QR Code */}
                    <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
                      <div className="w-28 h-28 bg-slate-900 rounded-xl p-2 flex items-center justify-center text-white relative shadow-inner shrink-0">
                        <QrCode className="w-24 h-24 text-white" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-6 h-6 rounded-md bg-[#0c2340] border border-cyan-400 flex items-center justify-center text-white font-black text-[10px]">
                            ₹
                          </div>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-black text-slate-900">Scan QR Code using any UPI App</p>
                        <p className="text-[11px] text-slate-500">Google Pay, PhonePe, Paytm, BHIM</p>
                        <div className="flex items-center gap-1.5 text-xs text-amber-700 font-mono font-bold bg-amber-50 px-2 py-1 rounded-md border border-amber-200 w-fit">
                          <RefreshCw className="w-3 h-3 animate-spin text-amber-600" />
                          <span>Expires in: {formatTime(qrTimer)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Or enter VPA */}
                    <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
                      <label className="block text-[11px] font-bold text-slate-700 uppercase">
                        Or Enter UPI ID / VPA
                      </label>
                      <input
                        type="text"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        placeholder="username@okhdfcbank"
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-slate-50 text-slate-900 font-mono focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                      />
                      <div className="flex gap-1.5 flex-wrap">
                        {['success@razorpay', 'rahul@okhdfcbank', 'priya@upi'].map((vpa) => (
                          <button
                            key={vpa}
                            type="button"
                            onClick={() => setUpiId(vpa)}
                            className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-300 cursor-pointer"
                          >
                            {vpa}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. Card Mode */}
                {method === 'card' && (
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase">
                        Card Number (Razorpay Test Card)
                      </label>
                      <input
                        type="text"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        placeholder="4111 2222 3333 4444"
                        className="w-full mt-1 px-3 py-2 text-xs border border-slate-300 rounded-xl bg-slate-50 text-slate-900 font-mono focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 uppercase">Expiry</label>
                        <input
                          type="text"
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value)}
                          placeholder="MM/YY"
                          className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 text-slate-900 font-mono focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 uppercase">CVV</label>
                        <input
                          type="password"
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value)}
                          placeholder="123"
                          maxLength={4}
                          className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 text-slate-900 font-mono focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase">Cardholder Name</label>
                      <input
                        type="text"
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value)}
                        placeholder="Cardholder Name"
                        className="w-full mt-1 px-3 py-2 text-xs border border-slate-300 rounded-xl bg-slate-50 text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* 3. Netbanking Mode */}
                {method === 'netbanking' && (
                  <div className="space-y-3">
                    <p className="text-[11px] font-bold text-slate-700 uppercase">Popular Banks</p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {['HDFC Bank', 'State Bank of India', 'ICICI Bank', 'Axis Bank', 'Kotak Mahindra', 'Punjab National Bank'].map((bank) => (
                        <button
                          key={bank}
                          type="button"
                          onClick={() => setSelectedBank(bank)}
                          className={`p-2.5 rounded-xl border text-left font-medium transition-all cursor-pointer flex items-center justify-between ${
                            selectedBank === bank
                              ? 'border-blue-600 bg-blue-50 text-blue-900 font-bold ring-1 ring-blue-600'
                              : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                          }`}
                        >
                          <span>{bank}</span>
                          {selectedBank === bank && <Check className="w-3.5 h-3.5 text-blue-600" />}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 4. Wallet Mode */}
                {method === 'wallet' && (
                  <div className="space-y-3">
                    <p className="text-[11px] font-bold text-slate-700 uppercase">Supported Wallets</p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {['Paytm Wallet', 'PhonePe Wallet', 'Mobikwik', 'Amazon Pay'].map((w) => (
                        <button
                          key={w}
                          type="button"
                          onClick={() => setSelectedWallet(w)}
                          className={`p-3 rounded-xl border text-left font-medium transition-all cursor-pointer flex items-center justify-between ${
                            selectedWallet === w
                              ? 'border-blue-600 bg-blue-50 text-blue-900 font-bold ring-1 ring-blue-600'
                              : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                          }`}
                        >
                          <span>{w}</span>
                          {selectedWallet === w && <Check className="w-3.5 h-3.5 text-blue-600" />}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Error Banner */}
                {error && (
                  <div className="mt-3 p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}
              </div>

              {/* Bottom Pay Action Button */}
              <div className="pt-4 border-t border-slate-200 mt-4">
                <button
                  onClick={handleInitiatePay}
                  disabled={processing}
                  className="w-full py-3.5 bg-gradient-to-r from-blue-700 to-indigo-800 hover:from-blue-600 hover:to-indigo-700 text-white font-black rounded-xl text-xs transition-all shadow-lg shadow-blue-800/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {processing ? (
                    <span className="flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-cyan-300" />
                      <span>Connecting to Razorpay Gateway...</span>
                    </span>
                  ) : (
                    <>
                      <Lock className="w-4 h-4 text-cyan-300" />
                      <span>Pay ₹{totalWithTax} via Razorpay</span>
                      <ArrowRight className="w-3.5 h-3.5 text-cyan-300" />
                    </>
                  )}
                </button>
                <div className="flex items-center justify-center gap-2 mt-2 text-[10px] text-slate-400">
                  <Shield className="w-3 h-3 text-slate-400" />
                  <span>Secured with Razorpay Standard Gateway &amp; Instant 18% GST Invoicing</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
