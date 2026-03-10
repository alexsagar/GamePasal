import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import api from '../../services/api';

/**
 * QRBlock component for displaying QR code with instructions
 * @param {Object} props
 * @param {string} props.qrImageUrl - URL of the QR code image
 * @param {string} props.qrData - QR code data (used if qrImageUrl not provided)
 * @param {string} props.merchantName - Name of the merchant for verification
 * @param {number} props.amount - Payment amount in NPR
 */
const QRBlock = ({ qrImageUrl, qrData, merchantName, amount }) => {
  // Resolve QR image robustly: prop -> frontend env -> API-derived -> public fallback
  const resolvedQr = useMemo(() => {
    if (qrImageUrl) return qrImageUrl;
    const envQr = import.meta.env.VITE_FONEPAY_QR_IMAGE_URL;
    if (envQr) return envQr;
    const apiRoot = (api?.defaults?.baseURL || '').replace(/\/?api$/, '');
    return apiRoot ? `${apiRoot}/uploads/qr/fonepay.png` : '/fonepay-qr.png';
  }, [qrImageUrl]);
  return (
    <div className="flex flex-col items-center p-6 bg-white rounded-2xl border border-gray-200">
      <div className="w-64 h-64 bg-white p-4 rounded-xl border-2 border-gray-100 shadow-sm">
        {resolvedQr ? (
          <img
            src={resolvedQr}
            alt="Fonepay QR Code"
            className="w-full h-full"
          />
        ) : qrData && (
          // If we need to render QR from data, we can add a QR library here
          <div className="w-full h-full bg-gray-100 flex items-center justify-center">
            {/* Placeholder for QR code rendering */}
            <span className="text-gray-400 text-sm text-center">QR Code will be displayed here</span>
          </div>
        )}
      </div>

      <div className="mt-6 text-center">
        <p className="text-gray-600 text-sm leading-relaxed">
          Scan using any Fonepay-enabled app.<br />
          Verify recipient: <span className="font-medium text-gray-900">{merchantName}</span><br />
          Amount: <span className="font-medium text-gray-900">NPR {amount.toLocaleString()}</span>
        </p>
      </div>

      <div className="mt-4 flex items-center gap-2 text-xs text-gray-500">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>Having trouble? Contact our support for assistance</span>
      </div>
    </div>
  );
};

QRBlock.propTypes = {
  qrImageUrl: PropTypes.string,
  qrData: PropTypes.string,
  merchantName: PropTypes.string.isRequired,
  amount: PropTypes.number.isRequired
};

export default QRBlock;
