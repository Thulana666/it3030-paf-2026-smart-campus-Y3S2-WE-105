import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../../context/AuthContext';
import * as resourceService from '../../services/resourceService';

const Facilities = () => {
  const { user } = useContext(AuthContext);
  const [view, setView] = useState('list'); // list, create, or edit
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [selectedImageModal, setSelectedImageModal] = useState(null);
  const [editingResourceId, setEditingResourceId] = useState(null);
  
  const isAdmin = user?.role === 'ADMIN';

  // Form state
  const [formData, setFormData] = useState({
    resourceCode: '',
    name: '',
    type: 'Facility',
    category: 'Hall',
    capacity: '',
    building: '',
    floor: '',
    location: '',
    availabilityStartTime: '08:00',
    availabilityEndTime: '18:00',
    description: '',
    status: 'ACTIVE',
    imageUrl: ''
  });

  const [imagePreview, setImagePreview] = useState(null);
  const [statusChangeResource, setStatusChangeResource] = useState(null);

  // Load resources
  useEffect(() => {
    loadResources();
  }, []);

  const loadResources = async () => {
    try {
      setLoading(true);
      const data = isAdmin ? await resourceService.getAllResources() : await resourceService.getActiveResources();
      setResources(data);
    } catch (err) {
      console.error('Error loading resources:', err);
      setMessage({ type: 'error', text: 'Failed to load resources' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setMessage({ type: 'error', text: 'Image size must be less than 5MB' });
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        setMessage({ type: 'error', text: 'Please select a valid image file' });
        return;
      }

      // Convert to base64
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          imageUrl: reader.result
        }));
        setImagePreview(reader.result);
        setMessage({ type: '', text: '' });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isAdmin) {
      setMessage({ type: 'error', text: 'Only admins can manage resources' });
      return;
    }

    try {
      setLoading(true);
      const resourceData = {
        ...formData,
        capacity: parseInt(formData.capacity)
      };

      if (view === 'edit' && editingResourceId) {
        // Update existing resource
        await resourceService.updateResource(editingResourceId, resourceData);
        setMessage({ type: 'success', text: 'Resource updated successfully!' });
      } else {
        // Create new resource
        await resourceService.createResource(resourceData);
        setMessage({ type: 'success', text: 'Resource created successfully!' });
      }

      setFormData({
        resourceCode: '',
        name: '',
        type: 'Facility',
        category: 'Hall',
        capacity: '',
        building: '',
        floor: '',
        location: '',
        availabilityStartTime: '08:00',
        availabilityEndTime: '18:00',
        description: '',
        status: 'ACTIVE',
        imageUrl: ''
      });
      setImagePreview(null);
      setEditingResourceId(null);

      // Reload resources
      await loadResources();
      setView('list');
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to save resource';
      setMessage({ type: 'error', text: errorMsg });
      console.error('Error saving resource:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (resource) => {
    setFormData({
      resourceCode: resource.resourceCode,
      name: resource.name,
      type: resource.type,
      category: resource.category,
      capacity: resource.capacity.toString(),
      building: resource.building,
      floor: resource.floor,
      location: resource.location,
      availabilityStartTime: resource.availabilityStartTime,
      availabilityEndTime: resource.availabilityEndTime,
      description: resource.description,
      status: resource.status,
      imageUrl: resource.imageUrl || ''
    });
    if (resource.imageUrl) {
      setImagePreview(resource.imageUrl);
    }
    setEditingResourceId(resource.id);
    setView('edit');
    setMessage({ type: '', text: '' });
  };

  const handleDelete = async (resourceId, resourceName) => {
    if (window.confirm(`Are you sure you want to permanently delete "${resourceName}"? This action cannot be undone.`)) {
      try {
        setLoading(true);
        await resourceService.hardDeleteResource(resourceId);
        setMessage({ type: 'success', text: 'Resource permanently deleted!' });
        await loadResources();
      } catch (err) {
        const errorMsg = err.response?.data?.error || 'Failed to delete resource';
        setMessage({ type: 'error', text: errorMsg });
        console.error('Error deleting resource:', err);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleChangeStatus = async (resourceId, newStatus) => {
    try {
      setLoading(true);
      await resourceService.changeResourceStatus(resourceId, newStatus);
      setMessage({ type: 'success', text: `Status changed to ${newStatus}` });
      setStatusChangeResource(null);
      await loadResources();
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to change status';
      setMessage({ type: 'error', text: errorMsg });
      console.error('Error changing status:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ACTIVE':
        return 'rgba(16, 185, 129, 0.1)';
      case 'UNDER_MAINTENANCE':
        return 'rgba(245, 158, 11, 0.1)';
      case 'OUT_OF_SERVICE':
        return 'rgba(239, 68, 68, 0.1)';
      case 'INACTIVE':
        return 'rgba(107, 114, 128, 0.1)';
      default:
        return 'rgba(99, 102, 241, 0.1)';
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'ACTIVE':
        return '#10b981';
      case 'UNDER_MAINTENANCE':
        return '#f59e0b';
      case 'OUT_OF_SERVICE':
        return '#ef4444';
      case 'INACTIVE':
        return '#6b7280';
      default:
        return '#6366f1';
    }
  };

  // Create/Edit View
  if ((view === 'create' || view === 'edit') && isAdmin) {
    return (
      <div className="glass" style={{ padding: '2rem', borderRadius: '15px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h1 style={{ color: 'var(--primary)' }}>
            {view === 'edit' ? 'Edit Resource' : 'Create New Resource'}
          </h1>
          <button 
            onClick={() => {
              setView('list');
              setEditingResourceId(null);
              setFormData({
                resourceCode: '',
                name: '',
                type: 'Facility',
                category: 'Hall',
                capacity: '',
                building: '',
                floor: '',
                location: '',
                availabilityStartTime: '08:00',
                availabilityEndTime: '18:00',
                description: '',
                status: 'ACTIVE',
                imageUrl: ''
              });
              setImagePreview(null);
            }}
            className="btn btn-outline"
            style={{ padding: '0.5rem 1rem' }}
          >
            ← Back
          </button>
        </div>

        {message.text && (
          <div style={{
            padding: '1rem',
            borderRadius: '8px',
            marginBottom: '1.5rem',
            background: message.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            color: message.type === 'success' ? '#10b981' : '#ef4444',
            border: `1px solid ${message.type === 'success' ? '#10b981' : '#ef4444'}`
          }}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1.5rem' }}>
          {/* Resource Code & Name */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: 'var(--text-dark)' }}>
                Resource Code *
              </label>
              <input
                type="text"
                name="resourceCode"
                value={formData.resourceCode}
                onChange={handleInputChange}
                placeholder="e.g., LAB-001"
                required
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid rgba(99, 102, 241, 0.2)',
                  borderRadius: '8px',
                  background: 'rgba(255,255,255,0.5)',
                  fontSize: '0.95rem'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: 'var(--text-dark)' }}>
                Resource Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g., Computer Lab A"
                required
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid rgba(99, 102, 241, 0.2)',
                  borderRadius: '8px',
                  background: 'rgba(255,255,255,0.5)',
                  fontSize: '0.95rem'
                }}
              />
            </div>
          </div>

          {/* Type & Category */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: 'var(--text-dark)' }}>
                Resource Type *
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                required
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid rgba(99, 102, 241, 0.2)',
                  borderRadius: '8px',
                  background: 'rgba(255,255,255,0.5)',
                  fontSize: '0.95rem'
                }}
              >
                <option value="Facility">Facility</option>
                <option value="Equipment">Equipment</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: 'var(--text-dark)' }}>
                Category *
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                required
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid rgba(99, 102, 241, 0.2)',
                  borderRadius: '8px',
                  background: 'rgba(255,255,255,0.5)',
                  fontSize: '0.95rem'
                }}
              >
                <option value="Lab">Lab</option>
                <option value="Hall">Hall</option>
                <option value="Projector">Projector</option>
                <option value="Classroom">Classroom</option>
                <option value="Conference Room">Conference Room</option>
                <option value="Library">Library</option>
                <option value="Auditorium">Auditorium</option>
                <option value="Sports">Sports</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {/* Capacity & Building */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: 'var(--text-dark)' }}>
                Capacity *
              </label>
              <input
                type="number"
                name="capacity"
                value={formData.capacity}
                onChange={handleInputChange}
                placeholder="e.g., 50"
                min="1"
                required
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid rgba(99, 102, 241, 0.2)',
                  borderRadius: '8px',
                  background: 'rgba(255,255,255,0.5)',
                  fontSize: '0.95rem'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: 'var(--text-dark)' }}>
                Building *
              </label>
              <input
                type="text"
                name="building"
                value={formData.building}
                onChange={handleInputChange}
                placeholder="e.g., Block A"
                required
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid rgba(99, 102, 241, 0.2)',
                  borderRadius: '8px',
                  background: 'rgba(255,255,255,0.5)',
                  fontSize: '0.95rem'
                }}
              />
            </div>
          </div>

          {/* Floor & Location */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: 'var(--text-dark)' }}>
                Floor *
              </label>
              <input
                type="text"
                name="floor"
                value={formData.floor}
                onChange={handleInputChange}
                placeholder="e.g., 1st Floor"
                required
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid rgba(99, 102, 241, 0.2)',
                  borderRadius: '8px',
                  background: 'rgba(255,255,255,0.5)',
                  fontSize: '0.95rem'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: 'var(--text-dark)' }}>
                Location *
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                placeholder="e.g., Room 101"
                required
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid rgba(99, 102, 241, 0.2)',
                  borderRadius: '8px',
                  background: 'rgba(255,255,255,0.5)',
                  fontSize: '0.95rem'
                }}
              />
            </div>
          </div>

          {/* Availability Times */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: 'var(--text-dark)' }}>
                Start Time *
              </label>
              <input
                type="time"
                name="availabilityStartTime"
                value={formData.availabilityStartTime}
                onChange={handleInputChange}
                required
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid rgba(99, 102, 241, 0.2)',
                  borderRadius: '8px',
                  background: 'rgba(255,255,255,0.5)',
                  fontSize: '0.95rem'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: 'var(--text-dark)' }}>
                End Time *
              </label>
              <input
                type="time"
                name="availabilityEndTime"
                value={formData.availabilityEndTime}
                onChange={handleInputChange}
                required
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid rgba(99, 102, 241, 0.2)',
                  borderRadius: '8px',
                  background: 'rgba(255,255,255,0.5)',
                  fontSize: '0.95rem'
                }}
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: 'var(--text-dark)' }}>
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Add resource details..."
              rows="4"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid rgba(99, 102, 241, 0.2)',
                borderRadius: '8px',
                background: 'rgba(255,255,255,0.5)',
                fontSize: '0.95rem',
                fontFamily: 'inherit',
                resize: 'vertical'
              }}
            />
          </div>

          {/* Image Upload */}
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: 'var(--text-dark)' }}>
              Add Image
            </label>
            <div style={{
              border: '2px dashed rgba(99, 102, 241, 0.3)',
              borderRadius: '8px',
              padding: '2rem',
              textAlign: 'center',
              background: 'rgba(99, 102, 241, 0.05)',
              cursor: 'pointer',
              transition: 'all 0.3s'
            }}
            onDragOver={(e) => {
              e.preventDefault();
              e.currentTarget.style.borderColor = 'var(--primary-color)';
              e.currentTarget.style.background = 'rgba(99, 102, 241, 0.1)';
            }}
            onDragLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.3)';
              e.currentTarget.style.background = 'rgba(99, 102, 241, 0.05)';
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.3)';
              e.currentTarget.style.background = 'rgba(99, 102, 241, 0.05)';
              if (e.dataTransfer.files[0]) {
                handleImageChange({ target: { files: e.dataTransfer.files } });
              }
            }}
            >
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                style={{ display: 'none' }}
                id="imageInput"
              />
              <label htmlFor="imageInput" style={{ cursor: 'pointer', display: 'block' }}>
                <div style={{ color: 'var(--primary-color)', fontSize: '2rem', marginBottom: '0.5rem' }}>
                  📸
                </div>
                <p style={{ margin: '0.5rem 0', color: 'var(--text-dark)', fontWeight: '600' }}>
                  Click to upload or drag and drop
                </p>
                <p style={{ margin: '0.5rem 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  PNG, JPG, GIF up to 5MB
                </p>
              </label>
            </div>

            {imagePreview && (
              <div style={{
                marginTop: '1rem',
                borderRadius: '8px',
                overflow: 'hidden',
                border: '1px solid rgba(99, 102, 241, 0.2)',
                background: 'rgba(255,255,255,0.5)'
              }}>
                <img 
                  src={imagePreview} 
                  alt="Preview" 
                  style={{
                    width: '100%',
                    maxHeight: '300px',
                    objectFit: 'cover',
                    borderRadius: '8px'
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    setImagePreview(null);
                    setFormData(prev => ({ ...prev, imageUrl: '' }));
                    document.getElementById('imageInput').value = '';
                  }}
                  style={{
                    display: 'block',
                    margin: '0.75rem auto',
                    padding: '0.4rem 1rem',
                    background: 'rgba(239, 68, 68, 0.1)',
                    color: '#ef4444',
                    border: '1px solid #ef4444',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    fontWeight: '600'
                  }}
                  onMouseEnter={(e) => e.target.style.background = 'rgba(239, 68, 68, 0.2)'}
                  onMouseLeave={(e) => e.target.style.background = 'rgba(239, 68, 68, 0.1)'}
                >
                  Remove Image
                </button>
              </div>
            )}
          </div>

          {/* Status */}
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: 'var(--text-dark)' }}>
              Initial Status *
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid rgba(99, 102, 241, 0.2)',
                borderRadius: '8px',
                background: 'rgba(255,255,255,0.5)',
                fontSize: '0.95rem'
              }}
            >
              <option value="ACTIVE">ACTIVE</option>
              <option value="UNDER_MAINTENANCE">UNDER_MAINTENANCE</option>
              <option value="OUT_OF_SERVICE">OUT_OF_SERVICE</option>
            </select>
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ flex: 1, padding: '0.75rem' }}
            >
              {loading ? (view === 'edit' ? 'Updating...' : 'Creating...') : (view === 'edit' ? 'Update Resource' : 'Create Resource')}
            </button>
            <button
              type="button"
              onClick={() => {
                setView('list');
                setEditingResourceId(null);
                setFormData({
                  resourceCode: '',
                  name: '',
                  type: 'Facility',
                  category: 'Hall',
                  capacity: '',
                  building: '',
                  floor: '',
                  location: '',
                  availabilityStartTime: '08:00',
                  availabilityEndTime: '18:00',
                  description: '',
                  status: 'ACTIVE',
                  imageUrl: ''
                });
                setImagePreview(null);
              }}
              className="btn btn-outline"
              style={{ flex: 1, padding: '0.75rem' }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    );
  }

  // List View
  return (
    <div className="glass" style={{ padding: '2rem', borderRadius: '15px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ marginBottom: '0.5rem', color: 'var(--primary)' }}>Campus Facilities</h1>
          <p style={{ color: 'var(--text-muted)' }}>
            Track the real-time availability and maintenance status of all campus infrastructure.
          </p>
        </div>
        {isAdmin && (
          <button 
            onClick={() => setView('create')}
            className="btn btn-primary"
            style={{ padding: '0.75rem 1.5rem' }}
          >
            + Add Resource
          </button>
        )}
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
          Loading resources...
        </div>
      )}

      {!loading && resources.length === 0 && (
        <div className="empty-state" style={{ background: 'rgba(255,255,255,0.4)', borderRadius: '15px' }}>
          <h3 style={{ color: 'var(--text-dark)' }}>No Resources Found</h3>
          <p style={{ marginTop: '0.5rem' }}>
            {isAdmin ? 'Create the first resource to get started.' : 'Check back later for available resources.'}
          </p>
        </div>
      )}

      {!loading && resources.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
          {resources.map(resource => (
            <div 
              key={resource.id} 
              className="card" 
              style={{
                background: getStatusColor(resource.status),
                borderRadius: '12px',
                overflow: 'hidden',
                border: '1px solid rgba(99, 102, 241, 0.1)',
                transition: 'transform 0.2s'
              }}
            >
              {resource.imageUrl ? (
                <div
                  onClick={() => setSelectedImageModal(resource)}
                  style={{
                    position: 'relative',
                    width: '100%',
                    height: '200px',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    background: 'rgba(0,0,0,0.05)',
                    borderBottom: '1px solid rgba(99, 102, 241, 0.1)',
                    transition: 'transform 0.3s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <img 
                    src={resource.imageUrl} 
                    alt={resource.name}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.parentElement.innerHTML = `
                        <div style="display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; background: linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%);">
                          <div style="text-align: center;">
                            <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">🏢</div>
                            <p style="margin: 0; color: rgba(99, 102, 241, 0.6); font-size: 0.9rem;">No Image</p>
                          </div>
                        </div>
                      `;
                    }}
                  />
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: 0,
                    transition: 'opacity 0.3s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = '0'}
                  >
                    <div style={{
                      background: 'rgba(99, 102, 241, 0.9)',
                      color: 'white',
                      padding: '0.5rem 1rem',
                      borderRadius: '6px',
                      fontSize: '0.9rem',
                      fontWeight: '600'
                    }}>
                      🔍 View Full Image
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    position: 'relative',
                    width: '100%',
                    height: '200px',
                    background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)',
                    borderBottom: '1px solid rgba(99, 102, 241, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'column',
                    cursor: 'default'
                  }}
                >
                  <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🏢</div>
                  <p style={{ margin: 0, color: 'rgba(99, 102, 241, 0.6)', fontSize: '0.9rem', fontWeight: '500' }}>
                    No Image Added
                  </p>
                </div>
              )}
              
              <div style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.75rem' }}>
                  <div>
                    <h3 style={{ margin: 0, color: 'var(--text-dark)', fontSize: '1.2rem' }}>
                      {resource.name}
                    </h3>
                    <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                      Code: {resource.resourceCode}
                    </p>
                  </div>
                  <span 
                    className="badge"
                    style={{
                      background: getStatusBadgeColor(resource.status),
                      color: 'white',
                      padding: '0.4rem 0.8rem',
                      borderRadius: '20px',
                      fontSize: '0.8rem',
                      fontWeight: '600',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {resource.status}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem', fontSize: '0.9rem' }}>
                  <div>
                    <p style={{ margin: 0, color: 'var(--text-muted)' }}>Type</p>
                    <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-dark)', fontWeight: '500' }}>
                      {resource.type}
                    </p>
                  </div>
                  <div>
                    <p style={{ margin: 0, color: 'var(--text-muted)' }}>Category</p>
                    <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-dark)', fontWeight: '500' }}>
                      {resource.category}
                    </p>
                  </div>
                  <div>
                    <p style={{ margin: 0, color: 'var(--text-muted)' }}>Capacity</p>
                    <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-dark)', fontWeight: '500' }}>
                      {resource.capacity} persons
                    </p>
                  </div>
                  <div>
                    <p style={{ margin: 0, color: 'var(--text-muted)' }}>Hours</p>
                    <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-dark)', fontWeight: '500' }}>
                      {resource.availabilityStartTime} - {resource.availabilityEndTime}
                    </p>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid rgba(99, 102, 241, 0.1)', paddingTop: '1rem' }}>
                  <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    <strong>Location:</strong> {resource.building}, {resource.floor}, {resource.location}
                  </p>
                </div>

                {resource.description && (
                  <p style={{
                    margin: '0.75rem 0 0 0',
                    color: 'var(--text-muted)',
                    fontSize: '0.9rem',
                    lineHeight: '1.4'
                  }}>
                    {resource.description}
                  </p>
                )}

                {/* Admin Actions - Edit, Status Change & Delete Buttons */}
                {isAdmin && (
                  <div style={{
                    display: 'flex',
                    gap: '0.75rem',
                    marginTop: '1rem',
                    paddingTop: '1rem',
                    borderTop: '1px solid rgba(99, 102, 241, 0.1)',
                    flexWrap: 'wrap'
                  }}>
                    <button
                      onClick={() => handleEdit(resource)}
                      style={{
                        flex: 1,
                        minWidth: '100px',
                        padding: '0.6rem 1rem',
                        background: 'rgba(99, 102, 241, 0.1)',
                        border: '1px solid rgba(99, 102, 241, 0.3)',
                        color: 'var(--primary-color)',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: '600',
                        fontSize: '0.9rem',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(99, 102, 241, 0.2)';
                        e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.5)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(99, 102, 241, 0.1)';
                        e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.3)';
                      }}
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => setStatusChangeResource(resource)}
                      style={{
                        flex: 1,
                        minWidth: '100px',
                        padding: '0.6rem 1rem',
                        background: 'rgba(245, 158, 11, 0.1)',
                        border: '1px solid rgba(245, 158, 11, 0.3)',
                        color: '#f59e0b',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: '600',
                        fontSize: '0.9rem',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(245, 158, 11, 0.2)';
                        e.currentTarget.style.borderColor = 'rgba(245, 158, 11, 0.5)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(245, 158, 11, 0.1)';
                        e.currentTarget.style.borderColor = 'rgba(245, 158, 11, 0.3)';
                      }}
                    >
                      ⚙️ Status
                    </button>
                    <button
                      onClick={() => handleDelete(resource.id, resource.name)}
                      style={{
                        flex: 1,
                        minWidth: '100px',
                        padding: '0.6rem 1rem',
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        color: '#ef4444',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: '600',
                        fontSize: '0.9rem',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                        e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.5)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                        e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)';
                      }}
                    >
                      🗑️ Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Image Modal - Available for both Admin and User */}
      {selectedImageModal && (
        <div
          onClick={() => setSelectedImageModal(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'white',
              borderRadius: '15px',
              overflow: 'hidden',
              maxWidth: '90vw',
              maxHeight: '90vh',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {/* Close Button */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '1rem',
              borderBottom: '1px solid rgba(99, 102, 241, 0.1)',
              background: 'rgba(99, 102, 241, 0.05)'
            }}>
              <h2 style={{ margin: 0, color: 'var(--text-dark)' }}>
                {selectedImageModal.name}
              </h2>
              <button
                onClick={() => setSelectedImageModal(null)}
                style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: 'none',
                  color: '#ef4444',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  width: '40px',
                  height: '40px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
              >
                ✕
              </button>
            </div>

            {/* Image Container */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '2rem',
              background: '#f8f9fa',
              overflowY: 'auto',
              maxHeight: 'calc(90vh - 200px)'
            }}>
              <img
                src={selectedImageModal.imageUrl}
                alt={selectedImageModal.name}
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  borderRadius: '8px',
                  objectFit: 'contain'
                }}
              />
            </div>

            {/* Resource Info */}
            <div style={{
              padding: '1.5rem',
              borderTop: '1px solid rgba(99, 102, 241, 0.1)',
              background: 'white',
              maxHeight: '200px',
              overflowY: 'auto'
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>Resource Code</p>
                  <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-dark)', fontWeight: '600' }}>
                    {selectedImageModal.resourceCode}
                  </p>
                </div>
                <div>
                  <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>Type</p>
                  <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-dark)', fontWeight: '600' }}>
                    {selectedImageModal.type}
                  </p>
                </div>
                <div>
                  <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>Category</p>
                  <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-dark)', fontWeight: '600' }}>
                    {selectedImageModal.category}
                  </p>
                </div>
                <div>
                  <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>Capacity</p>
                  <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-dark)', fontWeight: '600' }}>
                    {selectedImageModal.capacity} persons
                  </p>
                </div>
                <div>
                  <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>Location</p>
                  <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-dark)', fontWeight: '600' }}>
                    {selectedImageModal.building}, {selectedImageModal.floor}
                  </p>
                </div>
                <div>
                  <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>Hours</p>
                  <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-dark)', fontWeight: '600' }}>
                    {selectedImageModal.availabilityStartTime} - {selectedImageModal.availabilityEndTime}
                  </p>
                </div>
              </div>

              {selectedImageModal.description && (
                <div>
                  <p style={{ margin: '0 0 0.5rem 0', color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: '600' }}>
                    Description
                  </p>
                  <p style={{ margin: 0, color: 'var(--text-dark)', fontSize: '0.9rem', lineHeight: '1.5' }}>
                    {selectedImageModal.description}
                  </p>
                </div>
              )}
            </div>

            {/* Close Button */}
            <div style={{
              padding: '1rem',
              borderTop: '1px solid rgba(99, 102, 241, 0.1)',
              background: 'rgba(99, 102, 241, 0.05)',
              display: 'flex',
              gap: '1rem'
            }}>
              <button
                onClick={() => setSelectedImageModal(null)}
                className="btn btn-primary"
                style={{ flex: 1 }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Change Modal - Admin Only */}
      {statusChangeResource && isAdmin && (
        <div
          onClick={() => setStatusChangeResource(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'white',
              borderRadius: '15px',
              overflow: 'hidden',
              maxWidth: '450px',
              width: '100%',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
            }}
          >
            {/* Header */}
            <div style={{
              padding: '1.5rem',
              borderBottom: '1px solid rgba(99, 102, 241, 0.1)',
              background: 'rgba(99, 102, 241, 0.05)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ margin: 0, color: 'var(--text-dark)' }}>
                  Change Status
                </h2>
                <button
                  onClick={() => setStatusChangeResource(null)}
                  style={{
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: 'none',
                    color: '#ef4444',
                    fontSize: '1.5rem',
                    cursor: 'pointer',
                    width: '40px',
                    height: '40px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                >
                  ✕
                </button>
              </div>
              <p style={{ margin: '0.5rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                {statusChangeResource.name}
              </p>
            </div>

            {/* Content */}
            <div style={{ padding: '2rem' }}>
              <p style={{ margin: '0 0 1.5rem 0', color: 'var(--text-dark)', fontWeight: '500' }}>
                Current Status: <span style={{ 
                  color: getStatusBadgeColor(statusChangeResource.status),
                  fontWeight: '600'
                }}>
                  {statusChangeResource.status}
                </span>
              </p>

              <p style={{ margin: '0 0 1rem 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                Select new status:
              </p>

              <div style={{ display: 'grid', gap: '0.75rem' }}>
                {['ACTIVE', 'UNDER_MAINTENANCE', 'OUT_OF_SERVICE'].map((status) => (
                  <button
                    key={status}
                    onClick={() => handleChangeStatus(statusChangeResource.id, status)}
                    disabled={loading}
                    style={{
                      padding: '1rem',
                      background: statusChangeResource.status === status ? 
                        'rgba(99, 102, 241, 0.15)' : 'rgba(99, 102, 241, 0.05)',
                      border: `2px solid ${statusChangeResource.status === status ? 
                        'rgba(99, 102, 241, 0.5)' : 'rgba(99, 102, 241, 0.2)'}`,
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: '600',
                      fontSize: '0.95rem',
                      color: 'var(--text-dark)',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      opacity: loading ? 0.6 : 1
                    }}
                    onMouseEnter={(e) => {
                      if (!loading) {
                        e.currentTarget.style.background = 'rgba(99, 102, 241, 0.2)';
                        e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.5)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = statusChangeResource.status === status ? 
                        'rgba(99, 102, 241, 0.15)' : 'rgba(99, 102, 241, 0.05)';
                      e.currentTarget.style.borderColor = statusChangeResource.status === status ? 
                        'rgba(99, 102, 241, 0.5)' : 'rgba(99, 102, 241, 0.2)';
                    }}
                  >
                    <span style={{ fontSize: '1.2rem' }}>
                      {status === 'ACTIVE' && '✅'}
                      {status === 'UNDER_MAINTENANCE' && '🔧'}
                      {status === 'OUT_OF_SERVICE' && '⛔'}
                    </span>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontWeight: '600', color: 'var(--text-dark)' }}>
                        {status}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                        {status === 'ACTIVE' && 'Resource is operational and available'}
                        {status === 'UNDER_MAINTENANCE' && 'Resource is under maintenance'}
                        {status === 'OUT_OF_SERVICE' && 'Resource is out of service'}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div style={{
              padding: '1rem',
              borderTop: '1px solid rgba(99, 102, 241, 0.1)',
              background: 'rgba(99, 102, 241, 0.02)',
              display: 'flex',
              gap: '1rem'
            }}>
              <button
                onClick={() => setStatusChangeResource(null)}
                className="btn btn-outline"
                style={{ flex: 1 }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Facilities;
