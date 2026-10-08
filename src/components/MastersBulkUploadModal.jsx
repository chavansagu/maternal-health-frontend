import React, { useState } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import { adminAPI } from "../services/api";

/**
 * Users page -> Bulk Upload.
 * ONE file creates Blocks, Wards/Villages, Sub-Centres, USG Centres, Delivery Points
 * and PMSMA Centres together (record_type column tells what each row is).
 *
 *   1. choose file  -> Validate & Preview (dry run, nothing saved)
 *   2. review       -> choose update mode / rows -> Confirm
 *   3. result       -> per-type counts + failed rows CSV
 *
 * Props: onClose(), onDone()  (onDone is called after a successful confirm)
 */
const STATUS_META = {
  new: { label: "New", cls: "bg-success-100 text-success-600" },
  duplicate_update: {
    label: "Existing - has updates",
    cls: "bg-info-100 text-info-600",
  },
  duplicate_identical: {
    label: "Existing - identical",
    cls: "bg-warning-100 text-warning-600",
  },
  file_duplicate: {
    label: "Repeated in file",
    cls: "bg-warning-100 text-warning-600",
  },
  conflict: { label: "Conflict", cls: "bg-danger-100 text-danger-600" },
  invalid: { label: "Invalid", cls: "bg-danger-100 text-danger-600" },
};

const MastersBulkUploadModal = ({ onClose, onDone }) => {
  const [step, setStep] = useState("upload"); // upload | preview | result
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(null);
  const [updateMode, setUpdateMode] = useState("fill_empty");
  const [filter, setFilter] = useState("all");
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [result, setResult] = useState(null);

  const handleDownloadTemplate = async () => {
    try {
      const res = await adminAPI.mastersDownloadTemplate();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      //   a.download = "administrative_masters_template.csv";
      a.download = "administrative_masters_template.xlsx";
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
      setFilter(data.summary.duplicate_update > 0 ? "duplicate_update" : "all");
      setUpdateMode("fill_empty");
      setSelectedRows(
        new Set(
          data.rows
            .filter((r) => r.status === "duplicate_update")
            .map((r) => r.row_number),
        ),
      );
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
      const selected = updateMode === "skip" ? [] : Array.from(selectedRows);
      const data = await adminAPI.mastersBulkConfirm(
        file,
        updateMode,
        selected,
      );
      setResult(data);
      setStep("result");
      if (onDone) onDone();
    } catch (e) {
      setError(e.message || "Failed to bulk upload");
    } finally {
      setBusy(false);
    }
  };

  const toggleRow = (n) => {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      if (next.has(n)) next.delete(n);
      else next.add(n);
      return next;
    });
  };

  const downloadFailedRows = (rows) => {
    if (!rows || rows.length === 0) return;
    const q = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const csv = [
      "Row Number,Type,Name,Code,Error Reason",
      ...rows.map((r) =>
        [
          r.row_number,
          q(r.record_type),
          q(r.name),
          q(r.code),
          q(r.error_reason),
        ].join(","),
      ),
    ].join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bulk_upload_masters_failed_rows.csv";
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
              <h5 className="modal-title">Bulk Upload — Administrative Data</h5>
              <button
                type="button"
                className="btn-close"
                disabled={busy}
                onClick={onClose}
              ></button>
            </div>
            <div className="modal-body">
              <p className="text-sm text-secondary-light mb-8">
                One file can add Blocks, Wards/Villages, Sub-Centres, USG
                Centres, Delivery Points and PMSMA Centres together. Every row
                says what it is in the <b>record_type</b> column (block, ward,
                sub_centre, usg, delivery_point, pmsma).
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
                <label className="form-label">Select CSV / Excel File</label>
                <input
                  type="file"
                  className="form-control"
                  accept=".csv,.xlsx,.xls"
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
    const filters = [
      ["all", "All", sm.total],
      ["new", "New", sm.new],
      ["duplicate_update", "Updatable", sm.duplicate_update],
      ["duplicate_identical", "Identical", sm.duplicate_identical],
      ["file_duplicate", "Repeated", sm.file_duplicate],
      ["conflict", "Conflicts", sm.conflict],
      ["invalid", "Invalid", sm.invalid],
    ];
    const filtered = preview.rows.filter(
      (r) => filter === "all" || r.status === filter,
    );
    const shown = filtered.slice(0, 200);
    const updatableRows = preview.rows.filter(
      (r) => r.status === "duplicate_update",
    );
    const updateCount =
      updateMode === "skip"
        ? 0
        : updatableRows.filter((r) => selectedRows.has(r.row_number)).length;
    const nothingToDo = sm.new + updateCount === 0;

    return (
      <div className="modal fade show d-block" style={backdrop}>
        <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title d-flex align-items-center gap-2">
                <Icon
                  icon="material-symbols:fact-check-outline"
                  className="text-primary-600"
                />
                Review Upload - {preview.file_name}
              </h5>
              <button
                className="btn-close"
                disabled={busy}
                onClick={onClose}
              ></button>
            </div>
            <div className="modal-body">
              <div className="alert alert-info py-8 text-sm mb-16">
                Nothing has been saved yet. Review the rows below, then click{" "}
                <b>Confirm</b>.
              </div>
              <div className="row g-2 mb-16">
                {[
                  ["Total", sm.total, "bg-neutral-50", "text-primary-600"],
                  ["New", sm.new, "bg-success-50", "text-success-main"],
                  [
                    "Existing (updatable)",
                    sm.duplicate_update,
                    "bg-info-50",
                    "text-info-main",
                  ],
                  [
                    "Existing (identical)",
                    sm.duplicate_identical + sm.file_duplicate,
                    "bg-warning-50",
                    "text-warning-main",
                  ],
                  [
                    "Conflicts / Invalid",
                    sm.conflict + sm.invalid,
                    "bg-danger-50",
                    "text-danger-main",
                  ],
                ].map(([label, val, bg, txt]) => (
                  <div className="col-6 col-md" key={label}>
                    <div className={`p-12 radius-8 text-center ${bg}`}>
                      <h5 className={`fw-bold mb-2 ${txt}`}>{val}</h5>
                      <span className="text-xs text-secondary-light">
                        {label}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {sm.duplicate_update > 0 && (
                <div className="border radius-8 p-12 mb-16">
                  <div className="fw-semibold mb-8">
                    {sm.duplicate_update} existing record(s) have new
                    information in this file. What should happen to them?
                  </div>
                  {[
                    [
                      "fill_empty",
                      "Fill empty fields only (recommended)",
                      "Adds missing values (e.g. address, contact number) and never changes data that is already saved.",
                    ],
                    [
                      "overwrite",
                      "Fill empty fields and overwrite differing values",
                      "Also replaces saved values with the ones from the file. The Code is never changed.",
                    ],
                    [
                      "skip",
                      "Do not update existing records",
                      "Only add the new rows; leave existing records exactly as they are.",
                    ],
                  ].map(([val, title, desc]) => (
                    <div className="form-check mb-6" key={val}>
                      <input
                        className="form-check-input"
                        type="radio"
                        name="mastersBulkUpdateMode"
                        id={`mastersBulkMode_${val}`}
                        checked={updateMode === val}
                        onChange={() => setUpdateMode(val)}
                      />
                      <label
                        className="form-check-label"
                        htmlFor={`mastersBulkMode_${val}`}
                      >
                        <span className="fw-medium">{title}</span>
                        <span className="d-block text-xs text-secondary-light">
                          {desc}
                        </span>
                      </label>
                    </div>
                  ))}
                </div>
              )}

              <div className="d-flex flex-wrap gap-2 mb-12">
                {filters.map(([key, label, count]) => (
                  <button
                    key={key}
                    type="button"
                    className={`btn btn-sm radius-8 ${filter === key ? "btn-primary" : "btn-outline-secondary"}`}
                    onClick={() => setFilter(key)}
                  >
                    {label} ({count})
                  </button>
                ))}
              </div>

              <div style={{ maxHeight: "340px", overflowY: "auto" }}>
                <table
                  className="table table-bordered table-sm mb-0"
                  style={{ fontSize: "13px" }}
                >
                  <thead
                    style={{
                      position: "sticky",
                      top: 0,
                      background: "#f8f9fa",
                      zIndex: 1,
                    }}
                  >
                    <tr>
                      <th style={{ width: "36px" }}>
                        {filter === "duplicate_update" &&
                          updateMode !== "skip" && (
                            <input
                              type="checkbox"
                              className="form-check-input"
                              checked={
                                updatableRows.length > 0 &&
                                updatableRows.every((r) =>
                                  selectedRows.has(r.row_number),
                                )
                              }
                              onChange={(e) =>
                                setSelectedRows(
                                  e.target.checked
                                    ? new Set(
                                        updatableRows.map((r) => r.row_number),
                                      )
                                    : new Set(),
                                )
                              }
                            />
                          )}
                      </th>
                      <th style={{ width: "60px" }}>Row #</th>
                      <th>Type</th>
                      <th>Name</th>
                      <th>Code</th>
                      <th>Status</th>
                      <th>Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shown.map((r) => (
                      <tr key={r.row_number}>
                        <td className="text-center">
                          {r.status === "duplicate_update" &&
                            updateMode !== "skip" && (
                              <input
                                type="checkbox"
                                className="form-check-input"
                                checked={selectedRows.has(r.row_number)}
                                onChange={() => toggleRow(r.row_number)}
                              />
                            )}
                        </td>
                        <td className="fw-semibold text-center">
                          {r.row_number}
                        </td>
                        <td>{r.record_type || "-"}</td>
                        <td>{r.name || "-"}</td>
                        <td>{r.code || "-"}</td>
                        <td>
                          <span
                            className={`px-8 py-2 radius-4 fw-medium text-xs ${STATUS_META[r.status].cls}`}
                          >
                            {STATUS_META[r.status].label}
                          </span>
                        </td>
                        <td>
                          {r.status === "duplicate_update" ? (
                            <div>
                              <div className="text-xs text-secondary-light mb-4">
                                Matched on {r.matched_on}
                              </div>
                              {r.changes.map((c) => {
                                const willApply =
                                  c.type === "fill" ||
                                  updateMode === "overwrite";
                                return (
                                  <div
                                    key={c.field}
                                    className="text-xs"
                                    style={{
                                      opacity:
                                        updateMode === "skip" || !willApply
                                          ? 0.5
                                          : 1,
                                    }}
                                  >
                                    <b>{c.label}:</b>{" "}
                                    {c.type === "fill" ? (
                                      <span className="text-success-main">
                                        {c.old || "(empty)"} &rarr; {c.new}
                                      </span>
                                    ) : (
                                      <span className="text-warning-main">
                                        {c.old} &rarr; {c.new}
                                        {updateMode !== "overwrite"
                                          ? " (kept as is)"
                                          : ""}
                                      </span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div
                              className={
                                r.status === "invalid" ||
                                r.status === "conflict"
                                  ? "text-danger-main"
                                  : ""
                              }
                            >
                              {r.reason ||
                                (r.status === "new" ? "Will be added" : "")}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                    {shown.length === 0 && (
                      <tr>
                        <td
                          colSpan={7}
                          className="text-center text-secondary-light py-16"
                        >
                          No rows in this category
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {filtered.length > shown.length && (
                <div className="text-xs text-secondary-light mt-8">
                  Showing first {shown.length} of {filtered.length} rows.
                </div>
              )}
              {error && (
                <div className="alert alert-danger text-sm py-8 mt-12 mb-0">
                  {error}
                </div>
              )}
            </div>
            <div className="modal-footer d-flex justify-content-between">
              <button
                className="btn btn-outline-secondary"
                disabled={busy}
                onClick={() => {
                  setStep("upload");
                  setPreview(null);
                  setError("");
                }}
              >
                Back
              </button>
              <div className="d-flex gap-2">
                <button
                  className="btn btn-secondary"
                  disabled={busy}
                  onClick={onClose}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-primary"
                  disabled={busy || nothingToDo}
                  onClick={handleConfirm}
                >
                  {busy
                    ? "Saving..."
                    : `Confirm: add ${sm.new}, update ${updateCount}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ------------------------------------------------------------------ STEP 3
  if (step === "result" && result) {
    const cards = [
      ["Total", result.total_records, "bg-neutral-50", "text-primary-600"],
      ["Added", result.inserted, "bg-success-50", "text-success-main"],
      ["Updated", result.updated, "bg-info-50", "text-info-main"],
      ["Failed", result.failed, "bg-danger-50", "text-danger-main"],
      [
        "Duplicates skipped",
        result.duplicate,
        "bg-warning-50",
        "text-warning-main",
      ],
    ];
    const byType = Object.entries(result.by_type || {});
    return (
      <div className="modal fade show d-block" style={backdrop}>
        <div className="modal-dialog modal-lg modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title d-flex align-items-center gap-2">
                <Icon
                  icon="material-symbols:upload-file"
                  className="text-primary-600"
                />
                Bulk Upload Result — Administrative Data
              </h5>
              <button className="btn-close" onClick={onClose}></button>
            </div>
            <div className="modal-body">
              <div className="row g-3 mb-20">
                {cards.map(([label, val, bg, txt]) => (
                  <div className="col-6 col-md" key={label}>
                    <div className={`p-16 radius-8 text-center ${bg}`}>
                      <h4 className={`fw-bold mb-4 ${txt}`}>{val}</h4>
                      <span className="text-sm text-secondary-light">
                        {label}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {byType.length > 0 && (
                <div className="table-responsive mb-20">
                  <table
                    className="table table-bordered table-sm mb-0"
                    style={{ fontSize: "13px" }}
                  >
                    <thead style={{ background: "#f8f9fa" }}>
                      <tr>
                        <th>Type</th>
                        <th className="text-center">Added</th>
                        <th className="text-center">Updated</th>
                        <th className="text-center">Duplicates</th>
                        <th className="text-center">Failed</th>
                      </tr>
                    </thead>
                    <tbody>
                      {byType.map(([label, c]) => (
                        <tr key={label}>
                          <td className="fw-medium">{label}</td>
                          <td className="text-center">{c.inserted}</td>
                          <td className="text-center">{c.updated}</td>
                          <td className="text-center">{c.duplicate}</td>
                          <td className="text-center">{c.failed}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {result.failed_rows && result.failed_rows.length > 0 ? (
                <>
                  <div className="d-flex align-items-center justify-content-between mb-12">
                    <h6 className="fw-semibold text-danger-main d-flex align-items-center gap-2 mb-0">
                      <Icon icon="material-symbols:error-outline" />
                      Failed Rows ({result.failed_rows.length})
                    </h6>
                    <button
                      className="btn btn-outline-danger btn-sm d-flex align-items-center gap-2"
                      onClick={() => downloadFailedRows(result.failed_rows)}
                    >
                      <Icon icon="material-symbols:download" /> Download CSV
                    </button>
                  </div>
                  <div
                    className="table-responsive"
                    style={{ maxHeight: "300px", overflowY: "auto" }}
                  >
                    <table
                      className="table table-bordered table-sm mb-0"
                      style={{ fontSize: "13px" }}
                    >
                      <thead
                        style={{
                          position: "sticky",
                          top: 0,
                          background: "#f8f9fa",
                          zIndex: 1,
                        }}
                      >
                        <tr>
                          <th style={{ width: "70px" }}>Row #</th>
                          <th>Type</th>
                          <th>Name</th>
                          <th>Code</th>
                          <th>Error Reason</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.failed_rows.map((row, i) => (
                          <tr key={i} style={{ backgroundColor: "#fff5f5" }}>
                            <td className="fw-semibold text-center">
                              {row.row_number}
                            </td>
                            <td>
                              {row.record_type || (
                                <span className="text-secondary-light">—</span>
                              )}
                            </td>
                            <td>
                              {row.name || (
                                <span className="text-secondary-light">—</span>
                              )}
                            </td>
                            <td>
                              {row.code || (
                                <span className="text-secondary-light">—</span>
                              )}
                            </td>
                            <td className="text-danger-main">
                              {row.error_reason}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <div className="text-center py-16">
                  <Icon
                    icon="material-symbols:check-circle"
                    className="text-success-main"
                    style={{ fontSize: "48px" }}
                  />
                  <p className="text-success-main fw-semibold mt-8 mb-0">
                    Upload completed with no errors!
                  </p>
                </div>
              )}
            </div>
            <div className="modal-footer d-flex justify-content-center">
              <button className="btn btn-secondary" onClick={onClose}>
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default MastersBulkUploadModal;
