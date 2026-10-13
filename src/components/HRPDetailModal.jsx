import React, { useState, useEffect, useCallback } from "react";
import { hrpAPI } from "../services/api";
import { formatDateTime } from "../utils/dateFormatter";

const STATUS_BADGE = {
  no_risk: "bg-neutral-200 text-neutral-700",
  risk_identified: "bg-warning-focus text-warning-main",
  under_follow_up: "bg-info-focus text-info-main",
  multiple_conditions: "bg-danger-focus text-danger-main",
  delivery_planned: "bg-success-focus text-success-main",
  case_closed: "bg-neutral-200 text-neutral-700",
};

const ACTION_LABEL = {
  condition_added: "Condition added",
  condition_resolved: "Condition resolved",
  status_changed: "Status changed",
};

const pretty = (s) =>
  s
    ? String(s)
        .replace(/_/g, " ")
        .replace(/^./, (c) => c.toUpperCase())
    : "-";

const HRPDetailModal = ({ pwId, onClose, onChanged }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [newCondition, setNewCondition] = useState("");
  const [newSource, setNewSource] = useState("mcp_card");
  const [statusValue, setStatusValue] = useState("");
  const [statusNote, setStatusNote] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await hrpAPI.getDetail(pwId);
      setData(res);
    } catch (err) {
      setError(err.message || "Failed to load HRP details");
    } finally {
      setLoading(false);
    }
  }, [pwId]);

  useEffect(() => {
    setLoading(true);
    setError("");
    load();
  }, [load]);

  const run = async (fn, okMessage) => {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await fn();
      setMessage(okMessage);
      await load();
      if (onChanged) onChanged();
    } catch (err) {
      setError(err.message || "Action failed");
    } finally {
      setBusy(false);
    }
  };

  const handleAdd = () => {
    const names = newCondition
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (names.length === 0) {
      setError("Enter at least one condition (comma separated)");
      return;
    }
    run(async () => {
      await hrpAPI.addConditions(pwId, names, newSource);
      setNewCondition("");
    }, "Condition(s) added");
  };

  const handleResolve = (id) =>
    run(() => hrpAPI.resolveCondition(id), "Condition resolved");

  const handleStatus = () => {
    if (!statusValue) {
      setError("Select a status");
      return;
    }
    run(async () => {
      await hrpAPI.changeStatus(pwId, statusValue, statusNote);
      setStatusValue("");
      setStatusNote("");
    }, "Status updated");
  };

  const closed =
    data &&
    (data.hrp_status === "case_closed" ||
      data.pregnant_woman.is_active === false);

  return (
    <div
      className="modal d-block"
      tabIndex="-1"
      style={{ background: "rgba(0,0,0,0.5)" }}
    >
      <div className="modal-dialog modal-xl modal-dialog-scrollable">
        <div className="modal-content">
          <div className="modal-header">
            <h6 className="modal-title">
              HRP Details
              {data && (
                <>
                  {" - "}
                  {data.pregnant_woman.full_name}
                  <span
                    className={`badge ms-2 ${STATUS_BADGE[data.hrp_status] || "bg-neutral-200"}`}
                  >
                    {data.hrp_status_label}
                  </span>
                </>
              )}
            </h6>
            <button type="button" className="btn-close" onClick={onClose} />
          </div>

          <div className="modal-body">
            {loading && <div className="text-center py-4">Loading...</div>}
            {error && <div className="alert alert-danger py-2">{error}</div>}
            {message && (
              <div className="alert alert-success py-2">{message}</div>
            )}

            {data && (
              <>
                {/* Conditions */}
                <h6 className="mb-2">HRP Conditions (with source)</h6>
                <div className="table-responsive mb-3">
                  <table className="table bordered-table mb-0">
                    <thead>
                      <tr>
                        <th>Condition</th>
                        <th>Source</th>
                        <th>Identified</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.conditions.length === 0 && (
                        <tr>
                          <td
                            colSpan="5"
                            className="text-center text-secondary-light py-3"
                          >
                            No conditions recorded.
                          </td>
                        </tr>
                      )}
                      {data.conditions.map((c) => (
                        <tr key={c.id}>
                          <td>{c.condition_name}</td>
                          <td>{c.source_label}</td>
                          <td>
                            {formatDateTime(c.identified_at)}
                            <div className="text-secondary-light text-sm">
                              {c.identified_by || ""}
                            </div>
                          </td>
                          <td>
                            {c.is_active ? (
                              <span className="badge bg-danger-focus text-danger-main">
                                Active
                              </span>
                            ) : (
                              <>
                                <span className="badge bg-neutral-200 text-neutral-700">
                                  Resolved
                                </span>
                                <div className="text-secondary-light text-sm">
                                  {c.resolved_at
                                    ? formatDateTime(c.resolved_at)
                                    : ""}
                                  {c.resolved_by ? ` · ${c.resolved_by}` : ""}
                                </div>
                              </>
                            )}
                          </td>
                          <td>
                            {c.is_active && !closed && (
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-success-600"
                                disabled={busy}
                                onClick={() => handleResolve(c.id)}
                              >
                                Resolve
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Add condition + change status */}
                {!closed && (
                  <div className="row g-3 mb-3">
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">
                        Add condition(s)
                      </label>
                      <div className="input-group">
                        <input
                          type="text"
                          className="form-control"
                          placeholder="e.g. Severe Anaemia, Previous LSCS"
                          value={newCondition}
                          onChange={(e) => setNewCondition(e.target.value)}
                        />
                        <select
                          className="form-select"
                          style={{ maxWidth: 130 }}
                          value={newSource}
                          onChange={(e) => setNewSource(e.target.value)}
                        >
                          <option value="mcp_card">MCP Card</option>
                          <option value="manual">Manual</option>
                        </select>
                        <button
                          type="button"
                          className="btn btn-primary-600"
                          disabled={busy}
                          onClick={handleAdd}
                        >
                          Add
                        </button>
                      </div>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-semibold">
                        Change HRP status
                      </label>
                      <div className="input-group">
                        <select
                          className="form-select"
                          value={statusValue}
                          onChange={(e) => setStatusValue(e.target.value)}
                        >
                          <option value="">Select...</option>
                          <option value="under_follow_up">
                            Under follow-up
                          </option>
                          <option value="delivery_planned">
                            Delivery planned
                          </option>
                          <option value="auto">Back to automatic</option>
                        </select>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Note (optional)"
                          value={statusNote}
                          onChange={(e) => setStatusNote(e.target.value)}
                        />
                        <button
                          type="button"
                          className="btn btn-primary-600"
                          disabled={busy}
                          onClick={handleStatus}
                        >
                          Update
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* History */}
                <h6 className="mb-2">History (status change log)</h6>
                <div className="table-responsive">
                  <table className="table bordered-table mb-0">
                    <thead>
                      <tr>
                        <th>When</th>
                        <th>Action</th>
                        <th>Change</th>
                        <th>By</th>
                        <th>Note</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.history.length === 0 && (
                        <tr>
                          <td
                            colSpan="5"
                            className="text-center text-secondary-light py-3"
                          >
                            No history yet.
                          </td>
                        </tr>
                      )}
                      {data.history.map((h) => (
                        <tr key={h.id}>
                          <td>{formatDateTime(h.changed_at)}</td>
                          <td>{ACTION_LABEL[h.action] || pretty(h.action)}</td>
                          <td>
                            {h.old_status || h.new_status
                              ? `${pretty(h.old_status)} → ${pretty(h.new_status)}`
                              : "-"}
                          </td>
                          <td>{h.changed_by || "-"}</td>
                          <td>{h.note || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HRPDetailModal;
