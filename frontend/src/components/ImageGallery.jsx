import React, { useState, useEffect } from 'react';
import * as imageService from '../services/imageService';
import './ImageGallery.css';

/**
 * ImageGallery Component
 * Displays images for a resource with role-based management options
 * 
 * Features:
 * - Grid/List view toggle
 * - Image preview modal
 * - Set as primary image (ADMIN only)
 * - Edit description (ADMIN only)
 * - Delete image (ADMIN only)
 * - View-only mode for USER and TECHNICIAN roles
 * - Loading states and error handling
 */
const ImageGallery = ({ resourceId, isAdmin, onImageUpdate, onImageDelete }) => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // grid or list
  const [selectedImage, setSelectedImage] = useState(null); // For preview modal
  const [editingImageId, setEditingImageId] = useState(null);
  const [editDescription, setEditDescription] = useState('');
  const [updatingImageId, setUpdatingImageId] = useState(null);

  // Load images
  useEffect(() => {
    loadImages();
  }, [resourceId]);

  const loadImages = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await imageService.getResourceImages(resourceId);
      setImages(data);
    } catch (err) {
      setError(err.message || 'Failed to load images');
      setImages([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle set as primary
  const handleSetAsPrimary = async (imageId) => {
    try {
      setUpdatingImageId(imageId);
      await imageService.setImageAsPrimary(resourceId, imageId);
      loadImages(); // Reload to update UI
      if (onImageUpdate) {
        onImageUpdate();
      }
    } catch (err) {
      setError(err.message || 'Failed to set primary image');
    } finally {
      setUpdatingImageId(null);
    }
  };

  // Handle update description
  const handleUpdateDescription = async (imageId) => {
    try {
      setUpdatingImageId(imageId);
      await imageService.updateImageMetadata(resourceId, imageId, {
        description: editDescription,
        isPrimary: false
      });
      loadImages();
      setEditingImageId(null);
      setEditDescription('');
      if (onImageUpdate) {
        onImageUpdate();
      }
    } catch (err) {
      setError(err.message || 'Failed to update description');
    } finally {
      setUpdatingImageId(null);
    }
  };

  // Handle delete image
  const handleDeleteImage = async (imageId) => {
    if (window.confirm('Are you sure you want to delete this image?')) {
      try {
        setUpdatingImageId(imageId);
        await imageService.deleteImage(resourceId, imageId);
        loadImages();
        if (onImageDelete) {
          onImageDelete();
        }
      } catch (err) {
        setError(err.message || 'Failed to delete image');
      } finally {
        setUpdatingImageId(null);
      }
    }
  };

  // Start editing description
  const startEditDescription = (image) => {
    setEditingImageId(image.id);
    setEditDescription(image.description || '');
  };

  // Cancel edit
  const cancelEdit = () => {
    setEditingImageId(null);
    setEditDescription('');
  };

  // Loading state
  if (loading) {
    return (
      <div className="image-gallery">
        <div className="loading-message">
          <span className="spinner"></span>
          Loading images...
        </div>
      </div>
    );
  }

  // Empty state
  if (images.length === 0) {
    return (
      <div className="image-gallery">
        <div className="empty-state">
          <div className="empty-icon">🖼️</div>
          <p className="empty-text">No images uploaded yet</p>
          {isAdmin && <p className="empty-hint">Upload images to manage resource visuals</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="image-gallery">
      {/* Gallery Header */}
      <div className="gallery-header">
        <div className="gallery-info">
          <h3>Resource Images ({images.length})</h3>
        </div>
        <div className="gallery-controls">
          <button
            className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => setViewMode('grid')}
            title="Grid view"
          >
            ⊞
          </button>
          <button
            className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}
            title="List view"
          >
            ≡
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="gallery-error">
          <span className="error-icon">⚠️</span>
          {error}
        </div>
      )}

      {/* Gallery Container */}
      <div className={`gallery-container gallery-${viewMode}`}>
        {images.map((image) => (
          <div key={image.id} className={`image-card ${image.isPrimary ? 'primary' : ''}`}>
            {/* Image */}
            <div className="image-wrapper">
              <img
                src={imageService.getImageDataUrl(image)}
                alt={image.fileName}
                className="image-thumbnail"
                onClick={() => setSelectedImage(image)}
              />
              {image.isPrimary && (
                <div className="primary-badge">★ Primary</div>
              )}
            </div>

            {/* Card Content */}
            <div className="card-content">
              {/* File Info */}
              <div className="file-info">
                <p className="file-name" title={image.fileName}>{image.fileName}</p>
                <p className="file-size">{(image.fileSize / 1024).toFixed(2)} KB</p>
              </div>

              {/* Description */}
              {editingImageId === image.id ? (
                <div className="edit-description">
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    placeholder="Enter description"
                    rows="2"
                    disabled={updatingImageId === image.id}
                  />
                  <div className="edit-buttons">
                    <button
                      className="btn-save"
                      onClick={() => handleUpdateDescription(image.id)}
                      disabled={updatingImageId === image.id}
                    >
                      {updatingImageId === image.id ? '...' : 'Save'}
                    </button>
                    <button
                      className="btn-cancel-edit"
                      onClick={cancelEdit}
                      disabled={updatingImageId === image.id}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="description">
                  {image.description ? (
                    <p>{image.description}</p>
                  ) : (
                    <p className="no-description">No description</p>
                  )}
                  {isAdmin && (
                    <button
                      className="btn-edit-desc"
                      onClick={() => startEditDescription(image)}
                      disabled={updatingImageId === image.id}
                    >
                      ✏️
                    </button>
                  )}
                </div>
              )}

              {/* Metadata */}
              <div className="metadata">
                <span className="uploaded-by">Uploaded by: {image.uploadedBy}</span>
                <span className="upload-date">
                  {new Date(image.uploadedAt).toLocaleDateString()}
                </span>
              </div>

              {/* Admin Actions */}
              {isAdmin && (
                <div className="image-actions">
                  {!image.isPrimary && (
                    <button
                      className="btn-set-primary"
                      onClick={() => handleSetAsPrimary(image.id)}
                      disabled={updatingImageId === image.id}
                      title="Set as primary image"
                    >
                      {updatingImageId === image.id ? '...' : '★ Set Primary'}
                    </button>
                  )}
                  <button
                    className="btn-delete"
                    onClick={() => handleDeleteImage(image.id)}
                    disabled={updatingImageId === image.id}
                    title="Delete image"
                  >
                    {updatingImageId === image.id ? '...' : '🗑️ Delete'}
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Image Preview Modal */}
      {selectedImage && (
        <div className="image-preview-modal-overlay" onClick={() => setSelectedImage(null)}>
          <div className="image-preview-modal" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setSelectedImage(null)}>×</button>
            <div className="preview-content">
              <img
                src={imageService.getImageDataUrl(selectedImage)}
                alt={selectedImage.fileName}
                className="preview-image"
              />
              <div className="preview-info">
                <h4>{selectedImage.fileName}</h4>
                {selectedImage.description && <p>{selectedImage.description}</p>}
                <div className="preview-metadata">
                  <span>Size: {(selectedImage.fileSize / 1024).toFixed(2)} KB</span>
                  <span>Uploaded: {new Date(selectedImage.uploadedAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageGallery;
