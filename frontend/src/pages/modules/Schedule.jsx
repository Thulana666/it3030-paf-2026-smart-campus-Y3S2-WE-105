import React, { useState, useEffect } from "react";

const OpsSchedule = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Fetch schedule events from backend
    setLoading(false);
  }, []);

  return (
    <div
      className="page-container"
      style={{ animation: "slideUp 0.5s ease backwards" }}
    >
      <div
        className="glass"
        style={{ padding: "2rem", borderRadius: "var(--radius-lg)" }}
      >
        <h1
          style={{
            fontSize: "1.9rem",
            marginBottom: "1rem",
            color: "var(--text-dark)",
          }}
        >
          Operations Schedule
        </h1>
        <p style={{ color: "var(--text-muted)", marginBottom: "2rem" }}>
          View and manage scheduled maintenance, support hours, and operational
          tasks.
        </p>

        {loading ? (
          <div
            style={{
              textAlign: "center",
              padding: "2rem",
              color: "var(--text-muted)",
            }}
          >
            <div className="ticket-spinner" style={{ margin: "0 auto 1rem" }} />
            Loading schedule…
          </div>
        ) : events.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "3rem 1rem",
              color: "var(--text-muted)",
            }}
          >
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📅</div>
            <p>No scheduled events.</p>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(0,0,0,0.1)" }}>
                <th style={{ padding: "0.75rem", textAlign: "left" }}>Event</th>
                <th style={{ padding: "0.75rem", textAlign: "left" }}>Date</th>
                <th style={{ padding: "0.75rem", textAlign: "left" }}>Time</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr
                  key={event.id}
                  style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}
                >
                  <td style={{ padding: "0.75rem" }}>{event.title}</td>
                  <td style={{ padding: "0.75rem" }}>{event.date}</td>
                  <td style={{ padding: "0.75rem" }}>{event.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default OpsSchedule;
