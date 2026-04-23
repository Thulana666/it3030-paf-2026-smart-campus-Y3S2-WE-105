import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import * as resourceService from '../../services/resourceService';
import * as assignmentService from '../../services/assignmentService';
import * as imageService from '../../services/imageService';
import ImageUploadModal from '../../components/ImageUploadModal';
import ImageGallery from '../../components/ImageGallery';

const Facilities = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [view, setView] = useState('list'); // list, create, edit, details, or assigned-repairs
  const [selectedResource, setSelectedResource] = useState(null);
  const [resources, setResources] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [assignedResourceMap, setAssignedResourceMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [selectedImageModal, setSelectedImageModal] = useState(null);
  const [editingResourceId, setEditingResourceId] = useState(null);
  const [showImageUploadModal, setShowImageUploadModal] = useState(false);

  const isAdmin = user?.role === 'ADMIN';
  const isTechnician = user?.role === 'TECHNICIAN';
  const isUser = user?.role === 'USER';
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [catalogueScope, setCatalogueScope] = useState(
    user?.role === 'TECHNICIAN' ? 'MAINTENANCE' : 'ALL'
  );

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
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [statusChangeResource, setStatusChangeResource] = useState(null);

  // Load resources
  useEffect(() => {
    if (isTechnician && view === 'assigned-repairs') {
      loadAssignedRepairs();
    } else {
      loadResources();
    }
  }, [user?.role, view]);

  const loadResources = async () => {
    try {
      setLoading(true);
      let data;

      if (isAdmin) {
        // Admin: View ALL resources
        data = await resourceService.getAllResources();
      } else if (isTechnician) {
        // Technician: View only maintenance resources
        data = await resourceService.getResourcesByStatus('UNDER_MAINTENANCE');
      } else {
        // User: View only ACTIVE resources
        data = await resourceService.getActiveResources();
      }
      const resourcesWithImages = await Promise.all(
        data.map(async (resource) => {
          if (resource.imageUrl) {
            return resource;
          }

          try {
            const images = await imageService.getResourceImages(resource.id);
            const displayImage = images.find((img) => img.isPrimary) || images[0];
            const primaryImageUrl = imageService.getImageDataUrl(displayImage);
            return {
              ...resource,
              imageUrl: primaryImageUrl || ''
            };
          } catch (imageError) {
            return resource;
          }
        })
      );

      setResources(resourcesWithImages);
    } catch (err) {
      console.error('Error loading resources:', err);
      setMessage({ type: 'error', text: 'Failed to load resources' });
    } finally {
      setLoading(false);
    }
  };

  const loadAssignedRepairs = async () => {
    try {
      setLoading(true);
      const assignmentsData = await assignmentService.getMyAssignments();
      setAssignments(assignmentsData);

      // Create a map for quick resource lookup
      const resourceMap = {};
      for (const assignment of assignmentsData) {
        try {
          const resource = await resourceService.getResourceById(assignment.resourceId);
          resourceMap[assignment.id] = resource;
        } catch (err) {
          console.log('Resource not found for assignment:', assignment.resourceId);
        }
      }
      setAssignedResourceMap(resourceMap);
    } catch (err) {
      console.error('Error loading assigned repairs:', err);
      setMessage({ type: 'error', text: 'Failed to load assigned repairs' });
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

      // Keep the original file for upload API and show preview
      setSelectedImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
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
        imageUrl: '',
        capacity: parseInt(formData.capacity)
      };

      let savedResource;
      if (view === 'edit' && editingResourceId) {
        // Update existing resource
        savedResource = await resourceService.updateResource(editingResourceId, resourceData);
        setMessage({ type: 'success', text: 'Resource updated successfully!' });
      } else {
        // Create new resource
        savedResource = await resourceService.createResource(resourceData);
        setMessage({ type: 'success', text: 'Resource created successfully!' });
      }

      if (selectedImageFile) {
        const createdResourceId = savedResource?.id || savedResource?.resourceId || savedResource?.data?.id;
        const targetResourceId = view === 'edit' && editingResourceId
          ? editingResourceId
          : createdResourceId;

        if (targetResourceId) {
          await imageService.uploadResourceImage(targetResourceId, selectedImageFile, '', true);
        }
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
      setSelectedImageFile(null);
      setEditingResourceId(null);

      // Reload resources
      await loadResources();
      setView('list');
    } catch (err) {
      const errorMsg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        'Failed to save resource';
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
    } else {
      setImagePreview(null);
    }
    setSelectedImageFile(null);
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

  useEffect(() => {
    if (isTechnician) {
      setCatalogueScope('MAINTENANCE');
      setStatusFilter('ALL');
      return;
    }

    setCatalogueScope('ALL');
    setStatusFilter('ALL');
  }, [isTechnician, user?.role]);

  const roleSummary = isAdmin
    ? 'Access the full resource catalogue, including inactive and maintenance items, plus management actions.'
    : isTechnician
      ? 'Review maintenance items and repair-related resources from a technician-focused catalogue view.'
      : 'Browse all active campus resources with details, capacity, location, availability, images, and live status.';

  const scopeOptions = isTechnician
    ? [
      { value: 'MAINTENANCE', label: 'Under Maintenance' },
      { value: 'ASSIGNED', label: 'Assigned Repairs' }
    ]
    : isAdmin
      ? [
        { value: 'ALL', label: 'All Resources' },
        { value: 'MANAGEMENT', label: 'Management View' }
      ]
      : [
        { value: 'ALL', label: 'Active Catalogue' }
      ];

  const filteredResources = resources.filter((resource) => {
    const isMaintenanceView = view === 'maintenance';

    if (isMaintenanceView) {
      if (isUser) {
        if (resource.status !== 'OUT_OF_SERVICE') {
          return false;
        }
      } else if (!['UNDER_MAINTENANCE', 'OUT_OF_SERVICE'].includes(resource.status)) {
        return false;
      }
    }

    if (isTechnician) {
      if (
        !isMaintenanceView &&
        catalogueScope === 'MAINTENANCE' &&
        !['UNDER_MAINTENANCE', 'OUT_OF_SERVICE'].includes(resource.status)
      ) {
        return false;
      }

      if (catalogueScope === 'ASSIGNED') {
        return false;
      }
    }

    if (isUser && !isMaintenanceView && resource.status !== 'ACTIVE') {
      return false;
    }

    if (statusFilter !== 'ALL' && resource.status !== statusFilter) {
      return false;
    }

    const searchableText = [
      resource.name,
      resource.resourceCode,
      resource.category,
      resource.type,
      resource.building,
      resource.floor,
      resource.location,
      resource.status
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    return searchableText.includes(searchTerm.trim().toLowerCase());
  });

  const emptyStateTitle = view === 'maintenance'
    ? 'No Maintenance Resources Found'
    : isTechnician && catalogueScope === 'ASSIGNED'
    ? 'No Assigned Repair Resources'
    : 'No Resources Found';

  const emptyStateDescription = view === 'maintenance'
    ? isUser
      ? 'There are currently no out-of-service resources to display.'
      : 'No resources are currently marked under maintenance or out of service.'
    : isTechnician && catalogueScope === 'ASSIGNED'
    ? 'Assigned repair-linked resources will appear here once incident assignment is connected to the catalogue.'
    : isAdmin
      ? 'Create the first resource to get started.'
      : isTechnician
        ? 'No maintenance resources matched the current filters.'
        : 'Check back later for available resources.';

  // Helper: format time nicely
  const formatTime = (timeStr) => {
    if (!timeStr) return 'N/A';
    try {
      const [h, m] = timeStr.split(':');
      const hour = parseInt(h, 10);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const display = hour % 12 || 12;
      return `${display}:${m} ${ampm}`;
    } catch {
      return timeStr;
    }
  };

  // Helper: calculate availability hours
  const getAvailabilityHours = (start, end) => {
    if (!start || !end) return null;
    try {
      const [sh, sm] = start.split(':').map(Number);
      const [eh, em] = end.split(':').map(Number);
      const diff = (eh * 60 + em) - (sh * 60 + sm);
      const hours = Math.floor(diff / 60);
      const mins = diff % 60;
      return mins > 0 ? `${hours}h ${mins}m` : `${hours} hours`;
    } catch {
      return null;
    }
  };

  // Helper: check if resource is currently available (by time)
  const isCurrentlyAvailable = (resource) => {
    if (resource.status !== 'ACTIVE') return false;
    if (!resource.availabilityStartTime || !resource.availabilityEndTime) return true;
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const [sh, sm] = resource.availabilityStartTime.split(':').map(Number);
    const [eh, em] = resource.availabilityEndTime.split(':').map(Number);
    const startMin = sh * 60 + sm;
    const endMin = eh * 60 + em;
    return currentMinutes >= startMin && currentMinutes <= endMin;
  };

  // Navigate to details view
  const handleViewDetails = (resource) => {
    setSelectedResource(resource);
    setView('details');
    setMessage({ type: '', text: '' });
  };

  // ─── RESOURCE DETAILS VIEW ─────────────────────────────────────────────────
  if (view === 'details' && selectedResource) {
    const r = selectedResource;
    const available = isCurrentlyAvailable(r);
    const totalHours = getAvailabilityHours(r.availabilityStartTime, r.availabilityEndTime);

    // Calculate timeline percentage for availability bar
    const getTimePercent = (timeStr) => {
      if (!timeStr) return 0;
      const [h, m] = timeStr.split(':').map(Number);
      return ((h * 60 + m) / (24 * 60)) * 100;
    };
    const startPercent = getTimePercent(r.availabilityStartTime);
    const endPercent = getTimePercent(r.availabilityEndTime);
    const nowPercent = (() => {
      const now = new Date();
      return ((now.getHours() * 60 + now.getMinutes()) / (24 * 60)) * 100;
    })();

    return (
      <div style={{ animation: 'slideUp 0.4s ease backwards' }}>
        {/* Back Navigation */}
        <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            onClick={() => {
              setView('list');
              setSelectedResource(null);
            }}
            className="btn btn-outline"
            style={{
              padding: '0.6rem 1.2rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              borderColor: 'var(--primary-color)',
              color: 'var(--primary-color)',
              fontWeight: '600',
              borderRadius: '10px'
            }}
          >
            ← Back to Resources
          </button>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Resource Details
          </span>
        </div>

        {/* Hero Image Section */}
        <div
          className="glass"
          style={{
            borderRadius: '20px',
            overflow: 'hidden',
            marginBottom: '1.5rem',
            position: 'relative'
          }}
        >
          {r.imageUrl ? (
            <div
              style={{
                position: 'relative',
                width: '100%',
                height: '360px',
                cursor: 'pointer',
                overflow: 'hidden'
              }}
              onClick={() => setSelectedImageModal(r)}
            >
              <img
                src={r.imageUrl}
                alt={r.name}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  transition: 'transform 0.5s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.03)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              />
              {/* Gradient overlay */}
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: '50%',
                background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%)',
                pointerEvents: 'none'
              }} />
              {/* Overlay content */}
              <div style={{
                position: 'absolute',
                bottom: '1.5rem',
                left: '2rem',
                right: '2rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-end'
              }}>
                <div>
                  <h1 style={{ margin: 0, color: 'white', fontSize: '2rem', textShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
                    {r.name}
                  </h1>
                  <p style={{ margin: '0.3rem 0 0 0', color: 'rgba(255,255,255,0.85)', fontSize: '1rem' }}>
                    {r.resourceCode} • {r.type} • {r.category}
                  </p>
                </div>
                <div style={{
                  background: 'rgba(255,255,255,0.15)',
                  backdropFilter: 'blur(10px)',
                  padding: '0.5rem 1rem',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '0.85rem',
                  fontWeight: '500'
                }}>
                  🔍 Click to enlarge
                </div>
              </div>
            </div>
          ) : (
            <div
              style={{
                width: '100%',
                height: '280px',
                background: 'linear-gradient(135deg, rgba(79,70,229,0.08) 0%, rgba(139,92,246,0.12) 50%, rgba(59,130,246,0.08) 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                position: 'relative'
              }}
            >
              <div style={{ fontSize: '4rem', marginBottom: '1rem', opacity: 0.6 }}>🏢</div>
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '1.1rem', fontWeight: '500' }}>
                No Image Available
              </p>
              <div style={{ position: 'absolute', bottom: '1.5rem', left: '2rem' }}>
                <h1 style={{ margin: 0, color: 'var(--text-dark)', fontSize: '2rem' }}>{r.name}</h1>
                <p style={{ margin: '0.3rem 0 0 0', color: 'var(--text-muted)', fontSize: '1rem' }}>
                  {r.resourceCode} • {r.type} • {r.category}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Main Content Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
          {/* Left Column - Info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Status & Availability Card */}
            <div className="glass" style={{ padding: '2rem', borderRadius: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ margin: 0, color: 'var(--text-dark)', fontSize: '1.3rem' }}>Status & Availability</h2>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem'
                }}>
                  {/* Animated status dot */}
                  <span style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    background: getStatusBadgeColor(r.status),
                    display: 'inline-block',
                    boxShadow: r.status === 'ACTIVE' ? `0 0 8px ${getStatusBadgeColor(r.status)}` : 'none',
                    animation: r.status === 'ACTIVE' ? 'pulse-glow 2s infinite' : 'none'
                  }} />
                  <span style={{
                    background: getStatusBadgeColor(r.status),
                    color: 'white',
                    padding: '0.4rem 1rem',
                    borderRadius: '20px',
                    fontSize: '0.85rem',
                    fontWeight: '700',
                    letterSpacing: '0.5px'
                  }}>
                    {r.status}
                  </span>
                </div>
              </div>

              {/* Live Availability Indicator */}
              <div style={{
                padding: '1.25rem',
                borderRadius: '12px',
                background: available
                  ? 'linear-gradient(135deg, rgba(16,185,129,0.08) 0%, rgba(52,211,153,0.12) 100%)'
                  : 'linear-gradient(135deg, rgba(239,68,68,0.08) 0%, rgba(248,113,113,0.12) 100%)',
                border: `1px solid ${available ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
                marginBottom: '1.5rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '1.5rem' }}>{available ? '✅' : '❌'}</span>
                  <div>
                    <p style={{
                      margin: 0,
                      fontWeight: '700',
                      fontSize: '1.1rem',
                      color: available ? '#059669' : '#dc2626'
                    }}>
                      {available ? 'Currently Available' : 'Not Available Right Now'}
                    </p>
                    <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      {r.status !== 'ACTIVE'
                        ? `This resource is ${r.status.replace(/_/g, ' ').toLowerCase()}`
                        : available
                          ? 'This resource is within its operating hours'
                          : 'Outside of scheduled availability hours'
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* Availability Schedule Timeline */}
              <div>
                <p style={{ margin: '0 0 0.75rem 0', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Daily Availability Schedule
                </p>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '0.5rem'
                }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-dark)' }}>
                    {formatTime(r.availabilityStartTime)}
                  </span>
                  {totalHours && (
                    <span style={{
                      fontSize: '0.8rem',
                      background: 'rgba(99,102,241,0.1)',
                      color: 'var(--primary-color)',
                      padding: '0.2rem 0.6rem',
                      borderRadius: '6px',
                      fontWeight: '600'
                    }}>
                      ⏱ {totalHours}
                    </span>
                  )}
                  <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-dark)' }}>
                    {formatTime(r.availabilityEndTime)}
                  </span>
                </div>
                {/* Visual Timeline Bar */}
                <div style={{
                  position: 'relative',
                  height: '12px',
                  background: 'rgba(99,102,241,0.08)',
                  borderRadius: '6px',
                  overflow: 'visible'
                }}>
                  <div style={{
                    position: 'absolute',
                    left: `${startPercent}%`,
                    width: `${endPercent - startPercent}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #4f46e5, #7c3aed, #4f46e5)',
                    borderRadius: '6px',
                    transition: 'all 0.3s'
                  }} />
                  {/* Current time marker */}
                  <div style={{
                    position: 'absolute',
                    left: `${nowPercent}%`,
                    top: '-4px',
                    width: '4px',
                    height: '20px',
                    background: '#ef4444',
                    borderRadius: '2px',
                    boxShadow: '0 0 6px rgba(239,68,68,0.4)',
                    transition: 'left 0.3s'
                  }} />
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginTop: '0.4rem',
                  fontSize: '0.7rem',
                  color: 'var(--text-muted)'
                }}>
                  <span>12 AM</span>
                  <span>6 AM</span>
                  <span>12 PM</span>
                  <span>6 PM</span>
                  <span>12 AM</span>
                </div>
              </div>
            </div>

            {/* Resource Information Card */}
            <div className="glass" style={{ padding: '2rem', borderRadius: '16px' }}>
              <h2 style={{ margin: '0 0 1.5rem 0', color: 'var(--text-dark)', fontSize: '1.3rem' }}>
                Resource Information
              </h2>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '1.25rem'
              }}>
                {[
                  { icon: '🏷️', label: 'Resource Code', value: r.resourceCode },
                  { icon: '📦', label: 'Type', value: r.type },
                  { icon: '📁', label: 'Category', value: r.category },
                  { icon: '👥', label: 'Capacity', value: `${r.capacity} persons` },
                  { icon: '🏢', label: 'Building', value: r.building },
                  { icon: '🏗️', label: 'Floor', value: r.floor },
                  { icon: '📍', label: 'Location', value: r.location },
                  { icon: '📅', label: 'Created', value: r.createdAt ? new Date(r.createdAt).toLocaleDateString() : 'N/A' },
                  { icon: '🔄', label: 'Last Updated', value: r.updatedAt ? new Date(r.updatedAt).toLocaleDateString() : 'N/A' },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '1rem',
                      background: 'rgba(99,102,241,0.03)',
                      borderRadius: '12px',
                      border: '1px solid rgba(99,102,241,0.06)',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(99,102,241,0.07)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(99,102,241,0.08)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(99,102,241,0.03)';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div style={{ fontSize: '1.3rem', marginBottom: '0.4rem' }}>{item.icon}</div>
                    <p style={{
                      margin: 0,
                      color: 'var(--text-muted)',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      marginBottom: '0.25rem'
                    }}>
                      {item.label}
                    </p>
                    <p style={{
                      margin: 0,
                      color: 'var(--text-dark)',
                      fontWeight: '600',
                      fontSize: '0.95rem'
                    }}>
                      {item.value || 'N/A'}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Description Card */}
            <div className="glass" style={{ padding: '2rem', borderRadius: '16px' }}>
              <h2 style={{ margin: '0 0 1rem 0', color: 'var(--text-dark)', fontSize: '1.3rem' }}>
                Description
              </h2>
              {r.description ? (
                <div style={{
                  padding: '1.25rem',
                  background: 'rgba(99,102,241,0.03)',
                  borderRadius: '12px',
                  borderLeft: '4px solid var(--primary-color)'
                }}>
                  <p style={{
                    margin: 0,
                    color: 'var(--text-dark)',
                    fontSize: '1rem',
                    lineHeight: '1.7',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {r.description}
                  </p>
                </div>
              ) : (
                <p style={{ margin: 0, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  No description available for this resource.
                </p>
              )}
            </div>

            {/* Technician — Maintenance Details */}
            {isTechnician && (
              <div className="glass" style={{ padding: '2rem', borderRadius: '16px' }}>
                <h2 style={{ margin: '0 0 1.5rem 0', color: 'var(--text-dark)', fontSize: '1.3rem' }}>
                  🔧 Maintenance Details
                </h2>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '1rem'
                }}>
                  <div style={{
                    padding: '1.25rem',
                    background: r.status === 'UNDER_MAINTENANCE'
                      ? 'rgba(245,158,11,0.08)'
                      : r.status === 'OUT_OF_SERVICE'
                        ? 'rgba(239,68,68,0.08)'
                        : 'rgba(16,185,129,0.08)',
                    borderRadius: '12px',
                    border: `1px solid ${r.status === 'UNDER_MAINTENANCE' ? 'rgba(245,158,11,0.2)' : r.status === 'OUT_OF_SERVICE' ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)'}`,
                    textAlign: 'center'
                  }}>
                    <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Condition</p>
                    <p style={{ margin: '0.5rem 0 0', fontSize: '1.1rem', fontWeight: '700', color: getStatusBadgeColor(r.status) }}>
                      {r.status === 'UNDER_MAINTENANCE' ? 'Needs Repair' : r.status === 'OUT_OF_SERVICE' ? 'Non-Functional' : 'Operational'}
                    </p>
                  </div>
                  <div style={{
                    padding: '1.25rem',
                    background: 'rgba(59,130,246,0.08)',
                    borderRadius: '12px',
                    border: '1px solid rgba(59,130,246,0.2)',
                    textAlign: 'center'
                  }}>
                    <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Location Check</p>
                    <p style={{ margin: '0.5rem 0 0', fontSize: '1.1rem', fontWeight: '700', color: '#3b82f6' }}>
                      {r.building}, {r.floor}
                    </p>
                  </div>
                </div>
                {r.status === 'UNDER_MAINTENANCE' && (
                  <div style={{
                    marginTop: '1rem',
                    padding: '1rem',
                    background: 'rgba(245,158,11,0.05)',
                    borderRadius: '10px',
                    border: '1px solid rgba(245,158,11,0.15)'
                  }}>
                    <p style={{ margin: 0, color: '#d97706', fontWeight: '600', fontSize: '0.9rem' }}>
                      ⚠️ This resource is currently flagged for maintenance. Check the assigned repairs section for specific tasks.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column - Quick Actions & Summary */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Quick Info Summary Card */}
            <div className="glass" style={{ padding: '2rem', borderRadius: '16px' }}>
              <h3 style={{ margin: '0 0 1.25rem 0', color: 'var(--text-dark)', fontSize: '1.1rem' }}>
                Quick Summary
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {[
                  { icon: '🏷️', label: 'Code', value: r.resourceCode },
                  { icon: '📁', label: 'Category', value: r.category },
                  { icon: '👥', label: 'Capacity', value: `${r.capacity} persons` },
                  { icon: '📍', label: 'Location', value: `${r.building}, ${r.floor}` },
                  { icon: '🕐', label: 'Hours', value: `${formatTime(r.availabilityStartTime)} – ${formatTime(r.availabilityEndTime)}` },
                ].map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      background: 'rgba(99,102,241,0.08)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1rem',
                      flexShrink: 0
                    }}>
                      {item.icon}
                    </span>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600' }}>{item.label}</p>
                      <p style={{ margin: '0.15rem 0 0', fontSize: '0.9rem', color: 'var(--text-dark)', fontWeight: '500' }}>{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="glass" style={{ padding: '1.5rem', borderRadius: '16px' }}>
              <h3 style={{ margin: '0 0 1rem 0', color: 'var(--text-dark)', fontSize: '1.1rem' }}>
                Actions
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {/* USER: Book Resource / Check Availability */}
                {isUser && r.status === 'ACTIVE' && (
                  <button
                    className="btn btn-primary"
                    style={{
                      width: '100%',
                      padding: '0.85rem',
                      fontSize: '0.95rem',
                      borderRadius: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem'
                    }}
                    onClick={() => {
                      // Navigate to booking module (placeholder)
                      setMessage({ type: 'success', text: 'Redirecting to booking system...' });
                    }}
                  >
                    📅 Book This Resource
                  </button>
                )}

                {/* ADMIN: Edit, Change Status, Delete */}
                {isAdmin && (
                  <>
                    <button
                      onClick={() => handleEdit(r)}
                      style={{
                        width: '100%',
                        padding: '0.85rem',
                        background: 'rgba(99,102,241,0.1)',
                        border: '1px solid rgba(99,102,241,0.3)',
                        color: 'var(--primary-color)',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        fontWeight: '600',
                        fontSize: '0.95rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(99,102,241,0.18)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(99,102,241,0.1)'}
                    >
                      ✏️ Edit Resource
                    </button>
                    <button
                      onClick={() => setStatusChangeResource(r)}
                      style={{
                        width: '100%',
                        padding: '0.85rem',
                        background: 'rgba(245,158,11,0.1)',
                        border: '1px solid rgba(245,158,11,0.3)',
                        color: '#f59e0b',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        fontWeight: '600',
                        fontSize: '0.95rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(245,158,11,0.18)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(245,158,11,0.1)'}
                    >
                      ⚙️ Change Status
                    </button>
                    <button
                      onClick={() => handleDelete(r.id, r.name)}
                      style={{
                        width: '100%',
                        padding: '0.85rem',
                        background: 'rgba(239,68,68,0.1)',
                        border: '1px solid rgba(239,68,68,0.3)',
                        color: '#ef4444',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        fontWeight: '600',
                        fontSize: '0.95rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239,68,68,0.18)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
                    >
                      🗑️ Delete Resource
                    </button>
                  </>
                )}

                {/* TECHNICIAN: Request status */}
                {isTechnician && r.status === 'UNDER_MAINTENANCE' && (
                  <button
                    onClick={() => handleChangeStatus(r.id, 'ACTIVE')}
                    style={{
                      width: '100%',
                      padding: '0.85rem',
                      background: 'linear-gradient(135deg, #10b981, #059669)',
                      border: 'none',
                      color: 'white',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      fontWeight: '600',
                      fontSize: '0.95rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      transition: 'all 0.2s',
                      boxShadow: '0 4px 12px rgba(16,185,129,0.3)'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                  >
                    ✅ Request ACTIVE Status
                  </button>
                )}

                {/* Back button for all */}
                <button
                  onClick={() => {
                    setView('list');
                    setSelectedResource(null);
                  }}
                  className="btn btn-outline"
                  style={{
                    width: '100%',
                    padding: '0.85rem',
                    borderRadius: '10px',
                    fontSize: '0.95rem'
                  }}
                >
                  ← Back to List
                </button>
              </div>
            </div>

            {/* ADMIN: Usage Statistics (Optional) */}
            {isAdmin && (
              <div className="glass" style={{ padding: '2rem', borderRadius: '16px' }}>
                <h3 style={{ margin: '0 0 1.25rem 0', color: 'var(--text-dark)', fontSize: '1.1rem' }}>
                  📊 Usage Overview
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div style={{
                    padding: '1rem',
                    background: 'rgba(16,185,129,0.08)',
                    borderRadius: '12px',
                    textAlign: 'center'
                  }}>
                    <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700', color: '#10b981' }}>—</p>
                    <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600' }}>Total Bookings</p>
                  </div>
                  <div style={{
                    padding: '1rem',
                    background: 'rgba(99,102,241,0.08)',
                    borderRadius: '12px',
                    textAlign: 'center'
                  }}>
                    <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700', color: 'var(--primary-color)' }}>—</p>
                    <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600' }}>This Month</p>
                  </div>
                </div>
                <p style={{ margin: '1rem 0 0', fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center' }}>
                  Usage statistics will be available once booking data is connected.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Image Management Section - Full width below main content */}
        <div style={{ marginTop: '2rem' }}>
          {isAdmin && (
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.5rem'
            }}>
              <h2 style={{ margin: 0, color: 'var(--text-dark)', fontSize: '1.3rem' }}>
                📸 Resource Images
              </h2>
              <button
                onClick={() => setShowImageUploadModal(true)}
                style={{
                  padding: '0.65rem 1.25rem',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: 'none',
                  color: 'white',
                  borderRadius: '8px',
                  fontWeight: '600',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(102, 126, 234, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)';
                }}
              >
                + Upload Image
              </button>
            </div>
          )}
          <ImageGallery
            resourceId={r.id}
            isAdmin={isAdmin}
            onImageUpdate={() => loadResources()}
            onImageDelete={() => loadResources()}
          />
        </div>

        {/* Image Upload Modal */}
        <ImageUploadModal
          resourceId={r.id}
          isOpen={showImageUploadModal}
          onClose={() => setShowImageUploadModal(false)}
          onUploadSuccess={() => {
            setMessage({ type: 'success', text: 'Image uploaded successfully!' });
            loadResources();
          }}
        />

        {/* Inject pulse-glow animation */}
        <style>{`
          @keyframes pulse-glow {
            0%, 100% { opacity: 1; box-shadow: 0 0 8px currentColor; }
            50% { opacity: 0.5; box-shadow: 0 0 16px currentColor; }
          }
        `}</style>

        {/* Image Modal (reused from list view) */}
        {selectedImageModal && (
          <div
            onClick={() => setSelectedImageModal(null)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.85)',
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
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4)',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1rem 1.5rem',
                borderBottom: '1px solid rgba(99,102,241,0.1)',
                background: 'rgba(99,102,241,0.03)'
              }}>
                <h3 style={{ margin: 0, color: 'var(--text-dark)' }}>{selectedImageModal.name}</h3>
                <button
                  onClick={() => setSelectedImageModal(null)}
                  style={{
                    background: 'rgba(239,68,68,0.1)',
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
                >
                  ✕
                </button>
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '2rem',
                background: '#f8f9fa',
                maxHeight: 'calc(90vh - 120px)',
                overflow: 'auto'
              }}>
                <img
                  src={selectedImageModal.imageUrl}
                  alt={selectedImageModal.name}
                  style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: '8px', objectFit: 'contain' }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Status Change Modal */}
        {statusChangeResource && isAdmin && (
          <div
            onClick={() => setStatusChangeResource(null)}
            style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(0,0,0,0.6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 1000, padding: '1rem'
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                background: 'white', borderRadius: '15px', maxWidth: '450px', width: '100%',
                boxShadow: '0 20px 60px rgba(0,0,0,0.3)', overflow: 'hidden'
              }}
            >
              <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(99,102,241,0.1)', background: 'rgba(99,102,241,0.05)' }}>
                <h2 style={{ margin: 0, color: 'var(--text-dark)' }}>Change Status</h2>
                <p style={{ margin: '0.5rem 0 0', color: 'var(--text-muted)' }}>{statusChangeResource.name}</p>
              </div>
              <div style={{ padding: '2rem' }}>
                <p style={{ margin: '0 0 1.5rem', color: 'var(--text-dark)', fontWeight: '500' }}>
                  Current: <span style={{ color: getStatusBadgeColor(statusChangeResource.status), fontWeight: '600' }}>{statusChangeResource.status}</span>
                </p>
                <div style={{ display: 'grid', gap: '0.75rem' }}>
                  {['ACTIVE', 'UNDER_MAINTENANCE', 'OUT_OF_SERVICE'].map((status) => (
                    <button
                      key={status}
                      onClick={() => {
                        handleChangeStatus(statusChangeResource.id, status);
                        // Refresh the selected resource
                        setSelectedResource(prev => prev ? { ...prev, status } : prev);
                      }}
                      disabled={loading}
                      style={{
                        padding: '1rem', borderRadius: '8px', cursor: 'pointer',
                        fontWeight: '600', fontSize: '0.95rem', color: 'var(--text-dark)',
                        background: statusChangeResource.status === status ? 'rgba(99,102,241,0.15)' : 'rgba(99,102,241,0.05)',
                        border: `2px solid ${statusChangeResource.status === status ? 'rgba(99,102,241,0.5)' : 'rgba(99,102,241,0.2)'}`,
                        display: 'flex', alignItems: 'center', gap: '0.75rem',
                        opacity: loading ? 0.6 : 1, transition: 'all 0.2s'
                      }}
                    >
                      <span style={{ fontSize: '1.2rem' }}>
                        {status === 'ACTIVE' && '✅'}{status === 'UNDER_MAINTENANCE' && '🔧'}{status === 'OUT_OF_SERVICE' && '⛔'}
                      </span>
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontWeight: '600' }}>{status}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                          {status === 'ACTIVE' && 'Resource is operational'}
                          {status === 'UNDER_MAINTENANCE' && 'Under maintenance'}
                          {status === 'OUT_OF_SERVICE' && 'Out of service'}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ padding: '1rem', borderTop: '1px solid rgba(99,102,241,0.1)', display: 'flex' }}>
                <button onClick={() => setStatusChangeResource(null)} className="btn btn-outline" style={{ flex: 1 }}>Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

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
              setSelectedImageFile(null);
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
                    setSelectedImageFile(null);
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
                setSelectedImageFile(null);
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

  // Assigned Repairs View - Technician Only
  if (view === 'assigned-repairs' && isTechnician) {
    return (
      <div className="glass" style={{ padding: '2rem', borderRadius: '15px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ marginBottom: '0.5rem', color: 'var(--primary)' }}>📋 Assigned Repairs</h1>
            <p style={{ color: 'var(--text-muted)' }}>
              Track resources assigned to you for repair and maintenance.
            </p>
          </div>
          <button
            onClick={() => setView('list')}
            className="btn btn-outline"
            style={{
              padding: '0.75rem 1.5rem',
              borderColor: 'var(--primary-color)',
              color: 'var(--primary-color)'
            }}
          >
            ← Back to Maintenance
          </button>
        </div>

        {message.text && (
          <div style={{
            padding: '1rem',
            marginBottom: '1.5rem',
            borderRadius: '8px',
            background: message.type === 'success'
              ? 'rgba(34, 197, 94, 0.1)'
              : 'rgba(239, 68, 68, 0.1)',
            border: `1px solid ${message.type === 'success' ? '#22c55e' : '#ef4444'}`,
            color: message.type === 'success' ? '#22c55e' : '#ef4444'
          }}>
            {message.text}
          </div>
        )}

        {loading && (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
            Loading assigned repairs...
          </div>
        )}

        {!loading && assignments.length === 0 && (
          <div className="empty-state" style={{ background: 'rgba(255,255,255,0.4)', borderRadius: '15px' }}>
            <h3 style={{ color: 'var(--text-dark)' }}>No Assigned Repairs</h3>
            <p style={{ marginTop: '0.5rem' }}>
              You currently have no repair assignments. New assignments will appear here.
            </p>
          </div>
        )}

        {!loading && assignments.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '1.5rem' }}>
            {assignments.map(assignment => {
              const resource = assignedResourceMap[assignment.id];
              const getPriorityColor = (priority) => {
                switch (priority) {
                  case 'CRITICAL': return '#dc2626';
                  case 'HIGH': return '#ea580c';
                  case 'MEDIUM': return '#eab308';
                  case 'LOW': return '#3b82f6';
                  default: return '#6366f1';
                }
              };

              const getAssignmentStatusColor = (status) => {
                switch (status) {
                  case 'ASSIGNED': return '#e0e7ff';
                  case 'IN_PROGRESS': return '#fef3c7';
                  case 'COMPLETED': return '#d1fae5';
                  case 'CANCELLED': return '#f3f4f6';
                  default: return '#f3f4f6';
                }
              };

              return (
                <div
                  key={assignment.id}
                  className="card"
                  style={{
                    background: getAssignmentStatusColor(assignment.status),
                    borderRadius: '12px',
                    overflow: 'hidden',
                    border: '2px solid rgba(99, 102, 241, 0.1)',
                    transition: 'transform 0.2s, box-shadow 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  {/* Resource Image */}
                  {resource && resource.imageUrl ? (
                    <div
                      onClick={() => setSelectedImageModal(resource)}
                      style={{
                        position: 'relative',
                        width: '100%',
                        height: '180px',
                        overflow: 'hidden',
                        cursor: 'pointer',
                        background: 'rgba(0,0,0,0.05)',
                        borderBottom: '1px solid rgba(99, 102, 241, 0.2)'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                      onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                    >
                      <img
                        src={resource.imageUrl}
                        alt={resource.name}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                      />
                    </div>
                  ) : (
                    <div
                      style={{
                        width: '100%',
                        height: '180px',
                        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexDirection: 'column',
                        borderBottom: '1px solid rgba(99, 102, 241, 0.2)'
                      }}
                    >
                      <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🏢</div>
                      <p style={{ margin: 0, color: 'rgba(99, 102, 241, 0.6)', fontSize: '0.9rem' }}>
                        No Image
                      </p>
                    </div>
                  )}

                  {/* Content */}
                  <div style={{ padding: '1.5rem' }}>
                    {/* Header */}
                    <div style={{ marginBottom: '1rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                        <h3 style={{ margin: 0, color: 'var(--text-dark)', fontSize: '1.1rem' }}>
                          {resource?.name || 'Resource Not Found'}
                        </h3>
                        <span
                          style={{
                            background: getPriorityColor(assignment.priority),
                            color: 'white',
                            padding: '0.3rem 0.8rem',
                            borderRadius: '12px',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {assignment.priority}
                        </span>
                      </div>
                      <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                        Issue: {assignment.issueType}
                      </p>
                    </div>

                    {/* Description */}
                    <div style={{
                      background: 'rgba(255,255,255,0.5)',
                      padding: '0.75rem',
                      borderRadius: '8px',
                      marginBottom: '1rem',
                      borderLeft: '3px solid var(--primary-color)'
                    }}>
                      <p style={{ margin: 0, color: 'var(--text-dark)', fontSize: '0.9rem', lineHeight: '1.4' }}>
                        {assignment.description}
                      </p>
                    </div>

                    {/* Details Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem', fontSize: '0.85rem' }}>
                      <div>
                        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: '600' }}>STATUS</p>
                        <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-dark)', fontWeight: '500' }}>
                          {assignment.status}
                        </p>
                      </div>
                      <div>
                        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: '600' }}>DUE DATE</p>
                        <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-dark)', fontWeight: '500' }}>
                          {assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : 'Not set'}
                        </p>
                      </div>
                      {resource && (
                        <>
                          <div>
                            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: '600' }}>LOCATION</p>
                            <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-dark)', fontWeight: '500' }}>
                              {resource.building}
                            </p>
                          </div>
                          <div>
                            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: '600' }}>CAPACITY</p>
                            <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-dark)', fontWeight: '500' }}>
                              {resource.capacity} persons
                            </p>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Notes Section */}
                    {assignment.notes && (
                      <div style={{
                        background: 'rgba(99, 102, 241, 0.05)',
                        padding: '0.75rem',
                        borderRadius: '8px',
                        marginBottom: '1rem',
                        borderLeft: '3px solid #3b82f6'
                      }}>
                        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: '600', marginBottom: '0.25rem' }}>NOTES</p>
                        <p style={{ margin: 0, color: 'var(--text-dark)', fontSize: '0.9rem', lineHeight: '1.4' }}>
                          {assignment.notes}
                        </p>
                      </div>
                    )}

                    {/* Updates disabled */}
                    <div
                      style={{
                        padding: '0.75rem',
                        borderRadius: '10px',
                        background: 'rgba(99,102,241,0.06)',
                        border: '1px solid rgba(99,102,241,0.18)',
                        color: 'var(--text-muted)',
                        fontSize: '0.9rem',
                        fontWeight: 600
                      }}
                    >
                      Assignment updates are disabled.
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Image Modal for assigned repairs */}
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
              <div style={{ flex: 1, overflow: 'auto', background: '#000' }}>
                <img
                  src={selectedImageModal.imageUrl}
                  alt={selectedImageModal.name}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain'
                  }}
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              </div>
              <div style={{
                padding: '1rem',
                borderTop: '1px solid rgba(99, 102, 241, 0.1)',
                background: 'rgba(99, 102, 241, 0.05)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <button
                  onClick={() => setSelectedImageModal(null)}
                  className="btn btn-primary"
                  style={{ padding: '0.5rem 1.5rem' }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // List View
  if (
    view === 'list' ||
    view === 'maintenance' ||
    (!isTechnician && view !== 'assigned-repairs' && view !== 'create' && view !== 'edit')
  ) {
    const isMaintenanceView = view === 'maintenance';
    return (
      <div className="glass" style={{ padding: '2rem', borderRadius: '15px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ marginBottom: '0.5rem', color: 'var(--primary)' }}>
              {isMaintenanceView ? 'Resource Maintenance View' : 'Campus Facilities'}
            </h1>
            <p style={{ color: 'var(--text-muted)' }}>
              {isMaintenanceView
                ? (isUser
                  ? 'View resources currently out of service.'
                  : 'View damaged or maintenance resources and track repair status.')
                : roleSummary}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            {!isUser && (
              <button
                onClick={() => setView(isMaintenanceView ? 'list' : 'maintenance')}
                className="btn btn-outline"
                style={{
                  padding: '0.75rem 1.5rem',
                  borderColor: 'var(--primary-color)',
                  color: 'var(--primary-color)'
                }}
              >
                {isMaintenanceView ? '🏢 Facilities View' : '🛠️ Maintenance View'}
              </button>
            )}
            {isTechnician && (
              <button
                onClick={() => setView('assigned-repairs')}
                className="btn btn-outline"
                style={{
                  padding: '0.75rem 1.5rem',
                  borderColor: 'var(--primary-color)',
                  color: 'var(--primary-color)'
                }}
              >
                📋 My Assigned Repairs
              </button>
            )}
            {isMaintenanceView && (
              <button
                onClick={() => navigate('/dashboard/repair-progress')}
                className="btn btn-outline"
                style={{
                  padding: '0.75rem 1.5rem',
                  borderColor: 'var(--primary-color)',
                  color: 'var(--primary-color)'
                }}
              >
                🗂️ Repair Progress Records
              </button>
            )}
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
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1rem',
            marginBottom: '1.5rem',
            padding: '1rem',
            borderRadius: '12px',
            background: 'rgba(255, 255, 255, 0.35)',
            border: '1px solid rgba(99, 102, 241, 0.08)'
          }}
        >
          <div>
            <label style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600' }}>
              Search Resources
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Name, code, category, building..."
              style={{
                width: '100%',
                padding: '0.8rem 0.9rem',
                borderRadius: '8px',
                border: '1px solid rgba(99, 102, 241, 0.15)',
                background: 'rgba(255,255,255,0.7)',
                color: 'var(--text-dark)'
              }}
            />
          </div>

          {isAdmin && (
            <div>
              <label style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600' }}>
                Status Filter
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.8rem 0.9rem',
                  borderRadius: '8px',
                  border: '1px solid rgba(99, 102, 241, 0.15)',
                  background: 'rgba(255,255,255,0.7)',
                  color: 'var(--text-dark)'
                }}
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="UNDER_MAINTENANCE">UNDER_MAINTENANCE</option>
                <option value="OUT_OF_SERVICE">OUT_OF_SERVICE</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>
            </div>
          )}

          <div>
            <label style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600' }}>
              View Scope
            </label>
            <select
              value={catalogueScope}
              onChange={(e) => setCatalogueScope(e.target.value)}
              disabled={isMaintenanceView || scopeOptions.length === 1}
              style={{
                width: '100%',
                padding: '0.8rem 0.9rem',
                borderRadius: '8px',
                border: '1px solid rgba(99, 102, 241, 0.15)',
                background: 'rgba(255,255,255,0.7)',
                color: 'var(--text-dark)',
                opacity: isMaintenanceView || scopeOptions.length === 1 ? 0.8 : 1
              }}
            >
              {scopeOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
            Loading resources...
          </div>
        )}

        {!loading && filteredResources.length === 0 && (
          <div className="empty-state" style={{ background: 'rgba(255,255,255,0.4)', borderRadius: '15px' }}>
            <h3 style={{ color: 'var(--text-dark)' }}>{emptyStateTitle}</h3>
            <p style={{ marginTop: '0.5rem' }}>
              {emptyStateDescription}
            </p>
          </div>
        )}

        {!loading && filteredResources.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
            {filteredResources.map(resource => (
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

                  {/* View Details Button — all roles */}
                  <div style={{
                    marginTop: '1rem',
                    paddingTop: '0.75rem',
                    borderTop: '1px solid rgba(99, 102, 241, 0.08)'
                  }}>
                    <button
                      onClick={() => handleViewDetails(resource)}
                      style={{
                        width: '100%',
                        padding: '0.7rem',
                        background: 'linear-gradient(135deg, rgba(79,70,229,0.08) 0%, rgba(139,92,246,0.12) 100%)',
                        border: '1px solid rgba(99,102,241,0.15)',
                        color: 'var(--primary-color)',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: '600',
                        fontSize: '0.9rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        transition: 'all 0.25s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'linear-gradient(135deg, rgba(79,70,229,0.15) 0%, rgba(139,92,246,0.2) 100%)';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                        e.currentTarget.style.boxShadow = '0 4px 15px rgba(99,102,241,0.15)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'linear-gradient(135deg, rgba(79,70,229,0.08) 0%, rgba(139,92,246,0.12) 100%)';
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      📋 View Details
                    </button>
                  </div>

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
  }
};

export default Facilities;
