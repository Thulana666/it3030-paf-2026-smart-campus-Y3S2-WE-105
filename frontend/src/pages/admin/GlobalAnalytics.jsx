import React, { useState, useEffect } from 'react';
import api from '../../services/api';

/* ────────────────────────────────────────────────────────────────────
   Mini-chart components (pure CSS — no external charting library)
   ──────────────────────────────────────────────────────────────────── */

const BarChart = ({ data, color = 'var(--primary-color)', height = 140 }) => {
  const max = Math.max(...data.map(d => d.count), 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height, padding: '0.5rem 0' }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
          <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-dark)' }}>{d.count}</span>
          <div style={{
            width: '100%', maxWidth: 42, borderRadius: '6px 6px 4px 4px',
            background: `linear-gradient(180deg, ${color}, ${color}88)`,
            height: `${Math.max((d.count / max) * (height - 40), 4)}px`,
            transition: 'height 0.6s cubic-bezier(.4,0,.2,1)',
            boxShadow: `0 2px 8px ${color}30`,
          }} />
          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
            {new Date(d.date + 'T00:00').toLocaleDateString(undefined, { weekday: 'short' })}
          </span>
        </div>
      ))}
    </div>
  );
};

const DonutChart = ({ segments, size = 130 }) => {
  const total = segments.reduce((s, g) => s + g.value, 0);
  let cumulative = 0;
  const strokeWidth = 18;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        {segments.map((seg, i) => {
          const pct = total > 0 ? seg.value / total : 0;
          const dashArray = `${pct * circumference} ${circumference}`;
          const dashOffset = -cumulative * circumference;
          cumulative += pct;
          return (
            <circle key={i} cx={size / 2} cy={size / 2} r={radius}
              fill="none" stroke={seg.color} strokeWidth={strokeWidth}
              strokeDasharray={dashArray} strokeDashoffset={dashOffset}
              strokeLinecap="round" style={{ transition: 'stroke-dasharray 0.8s ease' }} />
          );
        })}
      </svg>
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-dark)' }}>{total}</span>
        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Total</span>
      </div>
    </div>
  );
};

const HorizontalBar = ({ items, maxVal }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
    {items.map((item, i) => (
      <div key={i}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
          <span style={{ fontSize: '0.82rem', fontWeight: 500, color: 'var(--text-dark)' }}>{item.label}</span>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: item.color || 'var(--primary-color)' }}>{item.value}</span>
        </div>
        <div style={{ height: 8, borderRadius: 4, background: 'rgba(0,0,0,0.04)' }}>
          <div style={{
            height: '100%', borderRadius: 4,
            width: `${maxVal > 0 ? (item.value / maxVal) * 100 : 0}%`,
            background: `linear-gradient(90deg, ${item.color || 'var(--primary-color)'}, ${item.color || 'var(--primary-color)'}88)`,
            transition: 'width 0.8s cubic-bezier(.4,0,.2,1)',
          }} />
        </div>
      </div>
    ))}
  </div>
);

/* ────────────────────────────────────────────────────────────────────
   Stat Card
   ──────────────────────────────────────────────────────────────────── */
const StatCard = ({ icon, label, value, subtext, color, accent }) => (
  <div className="glass" style={{
    padding: '1.5rem', borderRadius: '1rem', position: 'relative', overflow: 'hidden',
    display: 'flex', gap: '1rem', alignItems: 'center',
  }}>
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: accent || color }} />
    <div style={{
      width: 50, height: 50, borderRadius: '14px',
      background: `${color}14`, border: `1px solid ${color}22`,
      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', flexShrink: 0,
    }}>{icon}</div>
    <div>
      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500, marginBottom: '0.15rem' }}>{label}</p>
      <p style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-dark)', lineHeight: 1 }}>{value}</p>
      {subtext && <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{subtext}</p>}
    </div>
  </div>
);

/* ────────────────────────────────────────────────────────────────────
   Section Card wrapper
   ──────────────────────────────────────────────────────────────────── */
const SectionCard = ({ title, icon, children, style }) => (
  <div className="glass" style={{ padding: '1.75rem', borderRadius: '1.2rem', ...style }}>
    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-dark)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <span style={{ fontSize: '1.2rem' }}>{icon}</span> {title}
    </h3>
    {children}
  </div>
);

const Legend = ({ items }) => (
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem 1.25rem', marginTop: '0.75rem' }}>
    {items.map((item, i) => (
      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
        <div style={{ width: 10, height: 10, borderRadius: 3, background: item.color }} />
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.label}: <strong style={{ color: 'var(--text-dark)' }}>{item.value}</strong></span>
      </div>
    ))}
  </div>
);

/* ────────────────────────────────────────────────────────────────────
   Color palettes
   ──────────────────────────────────────────────────────────────────── */
const BOOKING_COLORS = { PENDING: '#f59e0b', APPROVED: '#22c55e', REJECTED: '#ef4444', CANCELLED: '#94a3b8' };
const TICKET_STATUS_COLORS = { OPEN: '#3b82f6', IN_PROGRESS: '#a855f7', RESOLVED: '#10b981', CLOSED: '#64748b', REJECTED: '#ef4444' };
const TICKET_PRIORITY_COLORS = { LOW: '#22c55e', MEDIUM: '#f59e0b', HIGH: '#f97316', CRITICAL: '#ef4444', URGENT: '#dc2626' };
const RESOURCE_STATUS_COLORS = { ACTIVE: '#22c55e', UNDER_MAINTENANCE: '#f59e0b', REPAIR_COMPLETED: '#3b82f6', PENDING_APPROVAL: '#a855f7', REJECTED: '#ef4444', OUT_OF_SERVICE: '#dc2626', INACTIVE: '#94a3b8' };
const ROLE_COLORS = { USER: '#6366f1', ADMIN: '#ec4899', TECHNICIAN: '#14b8a6' };

/* ────────────────────────────────────────────────────────────────────
   Main Page Component
   ──────────────────────────────────────────────────────────────────── */
const GlobalAnalytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await api.get('/analytics');
        setData(res.data);
      } catch (err) {
        console.error('Analytics fetch error:', err);
        setError('Failed to load analytics data.');
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="page-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div className="ticket-spinner" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="page-container">
        <div className="glass" style={{ padding: '2rem', textAlign: 'center', borderLeft: '5px solid #ef4444' }}>
          <h2 style={{ fontSize: '1.5rem', color: '#ef4444', marginBottom: '1rem' }}>{error || "No data available"}</h2>
        </div>
      </div>
    );
  }

  const { users, bookings, tickets, resources } = data;

  // Prepare donut segments
  const bookingDonut = Object.entries(bookings.byStatus || {}).map(([k, v]) => ({ label: k.replace('_', ' '), value: v, color: BOOKING_COLORS[k] || '#94a3b8' }));
  const ticketDonut = Object.entries(tickets.byStatus || {}).map(([k, v]) => ({ label: k.replace('_', ' '), value: v, color: TICKET_STATUS_COLORS[k] || '#94a3b8' }));
  const roleDonut = Object.entries(users.byRole || {}).map(([k, v]) => ({ label: k, value: v, color: ROLE_COLORS[k] || '#64748b' }));
  const resourceDonut = Object.entries(resources.byStatus || {}).map(([k, v]) => ({ label: k.replace('_', ' '), value: v, color: RESOURCE_STATUS_COLORS[k] || '#94a3b8' }));

  // Horizontal bar data
  const priorityBars = Object.entries(tickets.byPriority || {}).map(([k, v]) => ({ label: k, value: v, color: TICKET_PRIORITY_COLORS[k] || '#64748b' }));
  const categoryBars = Object.entries(tickets.byCategory || {}).map(([k, v]) => ({ label: k, value: v, color: '#6366f1' }));
  const buildingBars = Object.entries(resources.byBuilding || {}).map(([k, v]) => ({ label: k, value: v, color: '#14b8a6' }));

  return (
    <div className="page-container" style={{ animation: 'slideUp 0.5s ease backwards' }}>

      {/* Page Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.9rem', color: 'var(--text-dark)', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          📊 Global Analytics
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', marginTop: '0.35rem' }}>
          Real-time operational insights across all campus systems
        </p>
      </div>

      {/* ── Top KPI Cards ─────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.75rem' }}>
        <StatCard icon="👥" label="Total Users" value={users.total} subtext={`+${users.recentRegistrations} in last 30d`} color="#6366f1" accent="linear-gradient(90deg, #6366f1, #a78bfa)" />
        <StatCard icon="📅" label="Total Bookings" value={bookings.total} subtext={`${bookings.approvalRate}% approval rate`} color="#22c55e" accent="linear-gradient(90deg, #22c55e, #4ade80)" />
        <StatCard icon="🔧" label="Total Tickets" value={tickets.total} subtext={`${tickets.openCount} open now`} color="#f59e0b" accent="linear-gradient(90deg, #f59e0b, #fbbf24)" />
        <StatCard icon="🏢" label="Total Resources" value={resources.total} subtext={`${resources.utilizationRate}% active`} color="#14b8a6" accent="linear-gradient(90deg, #14b8a6, #2dd4bf)" />
      </div>

      {/* ── Row 1: Trends ─────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
        <SectionCard title="Booking Activity (7 days)" icon="📈">
          <BarChart data={bookings.trend || []} color="#22c55e" />
        </SectionCard>
        <SectionCard title="Ticket Activity (7 days)" icon="📉">
          <BarChart data={tickets.trend || []} color="#f59e0b" />
        </SectionCard>
        <SectionCard title="User Registrations (7 days)" icon="📊">
          <BarChart data={users.trend || []} color="#6366f1" />
        </SectionCard>
      </div>

      {/* ── Row 2: Distributions ──────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>

        <SectionCard title="Booking Status" icon="📋">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
            <DonutChart segments={bookingDonut} />
            <Legend items={bookingDonut} />
          </div>
        </SectionCard>

        <SectionCard title="Ticket Status" icon="🎫">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
            <DonutChart segments={ticketDonut} />
            <Legend items={ticketDonut} />
          </div>
        </SectionCard>

        <SectionCard title="Users by Role" icon="👤">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
            <DonutChart segments={roleDonut} size={120} />
            <Legend items={roleDonut} />
          </div>
        </SectionCard>
      </div>

      {/* ── Row 3: Deep Dives ─────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>

        <SectionCard title="Ticket Priority Breakdown" icon="⚡">
          <HorizontalBar items={priorityBars} maxVal={Math.max(...priorityBars.map(b => b.value), 1)} />
        </SectionCard>

        <SectionCard title="Tickets by Category" icon="🗂️">
          <HorizontalBar items={categoryBars} maxVal={Math.max(...categoryBars.map(b => b.value), 1)} />
        </SectionCard>

        <SectionCard title="Resources by Building" icon="🏗️">
          <HorizontalBar items={buildingBars} maxVal={Math.max(...buildingBars.map(b => b.value), 1)} />
        </SectionCard>
      </div>

      {/* ── Row 4: Resource Status + Top Facilities + Avg Resolution ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>

        <SectionCard title="Resource Health" icon="🩺">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
            <DonutChart segments={resourceDonut} />
            <Legend items={resourceDonut} />
          </div>
        </SectionCard>

        <SectionCard title="Most Booked Facilities" icon="🏆">
          {(bookings.topResources || []).length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {bookings.topResources.map((res, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{
                    width: 30, height: 30, borderRadius: '50%',
                    background: `linear-gradient(135deg, ${['#6366f1', '#ec4899', '#f59e0b', '#14b8a6', '#3b82f6'][i] || '#64748b'}, ${['#a78bfa', '#f472b6', '#fbbf24', '#2dd4bf', '#60a5fa'][i] || '#94a3b8'})`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontWeight: 800, fontSize: '0.75rem', flexShrink: 0,
                  }}>#{i + 1}</div>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-dark)' }}>{res.resourceId}</span>
                  </div>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary-color)' }}>{res.count} bookings</span>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '1rem' }}>No booking data yet</p>
          )}
        </SectionCard>

        <SectionCard title="Performance Metrics" icon="⏱️">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '0.5rem 0' }}>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--primary-color)', lineHeight: 1 }}>
                {tickets.avgResolutionHours || 0}<span style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--text-muted)' }}>h</span>
              </p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>Avg. Ticket Resolution</p>
            </div>
            <div style={{ borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
                <div>
                  <p style={{ fontSize: '1.4rem', fontWeight: 700, color: '#22c55e' }}>{bookings.approvalRate || 0}%</p>
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Booking Approval</p>
                </div>
                <div>
                  <p style={{ fontSize: '1.4rem', fontWeight: 700, color: '#14b8a6' }}>{resources.utilizationRate || 0}%</p>
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Resource Active</p>
                </div>
              </div>
            </div>
          </div>
        </SectionCard>
      </div>

      {/* ── Resources by Category ─────────────────────────── */}
      {Object.keys(resources.byCategory || {}).length > 0 && (
        <SectionCard title="Resources by Category" icon="📦" style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
            {Object.entries(resources.byCategory).map(([cat, count], i) => {
              const colors = ['#6366f1', '#ec4899', '#f59e0b', '#14b8a6', '#3b82f6', '#8b5cf6', '#ef4444', '#22c55e'];
              const c = colors[i % colors.length];
              return (
                <div key={cat} style={{
                  background: `${c}10`, border: `1px solid ${c}25`, borderRadius: '0.75rem',
                  padding: '0.75rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.6rem',
                }}>
                  <span style={{ fontSize: '1.4rem', fontWeight: 800, color: c }}>{count}</span>
                  <span style={{ fontSize: '0.82rem', fontWeight: 500, color: 'var(--text-dark)' }}>{cat}</span>
                </div>
              );
            })}
          </div>
        </SectionCard>
      )}
    </div>
  );
};

export default GlobalAnalytics;
