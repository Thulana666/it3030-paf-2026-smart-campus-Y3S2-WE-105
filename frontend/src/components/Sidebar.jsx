import React, { useContext, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

// ─── Role-based Navigation Maps ───────────────────────────────────────────────
const NAV_CONFIG = {
  USER: {
    sections: [
      {
        title: 'Main Area',
        links: [
          { to: '/dashboard', label: 'Dashboard', end: true, icon: <><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></> },
        ],
      },
      {
        title: 'Modules',
        links: [
          { to: '/dashboard/bookings', label: 'Booking System', icon: <><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></> },
          { to: '/dashboard/facilities', label: 'Facilities', icon: <><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></> },
          { to: '/dashboard/incident-tickets', label: 'Incident Tickets', icon: <><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></> },
        ],
      },
    ],
  },

  ADMIN: {
    sections: [
      {
        title: 'Main Area',
        links: [
          { to: '/dashboard', label: 'Dashboard', end: true, icon: <><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></> },
        ],
      },
      {
        title: 'Administration',
        links: [
          { to: '/dashboard/users', label: 'System Users', icon: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></> },
          { to: '/dashboard/facility-approvals', label: 'Facility Approvals', icon: <><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></> },
          { to: '/dashboard/analytics', label: 'Global Analytics', icon: <><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></> },
        ],
      },
    ],
  },

  TECHNICIAN: {
    sections: [
      {
        title: 'Main Area',
        links: [
          { to: '/dashboard', label: 'Dashboard', end: true, icon: <><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></> },
        ],
      },
      {
        title: 'Operations',
        links: [
          { to: '/dashboard/incident-tickets', label: 'Assigned Tickets', icon: <><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></> },
          { to: '/dashboard/inventory', label: 'Inventory & Stock', icon: <><path d="M21 8V20a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8"/><path d="M1 3h22v5H1z"/><path d="M10 12h4"/></> },
          { to: '/dashboard/schedule', label: 'Ops Schedule', icon: <><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></> },
        ],
      },
    ],
  },
};

const SvgLink = ({ icon }) => (
  <svg
    width="20" height="20" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round"
    style={{ flexShrink: 0 }}
  >
    {icon}
  </svg>
);

// ─── Sidebar Component ─────────────────────────────────────────────────────────
const Sidebar = () => {
  const { user } = useContext(AuthContext);
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (!user) return null;

  const config = NAV_CONFIG[user.role] || NAV_CONFIG.USER;

  return (
    <div className={`sidebar glass ${isCollapsed ? 'collapsed' : ''}`}>

      {/* Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--text-muted)', display: 'flex',
          justifyContent: isCollapsed ? 'center' : 'flex-end',
          padding: '0.5rem', marginBottom: '1rem',
        }}
        title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
      >
        <svg
          width="20" height="20" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round"
          style={{ transform: isCollapsed ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }}
        >
          <path d="M15 18l-6-6 6-6"/>
        </svg>
      </button>

      {/* Dynamic nav sections from config */}
      {config.sections.map((section, si) => (
        <React.Fragment key={si}>
          <div className="sidebar-title">{isCollapsed ? '' : section.title}</div>
          {section.links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active-link' : ''}`}
              title={isCollapsed ? link.label : ''}
            >
              <SvgLink icon={link.icon} />
              <span>{link.label}</span>
            </NavLink>
          ))}
        </React.Fragment>
      ))}
    </div>
  );
};

export default Sidebar;
