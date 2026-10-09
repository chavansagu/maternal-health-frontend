import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  ListTabs,
  ListTab,
  ListToolbar,
  ToolbarLeft,
  ToolbarRight,
  EntriesSelect,
  SearchBox,
  RefreshButton,
  TableFooter,
  PAGE_SIZE_OPTIONS,
} from "./common/ListControls";
import { enhancedTrackingAPI } from "../services/api";
import { formatDate } from "../utils/dateFormatter";

const LEVEL_BADGE = {
  critical: "bg-danger-600 text-white",
  high_priority: "bg-warning-focus text-warning-main",
  enhanced: "bg-info-focus text-info-main",
};

const ANC_BADGE = {
  overdue: "bg-danger-focus text-danger-main",
  due_soon: "bg-warning-focus text-warning-main",
  on_track: "bg-success-focus text-success-main",
  not_applicable: "bg-neutral-200 text-neutral-700",
};

const MOB_BADGE = {
  mobilised: "bg-success-focus text-success-main",
  pending: "bg-warning-focus text-warning-main",
  escalated: "bg-danger-focus text-danger-main",
  closed: "bg-neutral-200 text-neutral-700",
  none: "bg-neutral-200 text-neutral-700",
};

const pretty = (value) => {
  if (!value || value === "none") return "Not scheduled";
  const s = String(value).replace(/_/g, " ");
  return s.charAt(0).toUpperCase() + s.slice(1);
};

const EnhancedTrackingLayer = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const level = searchParams.get("level") || "";

  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [summary, setSummary] = useState({
    total: 0,
    enhanced: 0,
    high_priority: 0,
    critical: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [itemsPerPage, setItemsPerPage] = useState(PAGE_SIZE_OPTIONS[1]);
  const [currentPage, setCurrentPage] = useState(1);

  const setLevel = (value) => setSearchParams(value ? { level: value } : {});

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await enhancedTrackingAPI.getList({
        level,
        search: searchTerm.trim(),
        page: currentPage,
        perPage: itemsPerPage,
      });
      setRows(data.items || []);
      setTotal(data.total || 0);
      if (data.summary) setSummary(data.summary);
    } catch (err) {
      setError(err.message || "Failed to load enhanced tracking list");
    } finally {
      setLoading(false);
    }
  };

  // back to page 1 whenever the result set changes
  useEffect(() => {
    setCurrentPage(1);
  }, [level, searchTerm, itemsPerPage]);

  useEffect(() => {
    const timer = setTimeout(fetchData, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level, searchTerm, itemsPerPage, currentPage]);

  return (
    <div className="card basic-data-table">
      <div className="card-header">
        <h5 className="card-title mb-0">
          Enhanced Tracking (28 weeks and above)
        </h5>
      </div>

      <div className="card-body">
        <ListTabs>
          <ListTab active={level === ""} onClick={() => setLevel("")}>
            All ({summary.total})
          </ListTab>
          <ListTab
            active={level === "enhanced"}
            onClick={() => setLevel("enhanced")}
          >
            Enhanced ({summary.enhanced})
            <br />
            (28 weeks and above)
          </ListTab>
          <ListTab
            active={level === "high_priority"}
            onClick={() => setLevel("high_priority")}
          >
            High Priority ({summary.high_priority})
            <br />
            (HRP and 28 weeks and above)
          </ListTab>
          <ListTab
            active={level === "critical"}
            onClick={() => setLevel("critical")}
          >
            Critical ({summary.critical})
            <br />
            (HRP, near EDD and not mobilised)
          </ListTab>
        </ListTabs>

        <ListToolbar>
          <ToolbarLeft>
            <EntriesSelect value={itemsPerPage} onChange={setItemsPerPage} />
            <SearchBox
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Search name / mobile / ABHA / RCH"
            />
          </ToolbarLeft>
          <ToolbarRight>
            <RefreshButton onClick={fetchData} disabled={loading} />
          </ToolbarRight>
        </ListToolbar>

        {error && <div className="alert alert-danger py-2">{error}</div>}

        <div className="table-responsive">
          <table className="table bordered-table mb-0">
            <thead>
              <tr>
                <th>Pregnant Woman</th>
                <th>Block / Sub-Centre</th>
                <th>Week</th>
                <th>Last ANC</th>
                <th>Next Due</th>
                <th>ANC Status</th>
                <th>PMSMA</th>
                <th>USG</th>
                <th>Tracking EDD</th>
                <th>Days Left</th>
                <th>Mobilisation</th>
                <th>Level</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan="12" className="text-center py-4">
                    Loading...
                  </td>
                </tr>
              )}
              {!loading && rows.length === 0 && (
                <tr>
                  <td
                    colSpan="12"
                    className="text-center py-4 text-secondary-light"
                  >
                    No pregnant women in enhanced tracking.
                  </td>
                </tr>
              )}
              {!loading &&
                rows.map((r) => (
                  <tr key={r.id}>
                    <td>
                      {r.full_name}
                      {r.is_high_risk && (
                        <span className="badge bg-danger-focus text-danger-main ms-2">
                          HRP
                        </span>
                      )}
                      <div className="text-secondary-light text-sm">
                        {r.mobile_number}
                      </div>
                    </td>
                    <td>
                      {r.block_name || "N/A"}
                      <div className="text-secondary-light text-sm">
                        {r.sub_centre_name || ""}
                      </div>
                    </td>
                    <td>{r.gestational_weeks}</td>
                    <td>
                      {r.last_anc_date
                        ? formatDate(r.last_anc_date)
                        : "No visit"}
                    </td>
                    <td>
                      {r.next_due_visit ? formatDate(r.next_due_visit) : "-"}
                    </td>
                    <td>
                      <span
                        className={`badge ${ANC_BADGE[r.anc_status] || "bg-neutral-200"}`}
                      >
                        {r.anc_status_label}
                        {r.anc_status === "overdue" && r.days_overdue > 0
                          ? ` (${r.days_overdue}d)`
                          : ""}
                      </span>
                    </td>
                    <td>{pretty(r.pmsma_status)}</td>
                    <td>{pretty(r.usg_status)}</td>
                    <td>
                      {r.tracking_edd ? formatDate(r.tracking_edd) : "N/A"}
                    </td>
                    <td>
                      {r.days_remaining === null ||
                      r.days_remaining === undefined ? (
                        "N/A"
                      ) : r.days_remaining < 0 ? (
                        <>
                          <span className="text-danger-main fw-semibold">
                            Delivery pending from DP user
                          </span>
                          {/* <div className="text-secondary-light text-sm">
                            EDD passed {Math.abs(r.days_remaining)} days ago
                          </div> */}
                        </>
                      ) : (
                        `${r.days_remaining} days`
                      )}
                    </td>
                    <td>
                      <span
                        className={`badge ${MOB_BADGE[r.mobilisation_status] || "bg-neutral-200"}`}
                      >
                        {r.mobilisation_status === "none"
                          ? "None"
                          : pretty(r.mobilisation_status)}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`badge ${LEVEL_BADGE[r.level] || "bg-neutral-200"}`}
                      >
                        {r.level_label}
                      </span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        <TableFooter
          total={total}
          unfilteredTotal={total}
          page={currentPage}
          pageSize={itemsPerPage}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
};

export default EnhancedTrackingLayer;
