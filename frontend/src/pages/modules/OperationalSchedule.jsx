import React, { useContext, useEffect, useMemo, useState } from 'react';
import { AuthContext } from '../../context/AuthContext';
import * as resourceService from '../../services/resourceService';
import * as assignmentService from '../../services/assignmentService';
import * as imageService from '../../services/imageService';
import * as activationRequestService from '../../services/activationRequestService';
import * as repairProgressService from '../../services/repairProgressService';

const PROGRESS_STATUSES = ['INSPECTING', 'PARTS_ORDERED', 'IN_PROGRESS', 'WAITING_APPROVAL', 'COMPLETED'];

const getEntityId = (entity) => entity?.id || entity?._id || '';

const normalizeProgressStatus = (value) => {
  if (!value) return 'INSPECTING';
  if (PROGRESS_STATUSES.includes(value)) return value;
  if (value === 'ASSIGNED') return 'INSPECTING';
  if (value === 'IN_PROGRESS') return 'IN_PROGRESS';
  if (value === 'COMPLETED') return 'COMPLETED';
  return 'INSPECTING';
};

const formatDateTime = (value) => {
  if (!value) return 'N/A';
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
};

const OperationalSchedule = () => {
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [savingProgress, setSavingProgress] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [formMessage, setFormMessage] = useState({ type: '', text: '' });
  const [resources, setResources] = useState([]);
  const [selectedResourceId, setSelectedResourceId] = useState('');
  const [resourceAssignments, setResourceAssignments] = useState([]);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState('');
  const [progressStatus, setProgressStatus] = useState('INSPECTING');
  const [repairForm, setRepairForm] = useState({
    resourceName: '',
    resourceCode: '',
    repairNotes: ''
  });
  const [myActivationRequests, setMyActivationRequests] = useState([]);

  const selectedResource = useMemo(
    () => resources.find((resource) => getEntityId(resource) === selectedResourceId) || null,
    [resources, selectedResourceId]
  );

  const selectedAssignment = useMemo(
    () => resourceAssignments.find((assignment) => getEntityId(assignment) === selectedAssignmentId) || null,
    [resourceAssignments, selectedAssignmentId]
  );

  useEffect(() => {
    if (!selectedResource) {
      setRepairForm((prev) => ({
        ...prev,
        resourceName: '',
        resourceCode: ''
      }));
      return;
    }

    setRepairForm((prev) => ({
      ...prev,
      resourceName: selectedResource.name || '',
      resourceCode: selectedResource.resourceCode || ''
    }));
  }, [selectedResource]);

  const latestActivationForResource = useMemo(() => {
    if (!selectedResourceId) return null;
    return myActivationRequests.find((r) => r.resourceId === selectedResourceId) || null;
  }, [myActivationRequests, selectedResourceId]);

  const getLastRepairDate = (resourceId) => {
    const related = resourceAssignments
      .filter((assignment) => assignment.resourceId === resourceId)
      .sort((a, b) => new Date(b.completedDate || b.updatedAt || 0) - new Date(a.completedDate || a.updatedAt || 0));
    return related[0]?.completedDate || related[0]?.updatedAt || null;
  };

  const fetchMaintenanceResources = async () => {
    setLoading(true);
    setMessage({ type: '', text: '' });
    try {
      const [maintenance, outOfService, myAssignments] = await Promise.all([
        resourceService.getResourcesByStatus('UNDER_MAINTENANCE'),
        resourceService.getResourcesByStatus('OUT_OF_SERVICE'),
        assignmentService.getMyAssignments()
      ]);

      const assignedResourceIds = [...new Set(myAssignments.map((assignment) => assignment.resourceId).filter(Boolean))];
      const extraAssignedResources = await Promise.all(
        assignedResourceIds
          .filter((resourceId) => !maintenance.some((resource) => resource.id === resourceId) && !outOfService.some((resource) => resource.id === resourceId))
          .map(async (resourceId) => {
            try {
              return await resourceService.getResourceById(resourceId);
            } catch {
              return null;
            }
          })
      );

      const merged = [...maintenance, ...outOfService, ...extraAssignedResources.filter(Boolean)];
      const deduped = Object.values(
        merged.reduce((acc, resource) => {
          if (!resource?.id) return acc;
          acc[resource.id] = acc[resource.id] || resource;
          return acc;
        }, {})
      );

      const withImages = await Promise.all(
        deduped.map(async (resource) => {
          if (resource.imageUrl) return resource;
          try {
            const images = await imageService.getResourceImages(resource.id);
            if (images && images.length > 0) {
              const image = images.find((item) => item.isPrimary) || images[0];
              if (image && image.mimeType && image.imageData) {
                const imageUrl = imageService.getImageDataUrl(image);
                return { ...resource, imageUrl: imageUrl || '' };
              }
            }
            return resource;
          } catch (error) {
            // Silently fail - images are optional
            console.log('No images found for resource:', resource.id);
            return resource;
          }
        })
      );

      setResources(withImages);
      setResourceAssignments(myAssignments);

      if (withImages.length > 0) {
        setSelectedResourceId((prev) => prev || getEntityId(withImages[0]));
      } else {
        setSelectedResourceId('');
      }
    } catch (error) {
      console.error('Error fetching maintenance resources:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.error || error.message || 'Failed to load maintenance resources' 
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSelectedResourceAssignments = async () => {
    if (!selectedResourceId) {
      setResourceAssignments([]);
      setSelectedAssignmentId('');
      return;
    }

    try {
      const assignments = await assignmentService.getResourceAssignments(selectedResourceId);
      const myId = user?.id;
      const myEmail = user?.email;
      
      let scopedAssignments = assignments;
      
      // Filter by current technician if user info is available
      if (myId || myEmail) {
        const filteredAssignments = assignments.filter((assignment) => 
          assignment.technicianId === myId || assignment.technicianEmail === myEmail
        );

        // Fallback to original list if backend values do not match current auth payload format
        scopedAssignments = filteredAssignments.length > 0 ? filteredAssignments : assignments;
      }

      setResourceAssignments(scopedAssignments);

      const active = scopedAssignments.find((a) => a.status !== 'COMPLETED' && a.status !== 'CANCELLED') || scopedAssignments[0];
      if (active) {
        setSelectedAssignmentId(getEntityId(active));
        setProgressStatus(normalizeProgressStatus(active.progressStatus || active.status));
      } else {
        setSelectedAssignmentId('');
        setProgressStatus('INSPECTING');
      }
    } catch (error) {
      console.error('Error fetching resource assignments:', error);
      setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to load resource assignment details' });
      setResourceAssignments([]);
      setSelectedAssignmentId('');
      setProgressStatus('INSPECTING');
    }
  };

  const fetchMyActivationRequests = async () => {
    try {
      const data = await activationRequestService.getMyActivationRequests();
      setMyActivationRequests(data);
    } catch {
      // Silent: activation request list is optional UI
    }
  };

  const handleAssignmentChange = (assignmentId) => {
    setSelectedAssignmentId(assignmentId);
    const assignment = resourceAssignments.find((item) => getEntityId(item) === assignmentId);
    if (!assignment) {
      setProgressStatus('INSPECTING');
      return;
    }
    setProgressStatus(normalizeProgressStatus(assignment.progressStatus || assignment.status));
  };

  const handleSaveProgress = async () => {
    if (!repairForm.resourceName.trim() && !repairForm.resourceCode.trim()) {
      setFormMessage({ type: 'error', text: 'Enter a resource name or code.' });
      return;
    }
    if (!progressStatus) {
      setFormMessage({ type: 'error', text: 'Select a progress status.' });
      return;
    }

    try {
      setSavingProgress(true);
      setFormMessage({ type: '', text: '' });
      await repairProgressService.createRepairProgress({
        resourceId: selectedResourceId || '',
        resourceName: repairForm.resourceName.trim(),
        resourceCode: repairForm.resourceCode.trim(),
        progressStatus,
        repairNotes: repairForm.repairNotes.trim()
      });

      setRepairForm((prev) => ({
        ...prev,
        repairNotes: ''
      }));

      setFormMessage({ type: 'success', text: 'Repair progress saved.' });
    } catch (error) {
      console.error('Error saving progress:', error);
      const errorMsg = error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to save progress status';
      const status = error.response?.status;
      setFormMessage({
        type: 'error',
        text: (status ? `(${status}) ` : '') + errorMsg
      });
    } finally {
      setSavingProgress(false);
    }
  };

  useEffect(() => {
    fetchMaintenanceResources();
    fetchMyActivationRequests();
  }, []);

  useEffect(() => {
    fetchSelectedResourceAssignments();
  }, [selectedResourceId]);

  return (
    <div className="glass" style={{ padding: '2rem', borderRadius: '15px' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ marginBottom: '0.5rem', color: 'var(--primary)' }}>Operational Schedule</h1>
        <p style={{ color: 'var(--text-muted)' }}>
          View maintenance resources, inspect full details, and update repair progress.
        </p>
      </div>

      {message.text && (
        <div
          style={{
            marginBottom: '1rem',
            padding: '0.75rem 1rem',
            borderRadius: '8px',
            background: message.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            border: `1px solid ${message.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
            color: message.type === 'success' ? '#10b981' : '#ef4444'
          }}
        >
          {message.text}
        </div>
      )}

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
        <button onClick={fetchMaintenanceResources} className="btn btn-outline" disabled={loading}>
          Refresh Maintenance List
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 1fr) 2fr', gap: '1.25rem' }}>
        <div className="card" style={{ padding: '1rem', borderRadius: '12px', background: 'rgba(255,255,255,0.45)' }}>
          <h3 style={{ marginTop: 0 }}>Maintenance Resources</h3>
          {loading && resources.length === 0 && <p style={{ color: 'var(--text-muted)' }}>Loading...</p>}
          {!loading && resources.length === 0 && (
            <p style={{ color: 'var(--text-muted)' }}>No under-maintenance, out-of-service, or assigned repair resources found.</p>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '60vh', overflowY: 'auto' }}>
            {resources.map((resource) => (
              <button
                key={getEntityId(resource)}
                type="button"
                onClick={() => setSelectedResourceId(getEntityId(resource))}
                style={{
                  textAlign: 'left',
                  border: selectedResourceId === getEntityId(resource) ? '1px solid var(--primary-color)' : '1px solid rgba(99,102,241,0.15)',
                  borderRadius: '10px',
                  padding: '0.75rem',
                  background: selectedResourceId === getEntityId(resource) ? 'rgba(99,102,241,0.08)' : 'white',
                  cursor: 'pointer'
                }}
              >
                <p style={{ margin: 0, fontWeight: 700 }}>{resource.name}</p>
                <p style={{ margin: '0.2rem 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>{resource.resourceCode}</p>
                <span className="badge" style={{ background: 'rgba(245,158,11,0.2)', color: '#a16207' }}>
                  {resource.status}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="card" style={{ padding: '1rem', borderRadius: '12px', background: 'rgba(255,255,255,0.45)' }}>
          {!selectedResource ? (
            <p style={{ color: 'var(--text-muted)' }}>Select a resource to view details.</p>
          ) : (
            <>
              <h3 style={{ marginTop: 0, marginBottom: '0.5rem' }}>Resource Details</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', marginBottom: '1rem' }}>
                <p><strong>Name:</strong> {selectedResource.name}</p>
                <p><strong>Code:</strong> {selectedResource.resourceCode}</p>
                <p><strong>Type:</strong> {selectedResource.type || 'N/A'}</p>
                <p><strong>Status:</strong> {selectedResource.status}</p>
                <p><strong>Location:</strong> {[selectedResource.building, selectedResource.floor, selectedResource.location].filter(Boolean).join(' / ') || 'N/A'}</p>
                <p><strong>Last repair date:</strong> {formatDateTime(getLastRepairDate(getEntityId(selectedResource)))}</p>
              </div>
              <p style={{ marginBottom: '1rem' }}><strong>Description:</strong> {selectedResource.description || 'N/A'}</p>

              {selectedResource.imageUrl && (
                <div style={{ marginBottom: '1rem' }}>
                  <img
                    src={selectedResource.imageUrl}
                    alt={selectedResource.name}
                    style={{ width: '100%', maxHeight: '220px', objectFit: 'cover', borderRadius: '10px', border: '1px solid rgba(99,102,241,0.15)' }}
                  />
                </div>
              )}

              <hr style={{ borderColor: 'rgba(99,102,241,0.15)', margin: '1rem 0' }} />
              <h4 style={{ marginTop: 0 }}>Update Repair Progress</h4>

              <div style={{ display: 'grid', gap: '0.75rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.35rem', fontWeight: 600 }}>Resource Name</label>
                    <input
                      type="text"
                      value={repairForm.resourceName}
                      onChange={(e) => setRepairForm((prev) => ({ ...prev, resourceName: e.target.value }))}
                      placeholder="Enter resource name"
                      style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid rgba(99,102,241,0.2)' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '0.35rem', fontWeight: 600 }}>Resource Code</label>
                    <input
                      type="text"
                      value={repairForm.resourceCode}
                      onChange={(e) => setRepairForm((prev) => ({ ...prev, resourceCode: e.target.value }))}
                      placeholder="Enter resource code"
                      style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid rgba(99,102,241,0.2)' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.35rem', fontWeight: 600 }}>Assigned Repair</label>
                  <select
                    value={selectedAssignmentId}
                    onChange={(e) => handleAssignmentChange(e.target.value)}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid rgba(99,102,241,0.2)' }}
                  >
                    <option value="">Select assignment</option>
                    {resourceAssignments.map((assignment) => (
                      <option key={getEntityId(assignment)} value={getEntityId(assignment)}>
                        {assignment.issueType} - {assignment.status}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.35rem', fontWeight: 600 }}>Progress Status</label>
                  <select
                    value={progressStatus}
                    onChange={(e) => setProgressStatus(e.target.value)}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid rgba(99,102,241,0.2)' }}
                  >
                    {PROGRESS_STATUSES.map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={handleSaveProgress}
                  className="btn btn-primary"
                  disabled={savingProgress}
                >
                  {savingProgress ? 'Saving...' : 'Save Repair Progress'}
                </button>

                {latestActivationForResource && (
                  <div
                    style={{
                      padding: '0.85rem 1rem',
                      borderRadius: '10px',
                      background: 'rgba(99,102,241,0.06)',
                      border: '1px solid rgba(99,102,241,0.18)'
                    }}
                  >
                    <div style={{ fontWeight: 700, marginBottom: '0.35rem' }}>
                      Activation Request: {latestActivationForResource.status}
                    </div>
                    {latestActivationForResource.decisionReason && (
                      <div style={{ color: 'var(--text-muted)', whiteSpace: 'pre-wrap' }}>
                        Reason: {latestActivationForResource.decisionReason}
                      </div>
                    )}
                  </div>
                )}

                {selectedAssignment?.notes && (
                  <div
                    style={{
                      padding: '0.85rem 1rem',
                      borderRadius: '10px',
                      background: 'rgba(99,102,241,0.06)',
                      border: '1px solid rgba(99,102,241,0.18)'
                    }}
                  >
                    <div style={{ fontWeight: 700, marginBottom: '0.35rem' }}>Saved Notes</div>
                    <div style={{ whiteSpace: 'pre-wrap', color: 'var(--text-muted)' }}>
                      {selectedAssignment.notes}
                    </div>
                  </div>
                )}

                {formMessage.text && (
                  <div
                    style={{
                      marginTop: '0.25rem',
                      padding: '0.85rem 1.1rem',
                      borderRadius: '10px',
                      background: formMessage.type === 'success'
                        ? 'linear-gradient(135deg, rgba(16,185,129,0.1) 0%, rgba(52,211,153,0.15) 100%)'
                        : 'linear-gradient(135deg, rgba(239,68,68,0.1) 0%, rgba(248,113,113,0.15) 100%)',
                      border: `1px solid ${formMessage.type === 'success' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
                      color: formMessage.type === 'success' ? '#059669' : '#dc2626',
                      fontSize: '0.92rem',
                      fontWeight: 600
                    }}
                  >
                    {formMessage.text}
                  </div>
                )}
              </div>

              {/* Spinner animation keyframe */}
              <style>{`
                @keyframes spin {
                  to { transform: rotate(360deg); }
                }
              `}</style>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default OperationalSchedule;
