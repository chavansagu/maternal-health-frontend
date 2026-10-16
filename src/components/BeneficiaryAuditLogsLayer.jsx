import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import {
  ListToolbar,
  ToolbarLeft,
  ToolbarRight,
  EntriesSelect,
  SearchBox,
  RefreshButton,
  TableFooter,
} from "./common/ListControls";
import { beneficiaryAuditAPI } from "../services/api";
import { formatDateTime } from "../utils/dateFormatter";
import BeneficiaryAuditModal from "./BeneficiaryAuditModal";
const STAGE_BADGE = {
  Registered: "bg-neutral-200 text-secondary-light",
  ANC: "bg-info-focus text-info-main",
  Delivered: "bg-success-focus text-success-main",
};

const BeneficiaryAuditLogsLayer = () => {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedPw, setSelectedPw] = useState(null); // row whose audit log is open

  // wait 500ms after the user stops typing before calling the backend
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(t);
  }, [searchTerm]);

  useEffect(() => {
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, itemsPerPage, debouncedSearch]);

  const fetchList = async () => {
    try {
      setLoading(true);
      const res = await beneficiaryAuditAPI.getList(
        (currentPage - 1) * itemsPerPage,
        itemsPerPage,
        debouncedSearch,
      );
      setRows(res.data || []);
      setTotal(res.total || 0);
    } catch (error) {
      console.error("Error loading beneficiaries:", error);
      alert(error.message || "Failed to load beneficiaries");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card h-100 p-0 radius-12">
      {/* Title */}
      <div className="card-header border-bottom bg-base py-16 px-24 d-flex align-items-center gap-3">
        <h6 className="text-lg fw-semibold mb-0">Beneficiaries Audit Logs</h6>
        <span className="text-sm text-secondary-light fw-medium">
          ({total} records)
        </span>
      </div>

      {/* Toolbar */}
      <div className="card-header border-bottom bg-base py-16 px-24">
        <ListToolbar>
          <ToolbarLeft>
            <EntriesSelect
              value={itemsPerPage}
              onChange={(n) => {
                setItemsPerPage(n);
                setCurrentPage(1);
              }}
            />
            <SearchBox
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Search..."
              title="Search by name, mobile, RCH ID, ABHA ID"
            />
          </ToolbarLeft>
          <ToolbarRight>
            <RefreshButton onClick={fetchList} />
          </ToolbarRight>
        </ListToolbar>
      </div>

      {/* Table */}
      <div className="card-body p-24">
        <div className="table-responsive scroll-sm">
          <table className="table bordered-table sm-table mb-0">
            <thead>
              <tr>
                <th scope="col">S.L</th>
                <th scope="col">PW Name</th>
                <th scope="col">Mobile</th>
                <th scope="col">Sub-centre</th>
                <th scope="col">Registered On</th>
                <th scope="col">Current Stage</th>
                <th scope="col" className="text-center">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-4">
                    Loading...
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-4">
                    No beneficiaries found
                  </td>
                </tr>
              ) : (
                rows.map((pw, index) => (
                  <tr key={pw.id}>
                    <td>{(currentPage - 1) * itemsPerPage + index + 1}</td>
                    <td>{pw.full_name}</td>
                    <td>{pw.mobile_number}</td>
                    <td>{pw.sub_centre_name || "-"}</td>
                    <td>{formatDateTime(pw.registered_at)}</td>
                    <td>
                      <span
                        className={`px-16 py-4 rounded-pill fw-medium text-sm ${
                          STAGE_BADGE[pw.current_stage] ||
                          STAGE_BADGE.Registered
                        }`}
                      >
                        {pw.current_stage}
                      </span>
                    </td>
                    <td>
                      <div className="d-flex align-items-center gap-10 justify-content-center">
                        <button
                          className="bg-primary-50 text-primary-600 bg-hover-primary-100 text-hover-primary-800 w-32-px h-32-px d-flex justify-content-center align-items-center rounded-circle"
                          onClick={() => setSelectedPw(pw)}
                          title="Audit Log"
                        >
                          <Icon icon="iconamoon:eye-light" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <TableFooter
          total={total}
          page={currentPage}
          pageSize={itemsPerPage}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* TEMPORARY modal - Step 4 mein isko asli audit popup se replace karenge */}
      {/* {selectedPw && (
        <div
          className="modal fade show d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1060 }}
        >
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  Audit Log - {selectedPw.full_name}
                </h5>
                <button
                  className="btn-close"
                  onClick={() => setSelectedPw(null)}
                ></button>
              </div>
              <div className="modal-body">PW ID: {selectedPw.id}</div>
            </div>
          </div>
        </div>
      )} */}
      {selectedPw && (
        <BeneficiaryAuditModal
          pw={selectedPw}
          onClose={() => setSelectedPw(null)}
        />
      )}
    </div>
  );
};

export default BeneficiaryAuditLogsLayer;
