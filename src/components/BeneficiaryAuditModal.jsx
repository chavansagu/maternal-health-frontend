import React, { useState, useEffect } from "react";
import { beneficiaryAuditAPI } from "../services/api";
import { formatDate, formatDateTime } from "../utils/dateFormatter";

const dash = (v) => (v === null || v === undefined || v === "" ? "-" : v);
const dOnly = (v) => (v ? formatDate(v) : "-");
const dTime = (v) => (v ? formatDateTime(v) : "-");
const yesNo = (v) => (v ? "Yes" : "No");
const pretty = (v) =>
  v
    ? String(v)
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase())
    : "-";

/* One block of the audit log: heading + record count + table (or "Not done yet") */
const Section = ({ title, columns, rows }) => {
  const count = rows.length;
  return (
    <div className="mb-24">
      <div className="d-flex align-items-center gap-2 mb-12">
        <h6 className="text-md fw-semibold mb-0">{title}</h6>
        <span
          className={`px-12 py-2 rounded-pill text-xs fw-medium ${
            count > 0
              ? "bg-success-focus text-success-main"
              : "bg-neutral-200 text-secondary-light"
          }`}
        >
          {count > 0
            ? `${count} record${count > 1 ? "s" : ""}`
            : "Not done yet"}
        </span>
      </div>
      {count > 0 && (
        <div className="table-responsive">
          <table className="table bordered-table sm-table mb-0">
            <thead>
              <tr>
                {columns.map((c) => (
                  <th key={c.h}>{c.h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i}>
                  {columns.map((c) => (
                    <td key={c.h}>{c.r(row)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const Field = ({ label, value }) => (
  <div className="col-md-4 col-sm-6 mb-12">
    <div className="text-xs text-secondary-light">{label}</div>
    <div className="text-sm fw-medium">{dash(value)}</div>
  </div>
);

const BeneficiaryAuditModal = ({ pw, onClose }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError("");
        const res = await beneficiaryAuditAPI.getTimeline(pw.id);
        if (!cancelled) setData(res);
      } catch (e) {
        if (!cancelled) setError(e.message || "Failed to load audit log");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pw.id]);

  const p = data?.pregnant_woman;

  // process strip: where is this woman in the journey
  const steps = data
    ? [
        { name: "Registered", done: true },
        { name: "ANC", done: data.anc_visits.length > 0 },
        { name: "USG", done: data.usg_appointments.length > 0 },
        { name: "PMSMA", done: data.pmsma_sessions.length > 0 },
        { name: "HRP", done: data.hrp_conditions.length > 0 },
        { name: "Mobilisation", done: data.mobilisation_cases.length > 0 },
        { name: "Delivery", done: data.delivery.some((r) => r.outcome) },
        { name: "PNC", done: data.pnc_reminders.length > 0 },
      ]
    : [];

  return (
    <div
      className="modal fade show d-block"
      style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1060 }}
    >
      <div className="modal-dialog modal-xl modal-dialog-scrollable">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Audit Log - {pw.full_name}</h5>
            <button className="btn-close" onClick={onClose}></button>
          </div>

          <div className="modal-body">
            {loading ? (
              <div className="text-center py-4">Loading...</div>
            ) : error ? (
              <div className="text-center text-danger py-4">{error}</div>
            ) : (
              <>
                {/* Process strip */}
                <div className="d-flex flex-wrap gap-2 mb-24">
                  {steps.map((s) => (
                    <span
                      key={s.name}
                      className={`px-16 py-4 rounded-pill text-sm fw-medium ${
                        s.done
                          ? "bg-success-focus text-success-main"
                          : "bg-neutral-200 text-secondary-light"
                      }`}
                    >
                      {s.name}
                    </span>
                  ))}
                </div>

                {/* 1. User / PW details */}
                <div className="mb-24">
                  <h6 className="text-md fw-semibold mb-12">
                    Beneficiary Details
                  </h6>
                  <div className="row">
                    <Field label="Name" value={p.full_name} />
                    <Field label="Mobile" value={p.mobile_number} />
                    <Field label="Husband Name" value={p.husband_name} />
                    <Field label="Age" value={p.age} />
                    <Field label="ABHA ID" value={p.abha_id} />
                    <Field label="RCH ID" value={p.rch_id} />
                    <Field label="Address" value={p.address} />
                    <Field label="Village / Ward" value={p.ward_name} />
                    <Field label="Sub-centre" value={p.sub_centre_name} />
                    <Field label="Block" value={p.block_name} />
                    <Field label="District" value={p.district_name} />
                    <Field label="Blood Group" value={p.blood_group} />
                    <Field
                      label="Gravida / Para"
                      value={`${dash(p.gravida)} / ${dash(p.para)}`}
                    />
                    <Field label="LMP" value={dOnly(p.lmp_date)} />
                    <Field label="LMP EDD" value={dOnly(p.lmp_edd_date)} />
                    <Field
                      label="USG EDD"
                      value={
                        p.usg_edd_date
                          ? dOnly(p.usg_edd_date)
                          : "Not captured yet"
                      }
                    />
                    <Field label="Tracking EDD" value={dOnly(p.edd_date)} />
                    <Field label="HRP Status" value={pretty(p.hrp_status)} />
                    <Field label="Registered By" value={p.registered_by} />
                    <Field
                      label="Registered On"
                      value={dTime(p.registered_at)}
                    />
                    <Field
                      label="Pregnancy Outcome"
                      value={
                        p.pregnancy_outcome
                          ? pretty(p.pregnancy_outcome)
                          : "Pregnancy ongoing"
                      }
                    />
                    <Field label="Outcome Date" value={dOnly(p.outcome_date)} />
                  </div>
                </div>

                {/* 2. ANC visits */}
                <Section
                  title="ANC Visits"
                  rows={data.anc_visits}
                  columns={[
                    { h: "Visit #", r: (r) => `#${r.visit_number}` },
                    { h: "Visit Date", r: (r) => dOnly(r.visit_date) },
                    { h: "Weight (kg)", r: (r) => dash(r.weight) },
                    { h: "BP", r: (r) => dash(r.blood_pressure) },
                    { h: "Hb", r: (r) => dash(r.hemoglobin) },
                    { h: "USG Referred", r: (r) => yesNo(r.referred_for_usg) },
                    { h: "Emergency", r: (r) => yesNo(r.is_emergency) },
                    { h: "Next Visit", r: (r) => dOnly(r.next_visit_date) },
                    { h: "Attended By", r: (r) => dash(r.attended_by) },
                  ]}
                />

                {/* 3. EDD change log */}
                <Section
                  title="EDD Change Log"
                  rows={data.edd_history}
                  columns={[
                    { h: "Date & Time", r: (r) => dTime(r.changed_at) },
                    { h: "Previous EDD", r: (r) => dOnly(r.previous_edd) },
                    { h: "New EDD", r: (r) => dOnly(r.new_edd) },
                    {
                      h: "Source",
                      r: (r) =>
                        r.source === "USG_CONFIRMED" ? "USG" : dash(r.source),
                    },
                    { h: "Changed By", r: (r) => dash(r.changed_by) },
                  ]}
                />

                {/* 4. USG */}
                <Section
                  title="USG Appointments"
                  rows={data.usg_appointments}
                  columns={[
                    { h: "Scheduled", r: (r) => dTime(r.scheduled_date) },
                    { h: "USG Centre", r: (r) => dash(r.usg_centre) },
                    { h: "Type", r: (r) => pretty(r.appointment_type) },
                    { h: "Status", r: (r) => pretty(r.status) },
                    {
                      h: "Rescheduled",
                      r: (r) => `${r.reschedule_count || 0} time(s)`,
                    },
                    { h: "Completed On", r: (r) => dTime(r.completed_date) },
                    {
                      h: "Scan / Findings",
                      r: (r) =>
                        [r.scan_type, r.findings].filter(Boolean).join(" - ") ||
                        "-",
                    },
                    { h: "Scheduled By", r: (r) => dash(r.scheduled_by) },
                  ]}
                />

                {/* 5. PMSMA */}
                <Section
                  title="PMSMA Sessions"
                  rows={data.pmsma_sessions}
                  columns={[
                    { h: "Scheduled", r: (r) => dTime(r.scheduled_date) },
                    { h: "Visit #", r: (r) => dash(r.visit_number) },
                    { h: "Visit Type", r: (r) => pretty(r.visit_type) },
                    { h: "Status", r: (r) => pretty(r.status) },
                    { h: "Site", r: (r) => dash(r.site) },
                    { h: "BP / Hb", r: (r) => `${dash(r.bp)} / ${dash(r.hb)}` },
                    {
                      h: "HRP Flags",
                      r: (r) =>
                        r.hrp_flags.length ? r.hrp_flags.join(", ") : "-",
                    },
                    { h: "Scheduled By", r: (r) => dash(r.scheduled_by) },
                  ]}
                />

                {/* 6. HRP */}
                <Section
                  title="High-Risk Conditions"
                  rows={data.hrp_conditions}
                  columns={[
                    { h: "Condition", r: (r) => dash(r.condition_name) },
                    { h: "Source", r: (r) => pretty(r.source) },
                    { h: "Identified On", r: (r) => dTime(r.identified_at) },
                    { h: "Identified By", r: (r) => dash(r.identified_by) },
                    {
                      h: "Status",
                      r: (r) => (r.is_active ? "Active" : "Resolved"),
                    },
                    { h: "Resolved On", r: (r) => dTime(r.resolved_at) },
                  ]}
                />
                <Section
                  title="HRP Status Changes"
                  rows={data.hrp_status_logs}
                  columns={[
                    { h: "Date & Time", r: (r) => dTime(r.changed_at) },
                    { h: "Action", r: (r) => pretty(r.action) },
                    { h: "From", r: (r) => pretty(r.old_status) },
                    { h: "To", r: (r) => pretty(r.new_status) },
                    { h: "Note", r: (r) => dash(r.note) },
                    { h: "Changed By", r: (r) => dash(r.changed_by) },
                  ]}
                />

                {/* 7. Mobilisation */}
                <Section
                  title="Mobilisation Cases"
                  rows={data.mobilisation_cases}
                  columns={[
                    { h: "Created", r: (r) => dTime(r.created_at) },
                    { h: "Trigger", r: (r) => pretty(r.trigger_type) },
                    { h: "Priority", r: (r) => pretty(r.priority) },
                    { h: "Status", r: (r) => pretty(r.status) },
                    { h: "Stage", r: (r) => pretty(r.mobilisation_stage) },
                    { h: "Escalation", r: (r) => pretty(r.escalation_level) },
                    { h: "Mobilised By", r: (r) => dash(r.mobilised_by) },
                    { h: "Mobilised On", r: (r) => dTime(r.mobilised_at) },
                  ]}
                />

                {/* 8. Delivery: referral -> admission -> outcome -> discharge */}
                <Section
                  title="Delivery Referral & Outcome"
                  rows={data.delivery}
                  columns={[
                    { h: "Referred On", r: (r) => dTime(r.referred_at) },
                    { h: "Referred By", r: (r) => dash(r.referred_by) },
                    { h: "Delivery Point", r: (r) => dash(r.delivery_point) },
                    { h: "Referral Status", r: (r) => pretty(r.status) },
                    {
                      h: "Admission",
                      r: (r) =>
                        r.admission
                          ? dTime(r.admission.admission_date)
                          : "Pending",
                    },
                    {
                      h: "Delivery",
                      r: (r) =>
                        r.outcome
                          ? `${pretty(r.outcome.delivery_type)} on ${dTime(r.outcome.delivery_date)} (${r.outcome.baby_count} baby)`
                          : "Pending",
                    },
                    {
                      h: "Maternal Outcome",
                      r: (r) =>
                        r.outcome ? pretty(r.outcome.maternal_outcome) : "-",
                    },
                    {
                      h: "Discharge",
                      r: (r) =>
                        r.discharge
                          ? dTime(r.discharge.discharge_date)
                          : "Pending",
                    },
                  ]}
                />

                {/* 9. PNC */}
                <Section
                  title="PNC Visits"
                  rows={data.pnc_reminders}
                  columns={[
                    { h: "Visit", r: (r) => dash(r.visit_label) },
                    { h: "Due Date", r: (r) => dOnly(r.due_date) },
                    { h: "Status", r: (r) => pretty(r.status) },
                    { h: "Completed On", r: (r) => dTime(r.completed_at) },
                    { h: "Completed By", r: (r) => dash(r.completed_by) },
                    { h: "Remarks", r: (r) => dash(r.remarks) },
                  ]}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BeneficiaryAuditModal;
