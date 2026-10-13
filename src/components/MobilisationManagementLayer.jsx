import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import {
  ListToolbar,
  ToolbarLeft,
  ToolbarRight,
  EntriesSelect,
  SearchBox,
  FilterSelect,
  RefreshButton,
  TableFooter,
  PAGE_SIZE_OPTIONS,
} from "./common/ListControls";
import { mobilisationAPI, deliveryPointAPI } from "../services/api";
import { getUserRole } from "../services/auth";
import { formatDate, formatDateTime } from "../utils/dateFormatter";

const TRIGGER_LABELS = {
  near_edd: "Near EDD",
  missed_anc: "Missed ANC Visit",
  missed_pmsma: "Missed PMSMA Session",
  missed_usg: "Missed USG Appointment",
  hrp_unreferred: "HRP Not Referred",
  hrp_near_edd: "HRP Near EDD",
  hrp_near_edd_not_mobilised: "RED FLAG: HRP Near EDD, Not Mobilised",
  edd_today_not_admitted: "RED FLAG: EDD Today, Not Admitted",
  edd_overdue_no_delivery: "CRITICAL: EDD Crossed, No Delivery",
};

const TRIGGER_BADGE_CLASS = {
  near_edd: "bg-info-focus text-info-main",
  missed_anc: "bg-warning-focus text-warning-main",
  missed_pmsma: "bg-warning-focus text-warning-main",
  missed_usg: "bg-warning-focus text-warning-main",
  hrp_unreferred: "bg-danger-focus text-danger-main",
  hrp_near_edd: "bg-warning-focus text-warning-main",
  hrp_near_edd_not_mobilised: "bg-danger-focus text-danger-main",
  edd_today_not_admitted: "bg-danger-focus text-danger-main",
  edd_overdue_no_delivery: "bg-danger-focus text-danger-main",
};

const ESCALATION_BADGE_CLASS = {
  anm: "bg-neutral-200 text-neutral-700",
  block: "bg-warning-focus text-warning-main",
  district: "bg-danger-focus text-danger-main",
};

const PRIORITY_LABELS = {
  critical: "Critical",
  red_flag: "Red Flag",
  high: "High",
  normal: "Normal",
};

const PRIORITY_BADGE_CLASS = {
  critical: "bg-danger-600 text-white",
  red_flag: "bg-danger-focus text-danger-main",
  high: "bg-warning-focus text-warning-main",
  normal: "bg-neutral-200 text-neutral-700",
};

// Stage workflow (spec J). 'admitted' automatic hai (facility admission record karti hai)
const STAGE_ORDER = [
  "pending",
  "contacted",
  "planned",
  "mobilised",
  "reached_facility",
  "admitted",
];
const STAGE_LABELS = {
  pending: "Pending",
  contacted: "Contacted",
  planned: "Planned",
  mobilised: "Mobilised",
  reached_facility: "Reached Facility",
  admitted: "Admitted",
};
const STAGE_BADGE_CLASS = {
  pending: "bg-neutral-200 text-neutral-700",
  contacted: "bg-info-focus text-info-main",
  planned: "bg-info-focus text-info-main",
  mobilised: "bg-warning-focus text-warning-main",
  reached_facility: "bg-success-focus text-success-main",
  admitted: "bg-success-focus text-success-main",
};
const LOCATION_OPTIONS = [
  { value: "at_dp", label: "At DP" },
  { value: "not_at_dp", label: "Not at DP" },
];
const LOCATION_LABELS = { at_dp: "At DP", not_at_dp: "Not at DP" };
const CONTACT_OPTIONS = [
  { value: "beneficiary_reached", label: "Beneficiary reached" },
  { value: "family_reached", label: "Family reached" },
  { value: "not_reachable", label: "Not reachable" },
];
const CONTACT_LABELS = {
  beneficiary_reached: "Beneficiary reached",
  family_reached: "Family reached",
  not_reachable: "Not reachable",
};

const toLocalInput = (d = new Date()) => {
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};

const MobilisationManagementLayer = () => {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [itemsPerPage, setItemsPerPage] = useState(PAGE_SIZE_OPTIONS[0]);
  const [currentPage, setCurrentPage] = useState(1);
  const [triggerFilter, setTriggerFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [error, setError] = useState("");

  // Simple "Mark Mobilised" (sirf non-delivery cases: missed ANC / PMSMA / USG)
  const [showMarkModal, setShowMarkModal] = useState(false);
  const [selectedCase, setSelectedCase] = useState(null);
  const [remarks, setRemarks] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Stage form (delivery-related cases)
  const [showStageModal, setShowStageModal] = useState(false);
  const [stageCase, setStageCase] = useState(null);
  const [stageForm, setStageForm] = useState({});
  const [stageError, setStageError] = useState("");
  const [dpOptions, setDpOptions] = useState([]);
  const [loadingDps, setLoadingDps] = useState(false);
  const [stageSubmitting, setStageSubmitting] = useState(false);

  // History popup
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyCase, setHistoryCase] = useState(null);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const userRole = getUserRole();

  useEffect(() => {
    fetchCases();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [triggerFilter, priorityFilter]);

  // Go back to page 1 whenever the visible result set changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, triggerFilter, priorityFilter, itemsPerPage]);

  const fetchCases = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await mobilisationAPI.getCases({
        triggerType: triggerFilter || undefined,
        priority: priorityFilter || undefined,
      });
      setCases(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Failed to load mobilisation cases");
    } finally {
      setLoading(false);
    }
  };

  // ---- simple mark mobilised ----
  const openMarkModal = (mobilisationCase) => {
    setSelectedCase(mobilisationCase);
    setRemarks("");
    setShowMarkModal(true);
  };

  const handleMarkMobilised = async () => {
    if (!selectedCase) return;
    setSubmitting(true);
    try {
      await mobilisationAPI.markMobilised(selectedCase.id, remarks);
      setShowMarkModal(false);
      setSelectedCase(null);
      fetchCases();
    } catch (err) {
      setError(err.message || "Failed to mark as mobilised");
    } finally {
      setSubmitting(false);
    }
  };

  // ---- stage form ----
  const openStageModal = async (c) => {
    setStageCase(c);
    setStageError("");
    setStageForm({
      action_datetime: toLocalInput(),
      mobilisation_stage: c.mobilisation_stage || "pending",
      current_location: c.current_location || "",
      contact_status: c.contact_status || "",
      contact_number: c.contact_number || c.mobile_number || "",
      selected_dp_id: c.selected_dp_id ? String(c.selected_dp_id) : "",
      reason_not_completed: "",
    });
    setDpOptions([]);
    setShowStageModal(true);
    setLoadingDps(true);
    try {
      // HRP woman ke liye backend sirf higher institution (SDH/DHH) deta hai
      const dps = await deliveryPointAPI.getAvailableDeliveryPoints(
        c.pregnant_woman_id,
      );
      setDpOptions(Array.isArray(dps) ? dps : []);
    } catch (err) {
      setStageError(err.message || "Failed to load delivery points");
    } finally {
      setLoadingDps(false);
    }
  };

  const setStageField = (field, value) =>
    setStageForm((prev) => ({ ...prev, [field]: value }));

  const handleStageSubmit = async () => {
    if (!stageCase) return;
    const f = stageForm;
    const errs = [];
    if (!f.action_datetime) errs.push("Date and time is required");
    if (!f.mobilisation_stage) errs.push("Mobilisation status is required");
    if (!f.current_location) errs.push("Current location is required");
    if (!f.contact_status) errs.push("Contact / follow-up status is required");
    if (!f.selected_dp_id) errs.push("Delivery point is required");
    if (
      f.mobilisation_stage === "pending" &&
      !(f.reason_not_completed || "").trim()
    ) {
      errs.push("Reason is required when the stage is Pending");
    }
    if (errs.length) {
      setStageError(errs.join(". "));
      return;
    }

    setStageSubmitting(true);
    setStageError("");
    try {
      await mobilisationAPI.updateStage(stageCase.id, {
        action_datetime: f.action_datetime,
        mobilisation_stage: f.mobilisation_stage,
        current_location: f.current_location,
        contact_status: f.contact_status,
        contact_number: f.contact_number || null,
        selected_dp_id: Number(f.selected_dp_id),
        reason_not_completed: (f.reason_not_completed || "").trim() || null,
      });
      setShowStageModal(false);
      setStageCase(null);
      fetchCases();
    } catch (err) {
      setStageError(err.message || "Failed to update stage");
    } finally {
      setStageSubmitting(false);
    }
  };

  // ---- history ----
  const openHistory = async (c) => {
    setHistoryCase(c);
    setHistory([]);
    setShowHistoryModal(true);
    setLoadingHistory(true);
    try {
      const rows = await mobilisationAPI.getHistory(c.id);
      setHistory(Array.isArray(rows) ? rows : []);
    } catch (err) {
      setError(err.message || "Failed to load history");
      setShowHistoryModal(false);
    } finally {
      setLoadingHistory(false);
    }
  };

  const filteredCases = cases.filter((c) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      c.pregnant_woman_name?.toLowerCase().includes(term) ||
      c.mobile_number?.includes(term)
    );
  });

  const totalPages = Math.max(
    Math.ceil(filteredCases.length / itemsPerPage),
    1,
  );
  const safePage = Math.min(currentPage, totalPages);
  const pagedRows = filteredCases.slice(
    (safePage - 1) * itemsPerPage,
    safePage * itemsPerPage,
  );

  // Stage dropdown: sirf current stage aur usse aage (piche nahi), 'admitted' automatic hai
  const currentStageIndex = STAGE_ORDER.indexOf(
    stageCase?.mobilisation_stage || "pending",
  );
  const stageChoices = STAGE_ORDER.filter(
    (s, i) => s !== "admitted" && i >= Math.max(currentStageIndex, 0),
  );

  return (
    <div className="card basic-data-table">
      <div className="card-header">
        <h5 className="card-title mb-0">Mobilisation List</h5>
      </div>

      <div className="card-body">
        <ListToolbar>
          <ToolbarLeft>
            <EntriesSelect value={itemsPerPage} onChange={setItemsPerPage} />
            <SearchBox
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Search name / mobile"
            />
            <FilterSelect
              value={triggerFilter}
              onChange={setTriggerFilter}
              ariaLabel="Filter by trigger"
            >
              <option value="">All Triggers</option>
              {Object.entries(TRIGGER_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </FilterSelect>
            <FilterSelect
              value={priorityFilter}
              onChange={setPriorityFilter}
              ariaLabel="Filter by priority"
            >
              <option value="">All Priorities</option>
              {Object.entries(PRIORITY_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </FilterSelect>
          </ToolbarLeft>
          <ToolbarRight>
            <RefreshButton onClick={fetchCases} disabled={loading} />
          </ToolbarRight>
        </ListToolbar>

        {error && <div className="alert alert-danger py-2">{error}</div>}

        <div className="table-responsive">
          <table className="table bordered-table mb-0">
            <thead>
              <tr>
                <th>Priority</th>
                <th>Pregnant Woman</th>
                <th>Mobile</th>
                <th>Trigger</th>
                <th>Stage</th>
                <th>Pending Action</th>
                <th>Responsible User</th>
                <th>Escalation</th>
                <th>Raised On</th>
                <th className="text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan="10" className="text-center py-4">
                    Loading...
                  </td>
                </tr>
              )}
              {!loading && filteredCases.length === 0 && (
                <tr>
                  <td
                    colSpan="10"
                    className="text-center py-4 text-secondary-light"
                  >
                    No open mobilisation cases.
                  </td>
                </tr>
              )}
              {!loading &&
                pagedRows.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <span
                        className={`badge ${PRIORITY_BADGE_CLASS[c.priority] || "bg-neutral-200"}`}
                      >
                        {PRIORITY_LABELS[c.priority] || c.priority}
                      </span>
                    </td>
                    <td>
                      {c.pregnant_woman_name}
                      {c.is_high_risk && (
                        <span className="badge bg-danger-focus text-danger-main ms-2">
                          HRP
                        </span>
                      )}
                    </td>
                    <td>{c.mobile_number}</td>
                    <td>
                      <span
                        className={`badge ${TRIGGER_BADGE_CLASS[c.trigger_type] || "bg-neutral-200"}`}
                      >
                        {TRIGGER_LABELS[c.trigger_type] || c.trigger_type}
                      </span>
                      <div className="text-xs text-secondary-light mt-4">
                        {c.trigger_detail}
                      </div>
                    </td>
                    <td>
                      {c.is_delivery_case ? (
                        <>
                          <span
                            className={`badge ${STAGE_BADGE_CLASS[c.mobilisation_stage] || "bg-neutral-200"}`}
                          >
                            {STAGE_LABELS[c.mobilisation_stage] ||
                              c.mobilisation_stage}
                          </span>
                          {c.selected_dp_name && (
                            <div className="text-xs text-secondary-light mt-4">
                              {c.selected_dp_name}
                            </div>
                          )}
                        </>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td>{c.pending_action || c.trigger_detail}</td>
                    <td>{c.responsible_user || "-"}</td>
                    <td>
                      <span
                        className={`badge ${ESCALATION_BADGE_CLASS[c.escalation_level] || "bg-neutral-200"}`}
                      >
                        {c.escalation_level?.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      {formatDate ? formatDate(c.created_at) : c.created_at}
                    </td>
                    <td className="text-center">
                      {c.is_delivery_case ? (
                        <div className="d-flex gap-2 justify-content-center">
                          <button
                            className="btn btn-sm btn-primary-600"
                            onClick={() => openStageModal(c)}
                          >
                            Update Stage
                          </button>
                          <button
                            className="btn btn-sm btn-outline-secondary"
                            onClick={() => openHistory(c)}
                          >
                            History
                          </button>
                        </div>
                      ) : (
                        <button
                          className="btn btn-sm btn-success-600"
                          onClick={() => openMarkModal(c)}
                        >
                          <Icon
                            icon="mdi:check-circle-outline"
                            className="me-1"
                          />
                          Mark Mobilised
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        <TableFooter
          total={filteredCases.length}
          unfilteredTotal={cases.length}
          page={safePage}
          pageSize={itemsPerPage}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* Simple Mark Mobilised (non-delivery cases) */}
      {showMarkModal && selectedCase && (
        <div
          className="modal d-block"
          tabIndex="-1"
          style={{ background: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h6 className="modal-title">Mark as Mobilised</h6>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowMarkModal(false)}
                />
              </div>
              <div className="modal-body">
                <p className="mb-2">
                  <strong>{selectedCase.pregnant_woman_name}</strong> —{" "}
                  {TRIGGER_LABELS[selectedCase.trigger_type]}
                </p>
                <p className="text-secondary-light mb-3">
                  {selectedCase.trigger_detail}
                </p>
                <label className="form-label">Remarks (optional)</label>
                <textarea
                  className="form-control"
                  rows="3"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="e.g. Visited home, counselled family, will attend next camp"
                />
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn-outline-secondary"
                  onClick={() => setShowMarkModal(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-success-600"
                  onClick={handleMarkMobilised}
                  disabled={submitting}
                >
                  {submitting ? "Saving..." : "Confirm Mobilised"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stage form (delivery-related cases) */}
      {showStageModal && stageCase && (
        <div
          className="modal d-block"
          tabIndex="-1"
          style={{ background: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h6 className="modal-title">Update Mobilisation Stage</h6>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowStageModal(false)}
                />
              </div>
              <div className="modal-body">
                <p className="mb-1">
                  <strong>{stageCase.pregnant_woman_name}</strong>
                  {stageCase.is_high_risk && (
                    <span className="badge bg-danger-focus text-danger-main ms-2">
                      HRP
                    </span>
                  )}
                </p>
                <p className="text-secondary-light mb-3">
                  {TRIGGER_LABELS[stageCase.trigger_type]} —{" "}
                  {stageCase.pending_action || stageCase.trigger_detail}
                </p>

                {stageError && (
                  <div className="alert alert-danger py-2">{stageError}</div>
                )}

                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">
                      Date and Time <span className="text-danger">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      className="form-control"
                      value={stageForm.action_datetime || ""}
                      onChange={(e) =>
                        setStageField("action_datetime", e.target.value)
                      }
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">
                      Mobilisation Status <span className="text-danger">*</span>
                    </label>
                    <select
                      className="form-select"
                      value={stageForm.mobilisation_stage || ""}
                      onChange={(e) =>
                        setStageField("mobilisation_stage", e.target.value)
                      }
                    >
                      {stageChoices.map((s) => (
                        <option key={s} value={s}>
                          {STAGE_LABELS[s]}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">
                      Current Location <span className="text-danger">*</span>
                    </label>
                    <select
                      className="form-select"
                      value={stageForm.current_location || ""}
                      onChange={(e) =>
                        setStageField("current_location", e.target.value)
                      }
                    >
                      <option value="">Select</option>
                      {LOCATION_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">
                      Contact / Follow-up Status{" "}
                      <span className="text-danger">*</span>
                    </label>
                    <select
                      className="form-select"
                      value={stageForm.contact_status || ""}
                      onChange={(e) =>
                        setStageField("contact_status", e.target.value)
                      }
                    >
                      <option value="">Select</option>
                      {CONTACT_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Contact Number</label>
                    <input
                      type="text"
                      className="form-control"
                      maxLength={15}
                      value={stageForm.contact_number || ""}
                      onChange={(e) =>
                        setStageField("contact_number", e.target.value)
                      }
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">
                      {stageCase.is_high_risk
                        ? "Referral Hospital (Higher Institution)"
                        : "Selected Delivery Point"}{" "}
                      <span className="text-danger">*</span>
                    </label>
                    <select
                      className="form-select"
                      value={stageForm.selected_dp_id || ""}
                      onChange={(e) =>
                        setStageField("selected_dp_id", e.target.value)
                      }
                      disabled={loadingDps}
                    >
                      <option value="">
                        {loadingDps ? "Loading..." : "Select"}
                      </option>
                      {dpOptions.map((dp) => (
                        <option key={dp.id} value={dp.id}>
                          {dp.name}
                        </option>
                      ))}
                    </select>
                    {stageCase.is_high_risk && (
                      <div className="text-xs text-secondary-light mt-1">
                        High-risk case: only higher institutions (SDH/DHH) are
                        shown.
                      </div>
                    )}
                  </div>

                  <div className="col-12">
                    <label className="form-label">
                      Reason if not completed
                      {stageForm.mobilisation_stage === "pending" && (
                        <span className="text-danger"> *</span>
                      )}
                    </label>
                    <textarea
                      className="form-control"
                      rows="2"
                      value={stageForm.reason_not_completed || ""}
                      onChange={(e) =>
                        setStageField("reason_not_completed", e.target.value)
                      }
                      placeholder="e.g. Family not at home, transport not available"
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn-outline-secondary"
                  onClick={() => setShowStageModal(false)}
                  disabled={stageSubmitting}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-primary-600"
                  onClick={handleStageSubmit}
                  disabled={stageSubmitting}
                >
                  {stageSubmitting ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* History popup */}
      {showHistoryModal && historyCase && (
        <div
          className="modal d-block"
          tabIndex="-1"
          style={{ background: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-xl">
            <div className="modal-content">
              <div className="modal-header">
                <h6 className="modal-title">
                  Mobilisation History — {historyCase.pregnant_woman_name}
                </h6>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowHistoryModal(false)}
                />
              </div>
              <div className="modal-body">
                {loadingHistory ? (
                  <div className="text-center py-4">Loading...</div>
                ) : (
                  <div className="table-responsive">
                    <table className="table bordered-table mb-0">
                      <thead>
                        <tr>
                          <th>Date & Time</th>
                          <th>Stage</th>
                          <th>Location</th>
                          <th>Contact Status</th>
                          <th>Contact No.</th>
                          <th>Delivery Point</th>
                          <th>Reason</th>
                          <th>Recorded By</th>
                        </tr>
                      </thead>
                      <tbody>
                        {history.length === 0 ? (
                          <tr>
                            <td
                              colSpan="8"
                              className="text-center text-secondary-light"
                            >
                              No stage updates yet.
                            </td>
                          </tr>
                        ) : (
                          history.map((h) => (
                            <tr key={h.id}>
                              <td>
                                {formatDateTime
                                  ? formatDateTime(h.action_datetime)
                                  : h.action_datetime}
                              </td>
                              <td>
                                <span
                                  className={`badge ${STAGE_BADGE_CLASS[h.mobilisation_stage] || "bg-neutral-200"}`}
                                >
                                  {h.mobilisation_stage_label ||
                                    STAGE_LABELS[h.mobilisation_stage]}
                                </span>
                              </td>
                              <td>
                                {LOCATION_LABELS[h.current_location] || "-"}
                              </td>
                              <td>{CONTACT_LABELS[h.contact_status] || "-"}</td>
                              <td>{h.contact_number || "-"}</td>
                              <td>{h.selected_dp_name || "-"}</td>
                              <td>{h.reason_not_completed || "-"}</td>
                              <td>{h.recorded_by_name || h.recorded_by}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn-outline-secondary"
                  onClick={() => setShowHistoryModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MobilisationManagementLayer;
