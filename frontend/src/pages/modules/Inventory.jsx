import React, { useState, useEffect } from "react";

const Inventory = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Fetch inventory items from backend
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
          Inventory & Stock
        </h1>
        <p style={{ color: "var(--text-muted)", marginBottom: "2rem" }}>
          Manage campus equipment, supplies, and resource inventory.
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
            Loading inventory…
          </div>
        ) : items.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "3rem 1rem",
              color: "var(--text-muted)",
            }}
          >
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📦</div>
            <p>No inventory items yet.</p>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(0,0,0,0.1)" }}>
                <th style={{ padding: "0.75rem", textAlign: "left" }}>
                  Item Name
                </th>
                <th style={{ padding: "0.75rem", textAlign: "left" }}>
                  Category
                </th>
                <th style={{ padding: "0.75rem", textAlign: "left" }}>
                  Quantity
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr
                  key={item.id}
                  style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}
                >
                  <td style={{ padding: "0.75rem" }}>{item.name}</td>
                  <td style={{ padding: "0.75rem" }}>{item.category}</td>
                  <td style={{ padding: "0.75rem" }}>{item.quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Inventory;
