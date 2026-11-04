import React from 'react';
import { X, Printer, Download, CheckCircle2, ShieldCheck, FileCheck } from 'lucide-react';
import Logo from './Logo';

export default function InvoiceModal({ isOpen, onClose, booking }) {
  if (!isOpen || !booking) return null;

  const invNumber = booking.invoice?.invoice_number || `INV-${booking.booking_code}`;
  const grandTotal = booking.invoice?.grand_total || (booking.final_amount * 1.18);
  const tax = booking.invoice?.tax_amount || (booking.final_amount * 0.18);
  const subtotal = booking.invoice?.subtotal || booking.total_amount || booking.final_amount;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 print:p-0 print:bg-white animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200 print:shadow-none print:border-none text-slate-900">
        {/* Header toolbar */}
        <div className="flex items-center justify-between p-4 bg-slate-950 text-white print:hidden border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
            <span className="text-xs font-bold tracking-wider uppercase text-cyan-400">Official GST Tax Invoice</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Invoice</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Sheet */}
        <div className="p-6 md:p-8 space-y-6 bg-white">
          {/* Company & Status */}
          <div className="flex items-start justify-between border-b border-slate-200 pb-5">
            <div>
              <Logo size="md" showTagline={true} variant="dark" />
              <p className="text-[10px] text-slate-500 mt-2 font-mono">
                GSTIN: 27AABCT9634F1Z5 • CIN: U74999MH2026PTC123456
              </p>
              <p className="text-[10px] text-slate-400">
                TOPS &amp; Taps Technologies Pvt Ltd, Powai, Mumbai - 400076
              </p>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>PAID &amp; SETTLED</span>
              </span>
              <p className="text-xs font-mono font-bold text-slate-800 mt-2">{invNumber}</p>
              <p className="text-[11px] text-slate-500">Date: {new Date(booking.created_at || Date.now()).toLocaleDateString()}</p>
            </div>
          </div>

          {/* Billed To / Job details */}
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="font-bold text-slate-400 uppercase text-[10px] tracking-wider block mb-1">Customer Details</span>
              <p className="font-black text-slate-900">{booking.customer_name || 'Valued Customer'}</p>
              <p className="text-slate-600 leading-tight mt-1">{booking.address}</p>
              <p className="text-slate-500 mt-1 font-mono text-[11px]">{booking.customer_phone || '+91 98765 43211'}</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="font-bold text-slate-400 uppercase text-[10px] tracking-wider block mb-1">Service Partner</span>
              <p className="font-black text-slate-900">{booking.provider_name || 'TOPS & Taps Certified Partner'}</p>
              <p className="text-slate-600 mt-1">Booking: <span className="font-mono font-bold text-slate-800">{booking.booking_code}</span></p>
              <p className="text-slate-500 text-[11px]">Date: {booking.booking_date} ({booking.time_slot})</p>
            </div>
          </div>

          {/* Line items table */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden text-xs">
            <table className="w-full text-left">
              <thead className="bg-slate-100 text-slate-600 uppercase text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4 font-bold">Service Description</th>
                  <th className="py-2.5 px-4 font-bold text-right">Taxable Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                <tr>
                  <td className="py-3 px-4">
                    <p className="font-bold text-slate-900">{booking.service_name}</p>
                    <p className="text-[11px] text-slate-500">Professional On-site Service &amp; 30-Day Platform Warranty</p>
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-slate-900">₹{Number(subtotal).toFixed(2)}</td>
                </tr>
                {booking.discount_amount > 0 && (
                  <tr className="text-emerald-700 bg-emerald-50/50">
                    <td className="py-2 px-4 font-semibold">Special Promotional Coupon Discount</td>
                    <td className="py-2 px-4 text-right font-bold">- ₹{Number(booking.discount_amount).toFixed(2)}</td>
                  </tr>
                )}
                <tr>
                  <td className="py-2 px-4 text-slate-500">CGST (9.0%)</td>
                  <td className="py-2 px-4 text-right text-slate-500">₹{(Number(tax) / 2).toFixed(2)}</td>
                </tr>
                <tr>
                  <td className="py-2 px-4 text-slate-500">SGST (9.0%)</td>
                  <td className="py-2 px-4 text-right text-slate-500">₹{(Number(tax) / 2).toFixed(2)}</td>
                </tr>
                <tr className="bg-slate-50 font-black text-slate-900 border-t-2 border-slate-200 text-sm">
                  <td className="py-3 px-4">Total Amount Paid (INR)</td>
                  <td className="py-3 px-4 text-right text-blue-600">₹{Number(grandTotal).toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Payment metadata & Digital Stamp */}
          <div className="p-4 bg-slate-50 rounded-2xl text-[11px] text-slate-600 space-y-1.5 border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p><span className="font-bold text-slate-800">Payment Gateway:</span> Razorpay Online Gateway</p>
                <p><span className="font-bold text-slate-800">Payment Ref:</span> <span className="font-mono text-slate-700">{booking.payment?.transaction_id || 'pay_rzp_live_settled'}</span></p>
                <p className="text-[10px] text-slate-400 mt-1">Computer-generated electronic tax invoice. No physical signature required.</p>
              </div>
              <div className="text-right">
                <div className="w-16 h-16 rounded-xl border border-slate-300 bg-white p-1 shadow-inner flex flex-col items-center justify-center text-center">
                  <FileCheck className="w-6 h-6 text-emerald-600 mb-0.5" />
                  <span className="text-[8px] font-black uppercase text-slate-500">Verified</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
