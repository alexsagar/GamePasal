import React, { useRef, useState } from 'react';
import PropTypes from 'prop-types';

/**
 * UploadField component for receipt image upload with preview
 * @param {Object} props
 * @param {Function} props.onFileSelect - Callback when file is selected
 * @param {string[]} props.acceptedTypes - Array of accepted MIME types
 * @param {number} props.maxSizeMB - Maximum file size in MB
 */
const UploadField = ({
  onFileSelect,
  acceptedTypes = ['image/jpeg', 'image/png'],
  maxSizeMB = 5
}) => {
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    setError('');
    
    if (!file) return;

    // Validate file type
    if (!acceptedTypes.includes(file.type)) {
      setError(`Please select a valid image file (${acceptedTypes.join(', ')})`);
      return;
    }

    // Validate file size
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`File size must be less than ${maxSizeMB}MB`);
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(file);

    onFileSelect(file);
  };

  const handleRemove = () => {
    setPreview(null);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onFileSelect(null);
  };

  return (
    <div className="space-y-4">
      {!preview ? (
        <div
          className={`
            border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
            transition-colors hover:border-primary
            ${error ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:bg-gray-50'}
          `}
          onClick={() => fileInputRef.current?.click()}
          onKeyPress={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={acceptedTypes.join(',')}
            onChange={handleFileSelect}
            className="hidden"
            aria-label="Upload receipt"
          />

          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>

          <div className="mt-4 text-sm text-gray-600">
            Click to upload your receipt
            <br />
            <span className="text-xs text-gray-400">
              JPG or PNG, max {maxSizeMB}MB
            </span>
          </div>
        </div>
      ) : (
        <div className="relative">
          <img
            src={preview}
            alt="Receipt preview"
            className="w-full h-48 object-cover rounded-lg"
          />
          <button
            onClick={handleRemove}
            className="absolute -top-2 -right-2 p-1 rounded-full bg-red-500 text-white hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            aria-label="Remove receipt"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600 mt-2">{error}</p>
      )}
    </div>
  );
};

UploadField.propTypes = {
  onFileSelect: PropTypes.func.isRequired,
  acceptedTypes: PropTypes.arrayOf(PropTypes.string),
  maxSizeMB: PropTypes.number
};

export default UploadField;
