import React, { useEffect, useMemo, useState } from "react";
import api from "../../services/api";

const OpsSchedule = () => {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchResources = async () => {
      try {
        const { data } = await api.get("/resources");
        setResources(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to fetch resources:", err);
        setError(
          err.response?.data?.message || "Failed to load resources data.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchResources();
  }, []);

  const tableColumns = useMemo(() => {
    const keySet = new Set();

    resources.forEach((resource) => {
      Object.keys(resource || {}).forEach((key) => keySet.add(key));
    });

    const keys = Array.from(keySet);
    return keys.sort((a, b) => {
      if (a === "_id") return -1;
      if (b === "_id") return 1;
      return a.localeCompare(b);
    });
  }, [resources]);

  const formatCellValue = (value) => {
    if (value === null || value === undefined || value === "") return "—";
    if (typeof value === "object") return JSON.stringify(value);
    return String(value);
  };

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
          Live data from MongoDB <code>resources</code> collection.
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
            Loading resources…
          </div>
        ) : error ? (
          <div
            style={{
              textAlign: "center",
              padding: "2rem",
              color: "var(--danger, #dc2626)",
            }}
          >
            {error}
          </div>
        ) : resources.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "3rem 1rem",
              color: "var(--text-muted)",
            }}
          >
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📅</div>
            <p>No resources found.</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(0,0,0,0.1)" }}>
                  {tableColumns.map((column) => (
                    <th
                      key={column}
                      style={{ padding: "0.75rem", textAlign: "left" }}
                    >
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {resources.map((resource, rowIndex) => (
                  <tr
                    key={resource._id || resource.id || rowIndex}
                    style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}
                  >
                    {tableColumns.map((column) => (
                      <td
                        key={`${resource._id || rowIndex}-${column}`}
                        style={{ padding: "0.75rem", verticalAlign: "top" }}
                      >
                        {formatCellValue(resource[column])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default OpsSchedule;
