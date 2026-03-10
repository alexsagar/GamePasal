import React, { useState } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

/**
 * UploadField Component
 * File upload with validation, preview, and remove functionality
 * 
 * Props:
 * - value: File | null - Current file
 * - onChange: (file: File | null) => void - File change callback
 * - accept: string - Accepted file types (default: 'image/*')
 * - maxSize: number - Max file size in MB (default: 5)
 * - label: string - Field label
 * - required: boolean - Whether field is required
 * - error: string - Error message to display
 */
const UploadField = ({
  value,
  onChange,
  accept = 'image/*',
  maxSize = 5,
  label,
  required = false,
  error
}) => {
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFile = (file) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      onChange(null);
      return;
    }

    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      onChange(null);
      return;
    }

    onChange(file);
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const removeFile = () => {
    onChange(null);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-2">
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-xl p-6 transition-colors ${
          dragActive
            ? 'border-blue-400 bg-blue-50'
            : error
            ? 'border-red-300 bg-red-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept={accept}
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          aria-label={label}
        />

        {value ? (
          /* File Preview */
          <div className="flex items-center gap-4">
            <div className="relative">
              <img
                src={URL.createObjectURL(value)}
                alt="Upload preview"
                className="w-16 h-16 rounded-lg object-cover bg-gray-100"
              />
              <button
                onClick={removeFile}
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                type="button"
                aria-label="Remove file"
              >
                <X size={12} />
              </button>
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {value.name}
              </p>
              <p className="text-xs text-gray-500">
                {formatFileSize(value.size)}
              </p>
            </div>
            
            <div className="flex items-center text-green-600">
              <ImageIcon size={20} />
            </div>
          </div>
        ) : (
          /* Upload Placeholder */
          <div className="text-center">
            <div className="mx-auto w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-3">
              <Upload size={24} className="text-gray-400" />
            </div>
            <p className="text-sm text-gray-600 mb-1">
              <span className="font-medium text-blue-600">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-gray-500">
              PNG, JPG, GIF up to {maxSize}MB
            </p>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <p className="text-sm text-red-600 flex items-center gap-1">
          <X size={14} />
          {error}
        </p>
      )}

      {/* Help Text */}
      {!error && !value && (
        <p className="text-xs text-gray-500">
          Upload a screenshot of your payment receipt for faster verification
        </p>
      )}
    </div>
  );
};

export default UploadField;
