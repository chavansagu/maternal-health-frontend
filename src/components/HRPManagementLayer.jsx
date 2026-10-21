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
import { hrpAPI } from "../services/api";
import { formatDate } from "../utils/dateFormatter";
import HRPDetailModal from "./HRPDetailModal";

const STATUS_BADGE = {
  no_risk: "bg-neutral-200 text-neutral-700",
  risk_identified: "bg-warning-focus text-warning-main",
  under_follow_up: "bg-info-focus text-info-main",
  multiple_conditions: "bg-danger-focus text-danger-main",
  delivery_planned: "bg-success-focus text-success-main",
  case_closed: "bg-neutral-200 text-neutral-700",
};

const SOURCE_OPTIONS = [
  { value: "", label: "All sources" },
  { value: "mcp_card", label: "MCP Card" },
  // { value: "difficult_area", label: "Difficult Area" },
  // { value: "migrant_worker", label: "Migrant Worker" },
  { value: "pmsma", label: "PMSMA" },
  { value: "usg", label: "USG" },
  { value: "anc_auto", label: "ANC" },
  { value: "manual", label: "Manual" },
];

const MAX_CHIPS = 3;

const HRPManagementLayer = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const status = searchParams.get("status") || "";

  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [summary, setSummary] = useState({ total: 0, by_status: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [source, setSource] = useState("");
  const [itemsPerPage, setItemsPerPage] = useState(PAGE_SIZE_OPTIONS[1]);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedPwId, setSelectedPwId] = useState(null);

  const setStatus = (value) => setSearchParams(value ? { status: value } : {});

  const countOf = (key) =>
    (summary.by_status.find((s) => s.status === key) || {}).count || 0;
  const allOpenCount =
    summary.total - countOf("case_closed") - countOf("no_risk");

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const [list, sum] = await Promise.all([
        hrpAPI.getList({
          status,
          source,
          search: searchTerm.trim(),
          page: currentPage,
          perPage: itemsPerPage,
        }),
        hrpAPI.getSummary(),
      ]);
      setRows(list.items || []);
      setTotal(list.total || 0);
      setSummary(sum);
    } catch (err) {
      setError(err.message || "Failed to load HRP list");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [status, source, searchTerm, itemsPerPage]);

  useEffect(() => {
    const timer = setTimeout(fetchData, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, source, searchTerm, itemsPerPage, currentPage]);

  return (
    <div className="card basic-data-table">
      <div className="card-header">
        <h5 className="card-title mb-0">High-Risk Pregnancy (HRP)</h5>
      </div>

      <div className="card-body">
        <ListTabs>
          <ListTab active={status === ""} onClick={() => setStatus("")}>
            All Open ({allOpenCount})
          </ListTab>
          <ListTab
            active={status === "risk_identified"}
            onClick={() => setStatus("risk_identified")}
          >
            Risk identified ({countOf("risk_identified")})
          </ListTab>
          <ListTab
            active={status === "multiple_conditions"}
            onClick={() => setStatus("multiple_conditions")}
          >
            Multiple HRP conditions ({countOf("multiple_conditions")})
          </ListTab>
          <ListTab
            active={status === "under_follow_up"}
            onClick={() => setStatus("under_follow_up")}
          >
            Under follow-up ({countOf("under_follow_up")})
          </ListTab>
          <ListTab
            active={status === "delivery_planned"}
            onClick={() => setStatus("delivery_planned")}
          >
            Delivery planned ({countOf("delivery_planned")})
          </ListTab>
          <ListTab
            active={status === "case_closed"}
            onClick={() => setStatus("case_closed")}
          >
            Case closed / delivered ({countOf("case_closed")})
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
            <select
              className="form-select form-select-sm w-auto"
              value={source}
              onChange={(e) => setSource(e.target.value)}
            >
              {SOURCE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
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
                <th>EDD</th>
                <th>HRP Conditions (source)</th>
                <th>Flags</th>
                <th>HRP Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan="7" className="text-center py-4">
                    Loading...
                  </td>
                </tr>
              )}
              {!loading && rows.length === 0 && (
                <tr>
                  <td
                    colSpan="7"
                    className="text-center py-4 text-secondary-light"
                  >
                    No HRP cases found.
                  </td>
                </tr>
              )}
              {!loading &&
                rows.map((r) => (
                  <tr key={r.id}>
                    <td>
                      {r.full_name}
                      <div className="text-secondary-light text-sm">
                        {r.mobile_number}
                        {r.age ? ` · ${r.age} yrs` : ""}
                      </div>
                    </td>
                    <td>
                      {r.block_name || "N/A"}
                      <div className="text-secondary-light text-sm">
                        {r.sub_centre_name || ""}
                      </div>
                    </td>
                    <td>{r.edd_date ? formatDate(r.edd_date) : "N/A"}</td>
                    <td>
                      {r.conditions.length === 0 ? (
                        <span className="text-secondary-light text-sm">
                          {r.risk_factors && r.risk_factors !== "None"
                            ? r.risk_factors
                            : "-"}
                        </span>
                      ) : (
                        <>
                          {r.conditions.slice(0, MAX_CHIPS).map((c) => (
                            <span
                              key={c.id}
                              className="badge bg-danger-focus text-danger-main me-1 mb-1"
                              title={`Source: ${c.source_label}`}
                            >
                              {c.condition_name}
                              <small className="ms-1 opacity-75">
                                ({c.source_label})
                              </small>
                            </span>
                          ))}
                          {r.conditions.length > MAX_CHIPS && (
                            <span className="text-secondary-light text-sm">
                              +{r.conditions.length - MAX_CHIPS} more
                            </span>
                          )}
                        </>
                      )}
                    </td>
                    {/* <td>
                      {r.is_difficult_area && (
                        <span className="badge bg-warning-focus text-warning-main me-1">
                          Difficult area
                        </span>
                      )}
                      {r.is_migrant_worker && (
                        <span className="badge bg-info-focus text-info-main">
                          Migrant
                        </span>
                      )}
                      {!r.is_difficult_area && !r.is_migrant_worker && "-"}
                    </td> */}
                    <td>
                      <span
                        className={`badge ${STATUS_BADGE[r.hrp_status] || "bg-neutral-200"}`}
                      >
                        {r.hrp_status_label}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-primary-600"
                        onClick={() => setSelectedPwId(r.id)}
                      >
                        View
                      </button>
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
      {selectedPwId && (
        <HRPDetailModal
          pwId={selectedPwId}
          onClose={() => setSelectedPwId(null)}
          onChanged={fetchData}
        />
      )}
    </div>
  );
};

export default HRPManagementLayer;
