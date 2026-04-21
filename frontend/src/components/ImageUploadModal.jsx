import React, { useState } from 'react';
import * as imageService from '../services/imageService';
import './ImageUploadModal.css';

/**
 * ImageUploadModal Component
 * Allows authenticated users with ADMIN role to upload images for resources
 * 
 * Features:
 * - File selection with drag & drop support
 * - Image preview before upload
 * - File validation (type, size)
 * - Set as primary image option
 * - Optional image description
 * - Progress indication
 * - Error handling
 */
const ImageUploadModal = ({ resourceId, isOpen, onClose, onUploadSuccess }) => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [description, setDescription] = useState('');
  const [isPrimary, setIsPrimary] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);

  // Handle file selection
  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      processFile(selectedFile);
    }
  };

  // Process selected file
  const processFile = (selectedFile) => {
    // Validate file
    const validation = imageService.validateImageFile(selectedFile);
    if (!validation.isValid) {
      setError(validation.error);
      setFile(null);
      setPreview(null);
      return;
    }

    setFile(selectedFile);
    setError('');

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target.result);
    };
    reader.readAsDataURL(selectedFile);
  };

  // Handle drag and drop
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

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      processFile(droppedFile);
    }
  };

  // Upload image
  const handleUpload = async () => {
    if (!file) {
      setError('Please select an image file');
      return;
    }

    try {
      setUploading(true);
      setError('');

      const result = await imageService.uploadResourceImage(
        resourceId,
        file,
        description,
        isPrimary
      );

      // Success
      setFile(null);
      setPreview(null);
      setDescription('');
      setIsPrimary(false);
      
      if (onUploadSuccess) {
        onUploadSuccess(result);
      }

      onClose();
    } catch (err) {
      setError(err.message || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  // Clear form
  const handleClear = () => {
    setFile(null);
    setPreview(null);
    setDescription('');
    setIsPrimary(false);
    setError('');
  };

  if (!isOpen) return null;

  return (
    <div className="image-upload-modal-overlay" onClick={onClose}>
      <div className="image-upload-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Upload Resource Image</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-content">
          {/* File Drop Zone */}
          <div
            className={`file-drop-zone ${dragActive ? 'active' : ''} ${file ? 'has-file' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              type="file"
              id="file-input"
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={handleFileSelect}
              disabled={uploading}
              style={{ display: 'none' }}
            />

            {preview ? (
              <div className="preview-container">
                <img src={preview} alt="Preview" className="preview-image" />
                <p className="file-name">{file.name}</p>
                <p className="file-size">({(file.size / 1024).toFixed(2)} KB)</p>
              </div>
            ) : (
              <div className="drop-zone-content">
                <div className="upload-icon">📸</div>
                <p className="drop-text">Drag and drop your image here</p>
                <p className="or-text">or</p>
                <label className="file-select-label" htmlFor="file-input">
                  Click to select file
                </label>
                <p className="file-hint">
                  Supported: JPG, PNG, GIF, WebP (Max 5MB)
                </p>
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              {error}
            </div>
          )}

          {/* Description Input */}
          {file && (
            <div className="form-group">
              <label htmlFor="description">Image Description (Optional)</label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add a description for this image (e.g., 'Front view', 'Close-up of damage')"
                rows="3"
                disabled={uploading}
                className="description-textarea"
              />
            </div>
          )}

          {/* Primary Image Checkbox */}
          {file && (
            <div className="form-group checkbox-group">
              <input
                type="checkbox"
                id="isPrimary"
                checked={isPrimary}
                onChange={(e) => setIsPrimary(e.target.checked)}
                disabled={uploading}
              />
              <label htmlFor="isPrimary">Set as primary image</label>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="modal-footer">
          <button
            className="btn-cancel"
            onClick={onClose}
            disabled={uploading}
          >
            Cancel
          </button>

          {file && (
            <button
              className="btn-clear"
              onClick={handleClear}
              disabled={uploading}
            >
              Clear
            </button>
          )}

          <button
            className="btn-upload"
            onClick={handleUpload}
            disabled={!file || uploading}
          >
            {uploading ? 'Uploading...' : 'Upload Image'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageUploadModal;
