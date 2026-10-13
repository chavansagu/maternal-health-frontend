import React, { useState, useEffect, useCallback } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import { useNavigate } from "react-router-dom";
import { notificationAPI } from "../services/api";
import {
  isPopupAlert,
  isEscalated,
  getRedirectUrl,
  getPriorityColor,
} from "../utils/notificationMaps";
import { getCachedNotifications } from "../hook/useNotificationSync";

const SEEN_KEY = "seen_priority_alert_ids";
const POLL_MS = 30000;

const loadSeen = () => {
  try {
    return JSON.parse(localStorage.getItem(SEEN_KEY)) || [];
  } catch {
    return [];
  }
};

const saveSeen = (ids) => {
  try {
    localStorage.setItem(SEEN_KEY, JSON.stringify(ids.slice(-300)));
  } catch {
    /* ignore */
  }
};

const PriorityAlertPopup = () => {
  const [alerts, setAlerts] = useState([]);
  const navigate = useNavigate();

  const fetchAlerts = useCallback(async () => {
    const seen = new Set(loadSeen());
    const pick = (list) =>
      (Array.isArray(list) ? list : []).filter(
        (n) => !n.is_read && isPopupAlert(n) && !seen.has(n.id),
      );
    try {
      const data = await notificationAPI.getNotifications(
        0,
        20,
        false,
        "alert",
      );
      setAlerts(pick(data));
    } catch (error) {
      // Offline / server down: sync se saved cache se dikhao
      setAlerts(pick(getCachedNotifications()));
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, POLL_MS);
    window.addEventListener("notifications-synced", fetchAlerts);
    return () => {
      clearInterval(interval);
      window.removeEventListener("notifications-synced", fetchAlerts);
    };
  }, [fetchAlerts]);

  const markSeen = (ids) => saveSeen([...loadSeen(), ...ids]);

  // Dismiss: popup band, notification bell mein unread hi rahegi
  const handleDismissAll = () => {
    markSeen(alerts.map((a) => a.id));
    setAlerts([]);
  };

  // Open: read mark + related page par jao
  const handleOpen = async (alert) => {
    markSeen([alert.id]);
    setAlerts((prev) => prev.filter((a) => a.id !== alert.id));
    try {
      await notificationAPI.markAsRead(alert.id);
    } catch (error) {
      console.error("Error marking as read:", error);
    }
    const url = getRedirectUrl(alert);
    if (url) navigate(url);
  };

  if (alerts.length === 0) return null;

  return (
    <>
      <div
        className="modal fade show"
        style={{ display: "block", zIndex: 1060 }}
        tabIndex="-1"
      >
        <div
          className="modal-dialog modal-dialog-scrollable modal-dialog-centered"
          style={{ maxWidth: "520px" }}
        >
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title d-flex align-items-center gap-2">
                <Icon icon="solar:bell-bing-outline" className="text-danger" />
                Priority Alerts ({alerts.length})
              </h5>
              <button
                type="button"
                className="btn-close"
                onClick={handleDismissAll}
              ></button>
            </div>
            <div
              className="modal-body p-0"
              style={{ maxHeight: "400px", overflowY: "auto" }}
            >
              {alerts.map((a) => (
                <div
                  key={a.id}
                  className="p-16 border-bottom"
                  style={{
                    borderLeft: `4px solid ${getPriorityColor(a.priority)}`,
                  }}
                >
                  <div className="d-flex justify-content-between align-items-start mb-1">
                    <h6 className="mb-0 fw-semibold text-sm">{a.title}</h6>
                    {isEscalated(a) && (
                      <span className="badge bg-danger">Escalated</span>
                    )}
                  </div>
                  <p className="mb-2 text-sm text-secondary-light">
                    {a.message}
                  </p>
                  <button
                    className="btn btn-sm btn-primary"
                    onClick={() => handleOpen(a)}
                  >
                    View
                  </button>
                </div>
              ))}
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-outline-secondary w-100"
                onClick={handleDismissAll}
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show" style={{ zIndex: 1055 }}></div>
    </>
  );
};

export default PriorityAlertPopup;
