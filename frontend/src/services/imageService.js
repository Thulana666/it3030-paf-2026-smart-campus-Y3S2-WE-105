/**
 * Image Service - API client for resource image management
 * Handles all image-related API calls with base64 encoding/decoding
 */

import { API_BASE_URL } from './api';
const BASE_URL = API_BASE_URL || 'http://localhost:8080/api';

/**
 * Upload an image for a resource
 * @param {string} resourceId - Resource ID
 * @param {File} file - Image file to upload
 * @param {string} description - Optional image description
 * @param {boolean} isPrimary - Whether to set as primary image
 * @returns {Promise<Object>} - Uploaded image data
 */
export async function uploadResourceImage(resourceId, file, description = '', isPrimary = false) {
  try {
    // Read file as base64
    const base64Data = await fileToBase64(file);

    const response = await fetch(`${BASE_URL}/resources/${resourceId}/images`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        fileName: file.name,
        mimeType: file.type,
        imageData: base64Data.split(',')[1], // Remove data:image/png;base64, prefix
        description: description,
        isPrimary: isPrimary
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Failed to upload image');
    }

    return await response.json();
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
}

/**
 * Get all images for a resource
 * @param {string} resourceId - Resource ID
 * @returns {Promise<Array>} - Array of images
 */
export async function getResourceImages(resourceId) {
  try {
    const response = await fetch(`${BASE_URL}/resources/${resourceId}/images`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch images');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching images:', error);
    throw error;
  }
}

/**
 * Get a specific image by ID
 * @param {string} resourceId - Resource ID
 * @param {string} imageId - Image ID
 * @returns {Promise<Object>} - Image data
 */
export async function getImage(resourceId, imageId) {
  try {
    const response = await fetch(`${BASE_URL}/resources/${resourceId}/images/${imageId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch image');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching image:', error);
    throw error;
  }
}

/**
 * Get the primary image for a resource
 * @param {string} resourceId - Resource ID
 * @returns {Promise<Object>} - Primary image data
 */
export async function getPrimaryImage(resourceId) {
  try {
    const response = await fetch(`${BASE_URL}/resources/${resourceId}/images/primary/image`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error('No primary image found');
    }

    return await response.json();
  } catch (error) {
    // A 404 is expected when a resource has no images yet.
    if (error?.message !== 'No primary image found') {
      console.error('Error fetching primary image:', error);
    }
    throw error;
  }
}

/**
 * Update image metadata (description, primary status)
 * @param {string} resourceId - Resource ID
 * @param {string} imageId - Image ID
 * @param {Object} metadata - Metadata to update {description, isPrimary}
 * @returns {Promise<Object>} - Updated image data
 */
export async function updateImageMetadata(resourceId, imageId, metadata) {
  try {
    const response = await fetch(`${BASE_URL}/resources/${resourceId}/images/${imageId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(metadata)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update image metadata');
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating image metadata:', error);
    throw error;
  }
}

/**
 * Set an image as primary
 * @param {string} resourceId - Resource ID
 * @param {string} imageId - Image ID
 * @returns {Promise<Object>} - Updated image data
 */
export async function setImageAsPrimary(resourceId, imageId) {
  try {
    const response = await fetch(
      `${BASE_URL}/resources/${resourceId}/images/${imageId}/primary`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to set primary image');
    }

    return await response.json();
  } catch (error) {
    console.error('Error setting primary image:', error);
    throw error;
  }
}

/**
 * Delete an image
 * @param {string} resourceId - Resource ID
 * @param {string} imageId - Image ID
 * @returns {Promise<Object>} - Success message
 */
export async function deleteImage(resourceId, imageId) {
  try {
    const response = await fetch(`${BASE_URL}/resources/${resourceId}/images/${imageId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete image');
    }

    return await response.json();
  } catch (error) {
    console.error('Error deleting image:', error);
    throw error;
  }
}

/**
 * Get image count for a resource
 * @param {string} resourceId - Resource ID
 * @returns {Promise<number>} - Image count
 */
export async function getImageCount(resourceId) {
  try {
    const response = await fetch(`${BASE_URL}/resources/${resourceId}/images/count`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch image count');
    }

    const data = await response.json();
    return data.imageCount;
  } catch (error) {
    console.error('Error fetching image count:', error);
    throw error;
  }
}

/**
 * Convert File to Base64 string
 * @param {File} file - File to convert
 * @returns {Promise<string>} - Base64 encoded file data
 */
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
}

/**
 * Validate image file
 * @param {File} file - File to validate
 * @returns {Object} - {isValid: boolean, error: string or null}
 */
export function validateImageFile(file) {
  const MAX_SIZE = 5 * 1024 * 1024; // 5MB
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

  if (!file) {
    return { isValid: false, error: 'No file selected' };
  }

  if (file.size > MAX_SIZE) {
    return { isValid: false, error: `File size exceeds 5MB limit (${(file.size / 1024 / 1024).toFixed(2)}MB)` };
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return { isValid: false, error: `File type not supported. Allowed: ${ALLOWED_TYPES.join(', ')}` };
  }

  return { isValid: true, error: null };
}

/**
 * Get image data URL from ResourceImage object
 * @param {Object} resourceImage - ResourceImage object from API
 * @returns {string} - Data URL for displaying image
 */
export function getImageDataUrl(resourceImage) {
  if (!resourceImage || !resourceImage.imageData || !resourceImage.mimeType) {
    return null;
  }
  return `data:${resourceImage.mimeType};base64,${resourceImage.imageData}`;
}
