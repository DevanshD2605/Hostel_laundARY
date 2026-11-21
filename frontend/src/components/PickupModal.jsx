import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Copy, Check, QrCode, ShieldCheck, Clock } from 'lucide-react';

export function PickupModal({ batch, pickup, onClose }) {
  const [copied, setCopied] = useState(false);

  if (!pickup) return null;

  const qrValue = `hlp:${pickup.token}`;
  const formattedCode = pickup.code ? pickup.code.replace(/(\d{3})(\d{3})/, '$1 $2') : '';

  const handleCopy = () => {
    navigator.clipboard.writeText(pickup.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl p-6 border border-slate-100 text-center overflow-hidden">
        {/* Top header */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold mb-3">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Verified Pickup Pass</span>
        </div>

        <h3 className="text-xl font-bold text-slate-900">Collect Your Laundry</h3>
        <p className="text-xs text-slate-500 mt-1 mb-4">
          Show this QR code or 6-digit PIN at Hostel <span className="font-semibold text-slate-700">{batch.hostelId}</span> counter
        </p>

        {/* QR Code display */}
        <div className="relative inline-block p-4 bg-white border-2 border-slate-900 rounded-2xl shadow-sm mb-4">
          <QRCodeSVG
            value={qrValue}
            size={180}
            level="H"
            includeMargin={false}
          />
          {pickup.used && (
            <div className="absolute inset-0 bg-slate-900/80 rounded-xl flex items-center justify-center text-white font-bold text-sm">
              TOKEN ALREADY USED
            </div>
          )}
        </div>

        {/* 6 Digit Backup Code */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 mb-4">
          <div className="text-[11px] font-medium uppercase tracking-wider text-slate-400 mb-1">
            Manual 6-Digit Counter Code
          </div>
          <div className="flex items-center justify-center gap-2">
            <span className="text-2xl font-extrabold tracking-widest text-slate-800 font-mono">
              {formattedCode}
            </span>
            <button
              onClick={handleCopy}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-200 transition"
              title="Copy PIN"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="text-left bg-teal-50 border border-teal-100 rounded-xl p-3 text-xs text-teal-800 mb-4">
          <div className="font-semibold flex items-center gap-1.5 text-teal-900 mb-1">
            <Clock className="w-3.5 h-3.5" /> Counter Collection Hours
          </div>
          <div>12:30 PM – 3:00 PM & 4:00 PM – 7:00 PM</div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm rounded-xl transition"
        >
          Close Pass
        </button>
      </div>
    </div>
  );
}
