import React, { useState } from 'react';
import { Upload } from 'lucide-react';
import paymentAPI from '../../services/paymentAPI';
import toast from 'react-hot-toast';

const ReceiptUploader = ({ intentId, onSuccess }) => {
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }


    setUploading(true);
    try {
      await paymentAPI.uploadReceipt(intentId, { externalRef: '', file });
      
      toast.success('Receipt uploaded successfully');
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.message || 'Failed to upload receipt');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="gp-receipt-uploader">
      <label className="gp-receipt-label">
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          disabled={uploading}
          className="gp-receipt-input"
        />
        <div className="gp-receipt-button">
          <Upload size={20} />
          <span>{uploading ? 'Uploading...' : 'Upload Payment Receipt'}</span>
        </div>
      </label>
    </div>
  );
};

export default ReceiptUploader;
