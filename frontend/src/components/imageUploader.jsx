import React, { useState, useEffect } from "react";

/**
 * A reusable image uploader for file or URL.
 * Props:
 *  - value: The image URL (string)
 *  - onFileChange: (file: File) => void
 *  - onUrlChange: (url: string) => void
 *  - preview: the image preview URL (string)
 */
const ImageUploader = ({ value, onFileChange, onUrlChange, preview }) => {
  const [previewUrl, setPreviewUrl] = useState(preview);

  useEffect(() => {
    setPreviewUrl(preview);
  }, [preview]);

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (file) {
      onFileChange(file);
      const reader = new FileReader();
      reader.onload = (e) => setPreviewUrl(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleUrl = (e) => {
    setPreviewUrl(e.target.value);
    onUrlChange(e.target.value);
  };

  return (
    <div className="image-upload-section">
      <input type="file" accept="image/*" onChange={handleFile} />
      <p className="file-help">Upload an image file (max 5MB) or use URL below</p>
      {previewUrl && (
        <div className="image-preview" style={{ marginBottom: 12 }}>
          <img src={previewUrl} alt="Preview" style={{ maxWidth: 120, borderRadius: 8 }} />
        </div>
      )}
      <input
        type="url"
        placeholder="Or paste image URL"
        value={value}
        onChange={handleUrl}
      />
    </div>
  );
};

export default ImageUploader;
