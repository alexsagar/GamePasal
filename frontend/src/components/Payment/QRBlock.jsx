import React, { useState, useEffect, useMemo } from 'react';
import { QrCode, Copy, Check } from 'lucide-react';
import api from '../../services/api';

/**
 * QRBlock Component
 * Displays QR code image or generates QR from data
 * 
 * Props:
 * - qrImageUrl: string - URL to QR image
 * - qrData: string - Data to generate QR from (fallback)
 * - merchantName: string - Merchant name for verification
 * - amount: number - Amount in NPR
 * - currency: string - Currency code
 */
const QRBlock = ({ qrImageUrl, qrData, merchantName, amount, currency = 'NPR' }) => {
  const [qrGenerated, setQrGenerated] = useState(false);
  const [copied, setCopied] = useState(false);

  // Robust fallback for QR image if prop is missing
  const resolvedQrUrl = useMemo(() => {
    if (qrImageUrl) return qrImageUrl;
    const envQr = import.meta.env.VITE_FONEPAY_QR_IMAGE_URL;
    if (envQr) return envQr;
    const apiRoot = (api?.defaults?.baseURL || '').replace(/\/?api$/, '');
    return apiRoot ? `${apiRoot}/uploads/qr/fonepay.png` : '/fonepay-qr.png';
  }, [qrImageUrl]);

  // Simple QR generation fallback (basic implementation)
  useEffect(() => {
    if (!resolvedQrUrl && qrData && !qrGenerated) {
      // For now, we'll just show a placeholder
      // In a real implementation, you might use a QR library like qrcode
      setQrGenerated(true);
    }
  }, [resolvedQrUrl, qrData, qrGenerated]);

  const handleCopyAmount = () => {
    navigator.clipboard.writeText((amount / 100).toFixed(2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
      {/* QR Code Display */}
      <div className="mb-6">
        <div className="inline-block p-4 bg-white rounded-2xl border-2 border-dashed border-gray-300">
          {resolvedQrUrl ? (
            <img
              src={resolvedQrUrl}
              alt="Fonepay QR Code"
              className="w-48 h-48 mx-auto"
              onError={() => setQrGenerated(false)}
            />
          ) : (
            <div className="w-48 h-48 flex flex-col items-center justify-center text-gray-400">
              <QrCode size={64} />
              <span className="text-sm mt-2">QR Code Placeholder</span>
              {qrData && (
                <span className="text-xs mt-1 break-all max-w-32">
                  {qrData.substring(0, 20)}...
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Amount Display with Copy */}
      <div className="mb-6">
        <div className="inline-flex items-center gap-3 bg-blue-50 rounded-xl px-4 py-3">
          <span className="text-2xl font-bold text-blue-900">
            {currency} {(amount / 100).toFixed(2)}
          </span>
          <button
            onClick={handleCopyAmount}
            className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
            title="Copy amount"
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
          </button>
        </div>
      </div>

      {/* Instructions */}
      <div className="space-y-3 text-left">
        <div className="flex items-start gap-3">
          <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-xs font-bold text-blue-600">1</span>
          </div>
          <p className="text-sm text-gray-600">
            Open your <strong>Fonepay-enabled banking app</strong> or mobile wallet
          </p>
        </div>
        
        <div className="flex items-start gap-3">
          <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-xs font-bold text-blue-600">2</span>
          </div>
          <p className="text-sm text-gray-600">
            <strong>Scan the QR code</strong> above using your app's scanner
          </p>
        </div>
        
        <div className="flex items-start gap-3">
          <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-xs font-bold text-blue-600">3</span>
          </div>
          <p className="text-sm text-gray-600">
            <strong>Verify recipient:</strong> <span className="font-semibold text-gray-900">{merchantName}</span>
          </p>
        </div>
        
        <div className="flex items-start gap-3">
          <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-xs font-bold text-blue-600">4</span>
          </div>
          <p className="text-sm text-gray-600">
            Pay the <strong>exact amount</strong> shown above
          </p>
        </div>
      </div>

      {/* Warning */}
      <div className="mt-6 p-3 bg-amber-50 border border-amber-200 rounded-lg">
        <p className="text-xs text-amber-800">
          <strong>Important:</strong> Make sure you're paying to <strong>{merchantName}</strong> and the amount is exactly {currency} {(amount / 100).toFixed(2)}
        </p>
      </div>
    </div>
  );
};

export default QRBlock;
