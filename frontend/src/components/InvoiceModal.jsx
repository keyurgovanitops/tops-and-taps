import React from 'react';
import { X, Printer, Download, CheckCircle2 } from 'lucide-react';
import Logo from './Logo';

export default function InvoiceModal({ isOpen, onClose, booking }) {
  if (!isOpen || !booking) return null;

  const invNumber = booking.invoice?.invoice_number || `INV-${booking.booking_code}`;
  const grandTotal = booking.invoice?.grand_total || (booking.final_amount * 1.18);
  const tax = booking.invoice?.tax_amount || (booking.final_amount * 0.18);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 print:p-0 print:bg-white">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200 print:shadow-none print:border-none">
        {/* Header toolbar */}
        <div className="flex items-center justify-between p-4 bg-slate-900 text-white print:hidden">
          <span className="text-xs font-semibold tracking-wider uppercase text-blue-400">Tax Invoice & Receipt</span>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1"
            >
              <Printer className="w-4 h-4" />
              <span>Print</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Sheet */}
        <div className="p-6 md:p-8 space-y-6">
          {/* Company & Status */}
          <div className="flex items-start justify-between border-b border-slate-100 pb-5">
            <div>
              <Logo size="sm" showTagline={true} variant="dark" />
              <p className="text-[10px] text-slate-400 mt-1">GSTIN: 27AABCH1234F1Z5 • Registered SaaS Platform</p>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>PAID</span>
              </span>
              <p className="text-xs font-mono font-bold text-slate-700 mt-2">{invNumber}</p>
              <p className="text-[11px] text-slate-400">Date: {new Date(booking.created_at || Date.now()).toLocaleDateString()}</p>
            </div>
          </div>

          {/* Billed To / Job details */}
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="font-semibold text-slate-400 uppercase text-[10px] tracking-wider block mb-1">Billed To</span>
              <p className="font-bold text-slate-800">{booking.customer_name || 'Customer'}</p>
              <p className="text-slate-600 leading-tight mt-0.5">{booking.address}</p>
              <p className="text-slate-500 mt-1">Phone: {booking.customer_phone}</p>
            </div>
            <div>
              <span className="font-semibold text-slate-400 uppercase text-[10px] tracking-wider block mb-1">Service Partner</span>
              <p className="font-bold text-slate-800">{booking.provider_name || 'TOPS & Taps Verified Pro'}</p>
              <p className="text-slate-600 mt-0.5">Booking ID: {booking.booking_code}</p>
              <p className="text-slate-500">Scheduled: {booking.booking_date} ({booking.time_slot})</p>
            </div>
          </div>

          {/* Line items table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4 font-semibold">Service Description</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                <tr>
                  <td className="py-3 px-4">
                    <p className="font-semibold text-slate-800">{booking.service_name}</p>
                    <p className="text-[11px] text-slate-400">Home Service Labor & Initial Inspection</p>
                  </td>
                  <td className="py-3 px-4 text-right font-medium">₹{Number(booking.total_amount).toFixed(2)}</td>
                </tr>
                {booking.discount_amount > 0 && (
                  <tr className="text-emerald-700 bg-emerald-50/30">
                    <td className="py-2 px-4 font-medium">Coupon Promo Discount</td>
                    <td className="py-2 px-4 text-right font-medium">- ₹{Number(booking.discount_amount).toFixed(2)}</td>
                  </tr>
                )}
                <tr>
                  <td className="py-2 px-4 text-slate-500">CGST + SGST (18%)</td>
                  <td className="py-2 px-4 text-right text-slate-500">₹{Number(tax).toFixed(2)}</td>
                </tr>
                <tr className="bg-slate-50 font-bold text-slate-900 border-t border-slate-200 text-sm">
                  <td className="py-3 px-4">Grand Total Paid</td>
                  <td className="py-3 px-4 text-right text-blue-600">₹{Number(grandTotal).toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Payment metadata */}
          <div className="p-3 bg-slate-50 rounded-xl text-[11px] text-slate-500 space-y-1">
            <p><span className="font-medium text-slate-700">Payment Gateway:</span> Razorpay Test Sandbox</p>
            <p><span className="font-medium text-slate-700">Transaction ID:</span> {booking.payment?.transaction_id || 'pay_test_online'}</p>
            <p><span className="font-medium text-slate-700">Notes:</span> Computer-generated tax invoice. No signature required.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

