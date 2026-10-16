import React, { useState } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import { adminAPI } from "../services/api";

/**
 * Users page -> Bulk Upload.
 * ONE Excel file (sheets: Subcenter, PMSMA, Usg User, DP User) creates the centre (if new),
 * its wards (sub-centre) and its users in one go.
 *
 *   1. choose file  -> Validate & Preview (dry run, nothing saved)
 *   2. review       -> Confirm
 *   3. result       -> counts + failed rows CSV
 *
 * Props: onClose(), onDone()  (onDone is called after a successful confirm)
 */
const STATUS_META = {
  new: { label: "New", cls: "bg-success-100 text-success-600" },
  existing: { label: "Existing", cls: "bg-info-100 text-info-600" },
  invalid: { label: "Invalid", cls: "bg-danger-100 text-danger-600" },
};

const MastersBulkUploadModal = ({ onClose, onDone }) => {
  const [step, setStep] = useState("upload"); // upload | preview | result
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(null);
  const [filter, setFilter] = useState("all");
  const [result, setResult] = useState(null);

  const handleDownloadTemplate = async () => {
    try {
      const res = await adminAPI.mastersDownloadTemplate();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "user_bulk_upload_template.xlsx";
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError("Failed to download template");
    }
  };

  // STEP 1: validate (dry run)
  const handleValidate = async () => {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const data = await adminAPI.mastersBulkValidate(file);
      setPreview(data);
      setFilter(data.summary.invalid > 0 ? "invalid" : "all");
      setStep("preview");
    } catch (e) {
      setError(e.message || "Failed to validate file");
    } finally {
      setBusy(false);
    }
  };

  // STEP 2: confirm
  const handleConfirm = async () => {
    if (!file || !preview) return;
    setBusy(true);
    setError("");
    try {
      const data = await adminAPI.mastersBulkConfirm(file);
      setResult(data);
      setStep("result");
      if (onDone) onDone();
    } catch (e) {
      setError(e.message || "Failed to bulk upload");
    } finally {
      setBusy(false);
    }
  };

  const downloadFailedRows = (rows) => {
    if (!rows || rows.length === 0) return;
    const q = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const csv = [
      "Sheet,Row Number,Type,Name,Error Reason",
      ...rows.map((r) =>
        [
          q(r.sheet),
          r.row_number,
          q(r.record_type),
          q(r.name),
          q(r.error_reason),
        ].join(","),
      ),
    ].join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bulk_upload_failed_rows.csv";
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const backdrop = { backgroundColor: "rgba(0,0,0,0.5)" };

  // ------------------------------------------------------------------ STEP 1
  if (step === "upload") {
    return (
      <div className="modal fade show d-block" style={backdrop}>
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Bulk Upload — Users &amp; Centres</h5>
              <button
                type="button"
                className="btn-close"
                disabled={busy}
                onClick={onClose}
              ></button>
            </div>
            <div className="modal-body">
              <p className="text-sm text-secondary-light mb-8">
                One Excel file with the sheets <b>Subcenter</b>, <b>PMSMA</b>,{" "}
                <b>Usg User</b> and <b>DP User</b>. For every row the centre is
                created if it is new, the sub-centre wards are created and
                mapped, and the user is created.
              </p>
              <p className="text-sm text-secondary-light mb-16">
                The file is checked first and you can review everything before
                anything is saved.
              </p>
              <div className="d-flex gap-2 mb-16">
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1"
                  onClick={handleDownloadTemplate}
                >
                  <Icon icon="material-symbols:download" /> Download Template
                </button>
              </div>
              <div className="mb-16">
                <label className="form-label">Select Excel File (.xlsx)</label>
                <input
                  type="file"
                  className="form-control"
                  accept=".xlsx,.xls"
                  onChange={(e) => {
                    setFile(e.target.files[0] || null);
                    setError("");
                  }}
                />
              </div>
              {error && (
                <div className="alert alert-danger text-sm py-8 mb-0">
                  {error}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                disabled={busy}
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={busy || !file}
                onClick={handleValidate}
              >
                {busy ? "Checking file..." : "Validate & Preview"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ------------------------------------------------------------------ STEP 2
  if (step === "preview" && preview) {
    const sm = preview.summary;
    const rows = preview.rows.filter(
      (r) => filter === "all" || r.status === filter,
    );
    const nothingToSave =
      (sm.new_blocks || 0) + sm.new_centres + sm.new_wards + sm.new_users === 0;
    const cards = [
      {
        label: "New blocks",
        value: sm.new_blocks || 0,
        cls: "text-success-600",
      },
      { label: "New centres", value: sm.new_centres, cls: "text-success-600" },
      {
        label: "Existing centres",
        value: sm.existing_centres,
        cls: "text-info-600",
      },
      { label: "New wards", value: sm.new_wards, cls: "text-success-600" },
      { label: "New users", value: sm.new_users, cls: "text-success-600" },
      { label: "Invalid", value: sm.invalid, cls: "text-danger-600" },
    ];
    return (
      <div className="modal fade show d-block" style={backdrop}>
        <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Review — {preview.file_name}</h5>
              <button
                type="button"
                className="btn-close"
                disabled={busy}
                onClick={onClose}
              ></button>
            </div>
            <div className="modal-body">
              <div className="row g-2 mb-16">
                {cards.map((c) => (
                  <div className="col" key={c.label}>
                    <div className="border radius-8 p-12 text-center">
                      <div className={`fw-bold text-xl ${c.cls}`}>
                        {c.value}
                      </div>
                      <div className="text-xs text-secondary-light">
                        {c.label}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {preview.sheets_ignored && preview.sheets_ignored.length > 0 && (
                <div className="text-xs text-secondary-light mb-8">
                  Ignored sheets: {preview.sheets_ignored.join(", ")}
                </div>
              )}
              <div className="d-flex align-items-center gap-2 mb-12">
                <label className="text-sm mb-0">Show</label>
                <select
                  className="form-select form-select-sm w-auto"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                >
                  <option value="all">All ({preview.rows.length})</option>
                  <option value="new">New</option>
                  <option value="existing">Existing</option>
                  <option value="invalid">Invalid ({sm.invalid})</option>
                </select>
                {sm.invalid > 0 && (
                  <span className="text-xs text-danger-600">
                    Invalid rows will be skipped; everything else will be saved.
                  </span>
                )}
              </div>
              <div className="table-responsive" style={{ maxHeight: "50vh" }}>
                <table className="table table-sm align-middle">
                  <thead>
                    <tr>
                      <th>Sheet</th>
                      <th>Row</th>
                      <th>Type</th>
                      <th>Name</th>
                      <th>User Name</th>
                      <th>Block</th>
                      <th>Status</th>
                      <th>Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.length === 0 ? (
                      <tr>
                        <td
                          colSpan={8}
                          className="text-center text-secondary-light py-16"
                        >
                          No rows
                        </td>
                      </tr>
                    ) : (
                      rows.map((r, i) => {
                        const meta =
                          STATUS_META[r.status] || STATUS_META.invalid;
                        return (
                          <tr key={`${r.sheet}-${r.row_number}-${r.kind}-${i}`}>
                            <td>{r.sheet}</td>
                            <td>{r.row_number}</td>
                            <td>{r.record_type || "-"}</td>
                            <td>{r.name || "-"}</td>
                            <td>{r.username || "-"}</td>
                            <td>{r.block || "-"}</td>
                            <td>
                              <span
                                className={`px-8 py-2 radius-4 fw-medium text-xs ${meta.cls}`}
                              >
                                {meta.label}
                              </span>
                            </td>
                            <td className="text-sm">
                              {r.reason || ""}
                              {r.kind === "center" &&
                                (r.wards_new > 0 || r.wards_existing > 0) && (
                                  <div className="text-xs text-secondary-light">
                                    Wards: {r.wards_new} new, {r.wards_existing}{" "}
                                    existing
                                  </div>
                                )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
              {error && (
                <div className="alert alert-danger text-sm py-8 mt-12 mb-0">
                  {error}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                disabled={busy}
                onClick={() => setStep("upload")}
              >
                Back
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={busy || nothingToSave}
                onClick={handleConfirm}
              >
                {busy
                  ? "Saving..."
                  : `Confirm & Create (${sm.new_users} user${sm.new_users === 1 ? "" : "s"})`}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ------------------------------------------------------------------ STEP 3
  const failed = result?.failed_rows || [];
  return (
    <div className="modal fade show d-block" style={backdrop}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Bulk Upload Result</h5>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
            ></button>
          </div>
          <div className="modal-body">
            <div className="row g-2 mb-16 text-center">
              {[
                {
                  label: "Blocks created",
                  value: result?.blocks ?? 0,
                  cls: "text-success-600",
                },
                {
                  label: "Centres created",
                  value: result?.centres ?? 0,
                  cls: "text-success-600",
                },
                {
                  label: "Wards created",
                  value: result?.wards ?? 0,
                  cls: "text-success-600",
                },
                {
                  label: "Users created",
                  value: result?.users ?? 0,
                  cls: "text-success-600",
                },
                {
                  label: "Failed",
                  value: result?.failed ?? 0,
                  cls: "text-danger-600",
                },
              ].map((c) => (
                <div className="col-6" key={c.label}>
                  <div className="border radius-8 p-12">
                    <div className={`fw-bold text-xl ${c.cls}`}>{c.value}</div>
                    <div className="text-xs text-secondary-light">
                      {c.label}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {failed.length > 0 && (
              <>
                <div className="text-sm mb-8">
                  Some rows could not be saved:
                </div>
                <ul
                  className="text-xs text-danger-600 ps-16"
                  style={{ maxHeight: 160, overflowY: "auto" }}
                >
                  {failed.slice(0, 20).map((r, i) => (
                    <li key={i}>
                      {r.sheet} row {r.row_number} — {r.name}: {r.error_reason}
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1"
                  onClick={() => downloadFailedRows(failed)}
                >
                  <Icon icon="material-symbols:download" /> Download failed rows
                  (CSV)
                </button>
              </>
            )}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-primary" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MastersBulkUploadModal;
