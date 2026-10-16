import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { dashboardAPI } from "../services/api";

const PAGE_SIZE = 25;

// Column widths in px (used as the minimum). If the card is wider, the extra is shared by ALL
// columns, so nothing is left empty on the right. Long text wraps instead of widening the table.
const COL_PX = {
  _index: 50,
  _details: 90,
  full_name: 150,
  mobile_number: 120,
  age: 60,
  block: 110,
  sub_centre: 140,
  edd: 110,
  days_left: 90,
  is_hrp: 70,
  delivery_point: 140,
  admission_date: 110,
  days_admitted: 110,
  referred_on: 110,
  days_pending: 110,
  delivery_date: 110,
  baby_number: 80,
  baby_gender: 80,
};
const DEFAULT_PX = 120;

// compact table: fixed layout so it can never grow wider than the card
const LIST_CSS = `
.dcl-table { width: 100% !important; table-layout: fixed !important; font-size: 13px; }
.dcl-table th, .dcl-table td { padding: 10px 12px !important; white-space: normal; word-break: break-word; vertical-align: middle; }
.dcl-modal-back { position: fixed; inset: 0; z-index: 2000; background: rgba(15, 23, 42, .55); display: flex; align-items: center; justify-content: center; padding: 16px; }
.dcl-modal { width: 100%; max-width: 560px; max-height: 85vh; overflow-y: auto; background: var(--white, #fff); color: inherit; border-radius: 14px; box-shadow: 0 20px 50px rgba(15, 23, 42, .35); }
.dcl-modal-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 16px 20px; border-bottom: 1px solid var(--neutral-200, #e5e7eb); }
.dcl-modal-body { padding: 16px 20px 20px; display: grid; grid-template-columns: 1fr 1fr; gap: 14px 20px; }
.dcl-modal-body .full { grid-column: 1 / -1; }
.dcl-modal-label { font-size: 12px; color: var(--text-secondary-light, #64748b); margin-bottom: 2px; }
.dcl-modal-value { font-weight: 600; word-break: break-word; }
@media (max-width: 575px) { .dcl-modal-body { grid-template-columns: 1fr; } }
`;

/**
 * List behind a command-center card (e.g. "Active PW").
 * Fetches /dashboard/cases?metric=<metric> and scrolls itself into view when it opens.
 */
const DistrictCaseList = ({ metric, title, onClose }) => {
  const boxRef = useRef(null);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState(""); // debounced search
  const [page, setPage] = useState(0);
  const [data, setData] = useState({ total: 0, items: [], columns: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [viewRow, setViewRow] = useState(null); // row shown in the details popup

  // scroll down to the list whenever a card is opened
  useEffect(() => {
    boxRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [metric]);

  // new card -> start from page 1 with empty search
  useEffect(() => {
    setSearch("");
    setQuery("");
    setPage(0);
  }, [metric]);

  // debounce search typing
  useEffect(() => {
    const t = setTimeout(() => {
      setQuery(search.trim());
      setPage(0);
    }, 400);
    return () => clearTimeout(t);
  }, [search]);

  // Esc closes the popup
  useEffect(() => {
    if (!viewRow) return undefined;
    const onKey = (e) => e.key === "Escape" && setViewRow(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [viewRow]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError("");
    setViewRow(null);
    dashboardAPI
      .getCases(metric, {
        search: query,
        skip: page * PAGE_SIZE,
        limit: PAGE_SIZE,
      })
      .then((res) => alive && setData(res))
      .catch((e) => alive && setError(e.message || "Failed to load list"))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [metric, query, page]);

  const pages = Math.max(1, Math.ceil(data.total / PAGE_SIZE));
  const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("en-GB") : "—");
  const allColumns = data.columns || [];
  const columns = allColumns.filter((c) => !c.detail); // always visible
  const detailColumns = allColumns.filter((c) => c.detail); // behind the View button
  const tableMinWidth =
    COL_PX._index +
    columns.reduce((sum, c) => sum + (COL_PX[c.key] || DEFAULT_PX), 0) +
    (detailColumns.length > 0 ? COL_PX._details : 0);
  const colCount = columns.length + 1 + (detailColumns.length ? 1 : 0);
  const cell = (row, col) => {
    const v = row[col.key];
    if (col.type === "bool") return v ? "Yes" : "No";
    if (col.type === "date") return fmtDate(v);
    return v === null || v === undefined || v === "" ? "—" : v;
  };

  return (
    <div
      ref={boxRef}
      className="card shadow-sm border-0 mb-24"
      style={{ scrollMarginTop: 80 }}
    >
      <style>{LIST_CSS}</style>
      <div className="card-header border-bottom bg-base py-16 px-24 d-flex flex-wrap align-items-center justify-content-between gap-12">
        <h6 className="text-lg fw-semibold mb-0">
          {title} ({data.total})
        </h6>
        <div className="d-flex align-items-center gap-12">
          <input
            type="text"
            className="form-control form-control-sm"
            style={{ width: 240 }}
            placeholder="Search name / mobile / ABHA / RCH"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
      <div className="card-body p-0">
        <div className="table-responsive">
          <table
            className="table bordered-table mb-0 dcl-table"
            style={{ minWidth: tableMinWidth }}
          >
            <colgroup>
              <col style={{ width: COL_PX._index }} />
              {columns.map((c) => (
                <col
                  key={c.key}
                  style={{ width: COL_PX[c.key] || DEFAULT_PX }}
                />
              ))}
              {detailColumns.length > 0 && (
                <col style={{ width: COL_PX._details }} />
              )}
            </colgroup>
            <thead>
              <tr>
                <th>#</th>
                {columns.map((c) => (
                  <th key={c.key}>{c.label}</th>
                ))}
                {detailColumns.length > 0 && <th>Details</th>}
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={colCount} className="text-center py-24">
                    Loading...
                  </td>
                </tr>
              )}
              {!loading && error && (
                <tr>
                  <td
                    colSpan={colCount}
                    className="text-center text-danger py-24"
                  >
                    {error}
                  </td>
                </tr>
              )}
              {!loading && !error && data.items.length === 0 && (
                <tr>
                  <td colSpan={colCount} className="text-center py-24">
                    No records found
                  </td>
                </tr>
              )}
              {!loading &&
                !error &&
                data.items.map((r, i) => (
                  <tr key={r.row_id}>
                    <td>{page * PAGE_SIZE + i + 1}</td>
                    {columns.map((c) => (
                      <td key={c.key}>{cell(r, c)}</td>
                    ))}
                    {detailColumns.length > 0 && (
                      <td>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary py-2 px-8"
                          onClick={() => setViewRow(r)}
                        >
                          View
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
      {data.total > PAGE_SIZE && (
        <div className="card-footer d-flex align-items-center justify-content-between py-12 px-24">
          <span className="text-sm text-secondary-light">
            Page {page + 1} of {pages}
          </span>
          <div className="d-flex gap-8">
            <button
              type="button"
              className="btn btn-sm btn-outline-primary"
              disabled={page === 0 || loading}
              onClick={() => setPage((p) => p - 1)}
            >
              Prev
            </button>
            <button
              type="button"
              className="btn btn-sm btn-outline-primary"
              disabled={page + 1 >= pages || loading}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {viewRow &&
        createPortal(
          <div className="dcl-modal-back" onClick={() => setViewRow(null)}>
            <div
              className="dcl-modal"
              role="dialog"
              aria-modal="true"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="dcl-modal-head">
                <div>
                  <h6 className="mb-0">{viewRow.full_name}</h6>
                  <span className="text-sm text-secondary-light">
                    {title} · {viewRow.mobile_number}
                  </span>
                </div>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary"
                  onClick={() => setViewRow(null)}
                >
                  Close
                </button>
              </div>
              <div className="dcl-modal-body">
                {detailColumns.map((c) => (
                  <div
                    key={c.key}
                    className={
                      c.key === "reason" || c.key === "pending_action"
                        ? "full"
                        : ""
                    }
                  >
                    <div className="dcl-modal-label">{c.label}</div>
                    <div className="dcl-modal-value">{cell(viewRow, c)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
};

export default DistrictCaseList;
