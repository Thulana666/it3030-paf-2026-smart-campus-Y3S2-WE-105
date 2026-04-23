import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ticketService } from '../../../services/ticketService';
import { resourceService } from '../../../services/resourceService';

const CATEGORIES = ['Hardware', 'Software', 'Network', 'Electrical', 'Plumbing', 'Security', 'Cleaning', 'Other'];
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
const CONTACT_REGEX = /^(\+?[\d\s\-]{7,15}|[^\s@]+@[^\s@]+\.[^\s@]+)$/;
const MAX_IMAGE_SIZE_MB = 5;

// ── Validation ───────────────────────────────────────────────────
function validate(fields, images) {
  const errors = {};

  if (!fields.title.trim()) {
    errors.title = 'Title is required.';
  } else if (fields.title.trim().length < 5) {
    errors.title = 'Title must be at least 5 characters.';
  } else if (fields.title.trim().length > 100) {
    errors.title = 'Title must not exceed 100 characters.';
  }

  if (!fields.description.trim()) {
    errors.description = 'Description is required.';
  } else if (fields.description.trim().length < 20) {
    errors.description = 'Description must be at least 20 characters.';
  } else if (fields.description.trim().length > 1000) {
    errors.description = 'Description must not exceed 1000 characters.';
  }

  if (!fields.category) {
    errors.category = 'Please select a category.';
  }

  if (!fields.priority) {
    errors.priority = 'Please select a priority level.';
  }

  if (!fields.contactDetails.trim()) {
    errors.contactDetails = 'Contact details are required.';
  } else if (!CONTACT_REGEX.test(fields.contactDetails.trim())) {
    errors.contactDetails = 'Enter a valid email address or phone number.';
  }

  if (images.length > 3) {
    errors.images = 'You may attach a maximum of 3 images.';
  } else {
    for (const file of images) {
      if (!file.type.startsWith('image/')) {
        errors.images = `"${file.name}" is not a valid image file.`;
        break;
      }
      if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
        errors.images = `"${file.name}" exceeds the ${MAX_IMAGE_SIZE_MB} MB size limit.`;
        break;
      }
    }
  }

  return errors;
}

// ── Component ────────────────────────────────────────────────────
const TicketCreate = () => {
  const navigate = useNavigate();
  const [fields, setFields] = useState({
    title: '',
    description: '',
    category: '',
    priority: 'LOW',
    contactDetails: '',
    resourceId: '',
  });
  const [images,   setImages]   = useState([]);
  const [errors,   setErrors]   = useState({});
  const [loading,  setLoading]  = useState(false);
  const [apiError, setApiError] = useState(null);
  const [resources, setResources] = useState([]);

  useEffect(() => {
    const fetchResources = async () => {
      try {
        const data = await resourceService.getAllResources();
        setResources(data);
      } catch (err) {
        console.error('Failed to fetch resources:', err);
      }
    };
    fetchResources();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFields((prev) => ({ ...prev, [name]: value }));
    // Clear field error on change
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleFiles = (e) => {
    const files = Array.from(e.target.files);
    setImages(files);
    if (errors.images) setErrors((prev) => ({ ...prev, images: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError(null);

    const validationErrors = validate(fields, images);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('title',          fields.title.trim());
    formData.append('description',    fields.description.trim());
    formData.append('category',       fields.category);
    formData.append('priority',       fields.priority);
    formData.append('contactDetails', fields.contactDetails.trim());
    if (fields.resourceId.trim()) formData.append('resourceId', fields.resourceId.trim());
    images.forEach((img) => formData.append('images', img));

    try {
      await ticketService.createTicket(formData);
      navigate('/dashboard/incident-tickets');
    } catch (err) {
      console.error('Create ticket error:', err);
      setApiError(err.response?.data?.message || 'Failed to create ticket. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const charCount = fields.description.length;

  return (
    <div className="page-container" style={{ animation: 'slideUp 0.5s ease backwards' }}>

      {/* Header */}
      <div className="glass" style={{
        padding: '1.75rem 2rem',
        borderRadius: 'var(--radius-md)',
        marginBottom: '1.75rem',
        borderLeft: '5px solid #ef4444',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
      }}>
        <button
          onClick={() => navigate('/dashboard/incident-tickets')}
          className="btn btn-outline btn-sm"
          style={{ padding: '0.4rem 0.9rem', flexShrink: 0 }}
          title="Back to tickets"
        >
          ← Back
        </button>
        <div>
          <h1 style={{ fontSize: '1.7rem', marginBottom: '0.15rem', color: 'var(--text-dark)' }}>
            File a New Report
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            Describe the issue clearly so we can resolve it quickly.
          </p>
        </div>
      </div>

      {/* API error */}
      {apiError && <div className="error-alert" style={{ marginBottom: '1.25rem' }}>{apiError}</div>}

      {/* Form card */}
      <div className="glass" style={{ padding: '2rem', borderRadius: 'var(--radius-md)' }}>
        <form onSubmit={handleSubmit} noValidate>

          {/* Title */}
          <div className="form-group">
            <label htmlFor="title">
              Title <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              id="title"
              name="title"
              type="text"
              value={fields.title}
              onChange={handleChange}
              placeholder="Brief summary of the issue (5–100 chars)"
              maxLength={100}
              style={errors.title ? { borderColor: '#ef4444' } : {}}
            />
            {errors.title
              ? <p style={errStyle}>{errors.title}</p>
              : <p style={hintStyle}>{fields.title.length}/100 characters</p>}
          </div>

          {/* Description */}
          <div className="form-group">
            <label htmlFor="description">
              Description <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <textarea
              id="description"
              name="description"
              rows={5}
              value={fields.description}
              onChange={handleChange}
              placeholder="Detailed explanation of the problem (at least 20 characters)…"
              maxLength={1000}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                border: `1px solid ${errors.description ? '#ef4444' : 'rgba(0,0,0,0.1)'}`,
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(255,255,255,0.8)',
                fontSize: '1rem',
                resize: 'vertical',
                outline: 'none',
                transition: 'border-color 0.2s, box-shadow 0.2s',
                fontFamily: 'inherit',
              }}
              onFocus={(e) => { e.target.style.borderColor = 'var(--primary-color)'; e.target.style.boxShadow = '0 0 0 3px rgba(79,70,229,0.15)'; }}
              onBlur={(e)  => { e.target.style.borderColor = errors.description ? '#ef4444' : 'rgba(0,0,0,0.1)'; e.target.style.boxShadow = 'none'; }}
            />
            {errors.description
              ? <p style={errStyle}>{errors.description}</p>
              : <p style={hintStyle}>{charCount}/1000 characters (min 20)</p>}
          </div>

          {/* Category + Priority row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label htmlFor="category">
                Category <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <select
                id="category"
                name="category"
                value={fields.category}
                onChange={handleChange}
                style={errors.category ? { borderColor: '#ef4444' } : {}}
              >
                <option value="">— Select category —</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              {errors.category && <p style={errStyle}>{errors.category}</p>}
            </div>

            <div className="form-group">
              <label htmlFor="priority">
                Priority <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <select
                id="priority"
                name="priority"
                value={fields.priority}
                onChange={handleChange}
              >
                {PRIORITIES.map((p) => <option key={p} value={p}>{p.charAt(0) + p.slice(1).toLowerCase()}</option>)}
              </select>
            </div>
          </div>

          {/* Contact Details */}
          <div className="form-group">
            <label htmlFor="contactDetails">
              Contact Details <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              id="contactDetails"
              name="contactDetails"
              type="text"
              value={fields.contactDetails}
              onChange={handleChange}
              placeholder="Email address or phone number"
              style={errors.contactDetails ? { borderColor: '#ef4444' } : {}}
            />
            {errors.contactDetails && <p style={errStyle}>{errors.contactDetails}</p>}
          </div>

          {/* Resource ID */}
          <div className="form-group">
            <label htmlFor="resourceId">Resource / Asset ID <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span></label>
            <select
              id="resourceId"
              name="resourceId"
              value={fields.resourceId}
              onChange={handleChange}
            >
              <option value="">— Select a resource (optional) —</option>
              {resources.map((res) => (
                <option key={res._id} value={res._id}>
                  {res.name || res.identifier || res._id} {res.type ? `(${res.type})` : ''} {res.location ? `- ${res.location}` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Image attachments */}
          <div className="form-group">
            <label htmlFor="images">
              Attachments <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(up to 3 images, max {MAX_IMAGE_SIZE_MB} MB each)</span>
            </label>
            <input
              id="images"
              type="file"
              multiple
              accept="image/*"
              onChange={handleFiles}
              style={{
                width: '100%',
                padding: '0.6rem',
                border: `1px solid ${errors.images ? '#ef4444' : 'rgba(0,0,0,0.1)'}`,
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(255,255,255,0.8)',
                fontSize: '0.9rem',
                cursor: 'pointer',
              }}
            />
            {errors.images
              ? <p style={errStyle}>{errors.images}</p>
              : images.length > 0 && <p style={hintStyle}>{images.length} file(s) selected</p>}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem', justifyContent: 'flex-end' }}>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => navigate('/dashboard/incident-tickets')}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ minWidth: '130px' }}
            >
              {loading ? 'Submitting…' : 'Submit Report'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

const errStyle  = { color: '#ef4444', fontSize: '0.8rem', marginTop: '0.3rem' };
const hintStyle = { color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '0.25rem' };

export default TicketCreate;
