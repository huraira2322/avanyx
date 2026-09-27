import React, { useState } from 'react';
import {
  QrCode, Copy, Check, Printer, Share2, Smartphone,
  Download, X, ShieldCheck, Sparkles, CheckCircle2, FileText
} from 'lucide-react';
import { SaleTransaction, BusinessProfile } from '../types';
import { AvanyxPricingEngine } from '../utils/pricingEngine';
import { soundEffects } from '../utils/audioEffects';
import { generateQrMatrix } from '../utils/qrCodeGenerator';
import { printThermalReceipt, printStandardInvoice, downloadReceiptAsText } from '../utils/receiptPrinter';

interface CustomerDigitalPassModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale: SaleTransaction | null;
  businessName: string;
  currency: string;
  business?: BusinessProfile;
}

export const CustomerDigitalPassModal: React.FC<CustomerDigitalPassModalProps> = ({
  isOpen,
  onClose,
  sale,
  businessName,
  currency,
  business,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen || !sale) return null;

  const activeBizProfile: BusinessProfile = business || {
    id: sale.businessId || 'default-store',
    name: businessName || 'Store',
    industry: 'retail',
    currency: (currency as any) || 'USD',
    currencySymbol: currency || '$',
    country: 'US',
    address: 'Store Address',
    phone: '',
    email: '',
    taxNumber: '',
    language: 'en',
    taxRateDefault: 0,
    taxInclusive: true,
    enabledModules: ['pos', 'products', 'settings'],
    customFields: [],
    receiptFooter: 'Thank you for your business! Please visit again.',
    receiptHeader: '',
    primaryColor: '#5B5CE2',
    subscriptionTier: 'plus',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const origin = typeof window !== 'undefined'
    ? (window.location.origin + window.location.pathname).replace(/\/$/, '')
    : 'https://admin-3666e.web.app';
  const businessParam = sale.businessId ? `&b=${sale.businessId}` : '';
  const receiptUrl = `${origin}?s=${sale.id}${businessParam}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(receiptUrl);
    soundEffects.playSuccess();
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handlePrintThermal = () => {
    printThermalReceipt({
      sale,
      business: activeBizProfile,
      currency,
      cashierName: sale.cashierName || 'Cashier',
      customerName: sale.customerName || 'Customer',
    });
  };

  const handlePrintA4 = () => {
    printStandardInvoice({
      sale,
      business: activeBizProfile,
      currency,
      cashierName: sale.cashierName || 'Cashier',
      customerName: sale.customerName || 'Customer',
    });
  };

  const handleDownloadTxt = () => {
    downloadReceiptAsText({
      sale,
      business: activeBizProfile,
      currency,
    });
  };

  // Generate real ISO/IEC 18004 QR Code Matrix
  const qr = generateQrMatrix(receiptUrl, 'M');
  const qrMatrixSize = qr.size;
  const qrData = qr.modules;

  return (
    <div id="avanyx-customer-digital-pass-modal" className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 dark:bg-black/80 backdrop-blur-md animate-in fade-in overflow-y-auto">
      <div className="bg-white dark:bg-[#111C30] border border-slate-200 dark:border-[#1F2E4D] rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col relative text-slate-800 dark:text-[#F8FAFC] my-auto">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-[#1F2E4D] flex items-center justify-between bg-slate-50 dark:bg-[#0B1220]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-blue-50 dark:bg-[#152644] border border-blue-200 dark:border-[#1F2E4D] flex items-center justify-center shrink-0">
              <QrCode className="w-5 h-5 text-blue-600 dark:text-[#06B6D4]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-[#F8FAFC] truncate">Digital QR Pass & Receipt</h3>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-blue-50 dark:bg-[#152644] text-blue-600 dark:text-[#06B6D4] border border-blue-200 dark:border-[#1F2E4D]">
                  Zero-Paper
                </span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-[#94A3B8] font-medium truncate max-w-[220px]">
                Invoice #{sale.invoiceNumber || (sale?.id || '').toUpperCase()}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#1E2E4A] transition cursor-pointer shrink-0"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content: QR Code Scan Box & Actions */}
        <div className="p-4 sm:p-6 flex flex-col gap-4 bg-slate-50/50 dark:bg-[#0B1220] max-h-[calc(90dvh-80px)] overflow-y-auto">
          <div className="flex flex-col items-center justify-center p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#111C30] border border-slate-200 dark:border-[#1F2E4D] text-center space-y-3.5 shadow-2xs">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
              Scan with Phone Camera
            </span>

            {/* Render 100% Genuine, Unobstructed Scannable QR */}
            <div className="p-3.5 bg-white rounded-2xl shadow-xl border-4 border-blue-500/20 relative group">
              <svg viewBox={`0 0 ${qrMatrixSize} ${qrMatrixSize}`} className="w-36 h-36 xs:w-44 xs:h-44 sm:w-48 sm:h-48 shape-rendering-crispEdges">
                {qrData.map((row, r) =>
                  row.map((cell, c) => (
                    cell ? (
                      <rect
                        key={`${r}-${c}`}
                        x={c}
                        y={r}
                        width="1"
                        height="1"
                        fill="#0F172A"
                      />
                    ) : null
                  ))
                )}
              </svg>
            </div>

            <div className="space-y-1">
              <div className="text-xs font-extrabold text-slate-900 dark:text-[#F8FAFC]">Instant Mobile Pass</div>
              <p className="text-[11px] text-slate-500 dark:text-[#94A3B8] font-medium leading-relaxed">
                Customer scans to view invoice, itemized breakdown, and loyalty points.
              </p>
            </div>

            <div className="w-full space-y-2 pt-1">
              <button
                onClick={handleCopyLink}
                className="w-full py-2.5 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-[#1E2E4A] dark:hover:bg-[#152644] text-xs font-extrabold text-slate-800 dark:text-[#F8FAFC] border border-slate-200 dark:border-[#1F2E4D] transition flex items-center justify-center gap-1.5 active:scale-98 cursor-pointer"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-blue-600 dark:text-[#06B6D4]" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Link Copied to Clipboard!' : 'Copy Customer Receipt Link'}</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handlePrintThermal}
                  className="w-full py-2.5 px-3 rounded-xl bg-primary hover:bg-primary-hover text-white font-extrabold text-xs transition flex items-center justify-center gap-1.5 shadow-2xs active:scale-98 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Thermal POS</span>
                </button>

                <button
                  onClick={handlePrintA4}
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-900 dark:bg-white hover:opacity-90 text-white dark:text-slate-950 font-extrabold text-xs transition flex items-center justify-center gap-1.5 shadow-2xs active:scale-98 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>A4 Invoice</span>
                </button>
              </div>

              <button
                onClick={handleDownloadTxt}
                className="w-full py-2 px-3 rounded-xl border border-slate-200 dark:border-[#1F2E4D] text-[11px] font-bold text-slate-600 dark:text-[#94A3B8] hover:bg-slate-50 dark:hover:bg-[#152644] transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3 h-3 text-slate-400" />
                <span>Download TXT Format</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
