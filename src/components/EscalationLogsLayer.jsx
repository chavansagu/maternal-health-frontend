import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import { notificationAPI } from "../services/api";
import { formatDateTime } from "../utils/dateFormatter";

const PAGE_SIZE = 20;

const EVENT_TYPES = [
  "anc_due",
  "anc_overdue",
  "anc_visit_due",
  "anc_visit_missed",
  "hrp_identified",
  "pmsma_due",
  "usg_scheduled",
  "usg_high_risk_finding",
  "edd_approaching",
  "hrp_near_edd",
  "edd_today_not_admitted",
  "edd_crossed_no_delivery",
  "mobilisation_pending",
  "referral_initiated",
  "referral_pending",
  "admission_confirmed",
  "death_recorded",
];

const LEVELS = ["sub_centre", "block", "district", "dp", "pmsma", "usg_centre"];
const ACTIONS = ["notified", "escalated", "closed"];

const ACTION_BADGE = {
  notified: "bg-primary-100 text-primary-600",
  escalated: "bg-danger-100 text-danger-600",
  closed: "bg-success-100 text-success-600",
};

const label = (s) =>
  s ? s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "-";

const EscalationLogsLayer = () => {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    event_type: "",
    level: "",
    action: "",
    from_date: "",
    to_date: "",
  });

  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, filters]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const data = await notificationAPI.getEscalationLogs({
        ...filters,
        skip: (page - 1) * PAGE_SIZE,
        limit: PAGE_SIZE,
      });
      setItems(data.items || []);
      setTotal(data.total || 0);
    } catch (error) {
      console.error("Error fetching escalation logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = (key, value) => {
    setPage(1);
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setPage(1);
    setFilters({
      event_type: "",
      level: "",
      action: "",
      from_date: "",
      to_date: "",
    });
  };

  const totalPages = Math.max(Math.ceil(total / PAGE_SIZE), 1);

  return (
    <div className="card h-100 p-0 radius-12">
      <div className="card-body p-24">
        <h5 className="mb-20">Escalation Log</h5>

        <div className="d-flex gap-2 mb-20 flex-wrap align-items-center">
          <select
            className="form-select form-select-sm"
            style={{ width: "auto" }}
            value={filters.event_type}
            onChange={(e) => handleFilter("event_type", e.target.value)}
          >
            <option value="">All Alerts</option>
            {EVENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {label(t)}
              </option>
            ))}
          </select>
          <select
            className="form-select form-select-sm"
            style={{ width: "auto" }}
            value={filters.level}
            onChange={(e) => handleFilter("level", e.target.value)}
          >
            <option value="">All Levels</option>
            {LEVELS.map((l) => (
              <option key={l} value={l}>
                {label(l)}
              </option>
            ))}
          </select>
          <select
            className="form-select form-select-sm"
            style={{ width: "auto" }}
            value={filters.action}
            onChange={(e) => handleFilter("action", e.target.value)}
          >
            <option value="">All Actions</option>
            {ACTIONS.map((a) => (
              <option key={a} value={a}>
                {label(a)}
              </option>
            ))}
          </select>
          <input
            type="date"
            className="form-control form-control-sm"
            style={{ width: "auto" }}
            value={filters.from_date}
            onChange={(e) => handleFilter("from_date", e.target.value)}
          />
          <input
            type="date"
            className="form-control form-control-sm"
            style={{ width: "auto" }}
            value={filters.to_date}
            onChange={(e) => handleFilter("to_date", e.target.value)}
          />
          <button
            className="btn btn-sm btn-outline-secondary"
            onClick={clearFilters}
          >
            Clear
          </button>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <Icon
              icon="solar:document-text-outline"
              style={{ fontSize: "48px" }}
              className="mb-3"
            />
            <p className="mb-0">No escalation log entries found</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table bordered-table sm-table mb-0">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Alert</th>
                  <th>Beneficiary</th>
                  <th>Level</th>
                  <th>Action</th>
                  <th>User</th>
                  <th>Note</th>
                </tr>
              </thead>
              <tbody>
                {items.map((r) => (
                  <tr key={r.id}>
                    <td>{formatDateTime(r.timestamp)}</td>
                    <td>{label(r.event_type)}</td>
                    <td>{r.pregnant_woman_name || "-"}</td>
                    <td>{label(r.level)}</td>
                    <td>
                      <span
                        className={`badge px-12 py-4 radius-4 ${ACTION_BADGE[r.action] || "bg-neutral-200"}`}
                      >
                        {label(r.action)}
                      </span>
                    </td>
                    <td>
                      {r.user_name || "-"}
                      {r.user_role && (
                        <small className="text-muted d-block">
                          {label(r.user_role)}
                        </small>
                      )}
                    </td>
                    <td>{r.action_note || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {total > 0 && (
          <div className="d-flex align-items-center justify-content-between mt-24">
            <span>
              Showing {(page - 1) * PAGE_SIZE + 1} to{" "}
              {Math.min(page * PAGE_SIZE, total)} of {total} entries
            </span>
            <div className="d-flex gap-2">
              <button
                className="btn btn-sm btn-outline-secondary"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Prev
              </button>
              <span className="align-self-center">
                {page} / {totalPages}
              </span>
              <button
                className="btn btn-sm btn-outline-secondary"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EscalationLogsLayer;
