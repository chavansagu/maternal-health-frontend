import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import { useNavigate } from "react-router-dom";
import { notificationAPI } from "../services/api";
import {
  getRedirectUrl,
  getPriorityColor,
  isEscalated,
} from "../utils/notificationMaps";
import { formatDateTime } from "../utils/dateFormatter";

const POLL_MS = 60000;

const Stat = ({ label, value, color }) => (
  <div className="col-6 col-md-3">
    <div
      className="border radius-8 p-12 text-center"
      style={{ borderLeft: `4px solid ${color}` }}
    >
      <h5 className="mb-0">{value ?? 0}</h5>
      <small className="text-secondary-light">{label}</small>
    </div>
  </div>
);

const AlertSummaryWidget = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(true);
  const navigate = useNavigate();

  const fetchSummary = async () => {
    try {
      const data = await notificationAPI.getAlertsSummary();
      setSummary(data);
    } catch (error) {
      console.error("Error fetching alerts summary:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
    const interval = setInterval(fetchSummary, POLL_MS);
    return () => clearInterval(interval);
  }, []);

  const handleOpen = async (alert) => {
    try {
      if (!alert.is_read) await notificationAPI.markAsRead(alert.id);
    } catch (error) {
      console.error("Error marking as read:", error);
    }
    const url = getRedirectUrl(alert);
    if (url) navigate(url);
  };

  return (
    <div className="card radius-12 mb-24">
      <div className="card-body p-20">
        <div
          className={`d-flex justify-content-between align-items-center ${
            isOpen ? "mb-16" : ""
          }`}
        >
          <h6 className="mb-0 d-flex align-items-center gap-2">
            <Icon icon="solar:bell-bing-outline" className="text-danger" />
            Open Alerts
          </h6>
          <div className="d-flex align-items-center gap-2">
            <button
              className="btn btn-sm btn-link text-decoration-none"
              onClick={() => navigate("/notifications")}
            >
              View all
            </button>
            <button
              className="btn btn-sm btn-light d-flex align-items-center"
              onClick={() => setIsOpen(!isOpen)}
              title={isOpen ? "Close alerts" : "Open alerts"}
            >
              <Icon
                icon={
                  isOpen
                    ? "material-symbols:keyboard-arrow-up"
                    : "material-symbols:keyboard-arrow-down"
                }
                width="20"
              />
            </button>
          </div>
        </div>

        {!isOpen ? null : loading ? (
          <div className="text-center py-3">
            <div
              className="spinner-border spinner-border-sm text-primary"
              role="status"
            />
          </div>
        ) : !summary || summary.total_open === 0 ? (
          <p className="text-muted mb-0">No open alerts</p>
        ) : (
          <>
            <div className="row g-2 mb-16">
              <Stat
                label="Urgent"
                value={summary.by_priority?.urgent}
                color={getPriorityColor("urgent")}
              />
              <Stat
                label="High"
                value={summary.by_priority?.high}
                color={getPriorityColor("high")}
              />
              <Stat
                label="Normal"
                value={summary.by_priority?.normal}
                color={getPriorityColor("normal")}
              />
              <Stat
                label="Escalated"
                value={summary.escalated_open}
                color="#dc3545"
              />
            </div>

            {(summary.top_alerts || []).map((a) => (
              <div
                key={a.id}
                className="p-12 border-top cursor-pointer"
                style={{
                  borderLeft: `4px solid ${getPriorityColor(a.priority)}`,
                }}
                onClick={() => handleOpen(a)}
              >
                <div className="d-flex justify-content-between align-items-start">
                  <span className="fw-semibold text-sm">{a.title}</span>
                  {isEscalated(a) && (
                    <span className="badge bg-danger">Escalated</span>
                  )}
                </div>
                <div className="text-sm text-secondary-light">{a.message}</div>
                <small className="text-muted">
                  {formatDateTime(a.created_at)}
                </small>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
};

export default AlertSummaryWidget;
