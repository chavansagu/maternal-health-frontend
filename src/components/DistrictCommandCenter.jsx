import React from "react";

/**
 * District Command Center  (UI only – static placeholders for now)
 *
 * Sits at the very top of the District dashboard:
 *   1. 12 headline cards (blue = normal, red = urgent)
 *   2. "Red / High Priority – Action Required" table
 *   3. 6 monitoring panels (EDD, HRP, ANC, PMSMA/USG, Mobilisation & Referral, Outcomes)
 *   4. Drill-down path
 *
 * Nothing is wired to the API yet. Every number is "00" until we map data:
 * pass `data` later (keys = the `key` fields below) and it will replace the placeholders.
 * Card look reuses the existing `.kpi2` theme (white card, grey border, 4px tone bar).
 */

const BLUE = "#0284c7";
const RED = "#dc2626";

// key is what we will map backend values to later
const CARDS = [
  { key: "active_pw", label: "Active PW", tone: BLUE },
  { key: "hrp", label: "HRP", tone: BLUE },
  { key: "weeks_28_plus", label: "28+ Weeks", tone: BLUE },
  { key: "near_edd", label: "Near EDD", tone: BLUE },
  { key: "hrp_near_edd", label: "HRP + Near EDD", tone: RED },
  { key: "mobilisation_pending", label: "Mobilisation Pending", tone: RED },
  { key: "admitted", label: "Admitted", tone: BLUE },
  { key: "referral_pending", label: "Referral Pending", tone: BLUE },
  { key: "edd_today", label: "EDD Today", tone: RED },
  { key: "overdue", label: "Overdue", tone: RED },
  { key: "maternal_death", label: "Maternal Death", tone: RED },
  {
    key: "neonatal_infant_death",
    label: "Neonatal / Infant Death",
    tone: BLUE,
  },
];

const PRIORITY_COLUMNS = [
  "PW",
  "Block",
  "Sub-centre",
  "HRP",
  "EDD",
  "Days left",
  "Location",
  "Status",
  "Owner",
  "Action",
  "Priority",
  "Follow-up",
];

// `w` = placeholder bar width (%) so the panel looks like the design until data is mapped
const PANELS_BARS = [
  {
    key: "edd_monitoring",
    title: "EDD Monitoring",
    rows: [
      { key: "today", label: "EDD today", w: 88, metric: "edd_b_today" },
      { key: "d1_3", label: "1–3 days", w: 80, metric: "edd_b_1_3" },
      { key: "d4_7", label: "4–7 days", w: 70, metric: "edd_b_4_7" },
      { key: "d8_10", label: "8–10 days", w: 60, metric: "edd_b_8_10" },
      { key: "d11_15", label: "11–15 days", w: 50, metric: "edd_b_11_15" },
      { key: "d16_30", label: "16–30 days", w: 40, metric: "edd_b_16_30" },
      { key: "d30_plus", label: "30+ days", w: 30, metric: "edd_b_30_plus" },
    ],
  },
  {
    key: "hrp_monitoring",
    title: "HRP Monitoring",
    rows: [
      { key: "total", label: "Total", w: 88, metric: "hrp" },
      {
        key: "by_condition",
        label: "By condition",
        w: 86,
        metric: "hrp_by_condition",
      },
      { key: "by_block", label: "By block", w: 76, metric: "hrp_by_block" },
      { key: "near_edd", label: "Near EDD", w: 60, metric: "hrp_near_edd" },
      {
        key: "not_mobilised",
        label: "Not mobilised",
        w: 50,
        metric: "hrp_not_mobilised",
      },
      { key: "admitted", label: "Admitted", w: 40, metric: "hrp_admitted" },
      { key: "referred", label: "Referred", w: 26, metric: "hrp_referred" },
    ],
  },
  {
    key: "anc_compliance",
    title: "ANC Compliance",
    rows: [
      { key: "completed", label: "Completed", w: 90, metric: "anc_completed" },
      { key: "due", label: "Due", w: 86, metric: "anc_due" },
      { key: "overdue", label: "Overdue", w: 72, metric: "anc_overdue" },
      { key: "w28_done", label: "28+ wk done", w: 56, metric: "anc_w28_done" },
      {
        key: "w28_missed",
        label: "28+ wk missed",
        w: 44,
        metric: "anc_w28_missed",
      },
    ],
  },
];
// panels shown as clickable number buttons (2 x 2)
const PANELS_STATS = [
  {
    key: "pmsma_usg",
    title: "PMSMA / USG",
    items: [
      { key: "scheduled", label: "Scheduled", metric: "pmsma_usg_scheduled" },
      { key: "completed", label: "Completed", metric: "pmsma_usg_completed" },
      { key: "pending", label: "Pending", metric: "pmsma_usg_pending" },
      { key: "hrp_found", label: "HRP found", metric: "pmsma_usg_hrp_found" },
    ],
  },
  {
    key: "mobilisation_referral",
    title: "Mobilisation & Referral",
    items: [
      { key: "pending", label: "Pending", metric: "mob_pending" },
      { key: "planned", label: "Planned", metric: "mob_planned" },
      { key: "mobilised", label: "Mobilised", metric: "mob_mobilised" },
      { key: "admitted", label: "Admitted", metric: "admitted" },
      { key: "referral", label: "Referral status", metric: "referral_open" },
    ],
  },
];
const PANELS_TEXT = [
  // {
  //   key: "pmsma_usg",
  //   title: "PMSMA / USG",
  //   lines: ["Scheduled | Completed", "Pending | HRP found"],
  // },
  // {
  //   key: "mobilisation_referral",
  //   title: "Mobilisation & Referral",
  //   lines: ["Pending | Planned | Mobilised", "Admitted | Referral status"],
  // },
  {
    key: "outcomes",
    title: "Outcomes",
    lines: ["Deliveries | Live birth", "Stillbirth | Deaths"],
  },
];

const DRILL_PATH = [
  "District",
  "Block",
  "Sub-centre",
  "Village / Ward",
  "Pregnant Woman",
  "Case Timeline",
];

const CC_CSS = `
.cc-card { text-align: center; padding: 14px 10px 12px 14px; cursor: default; }
.cc-card:hover { box-shadow: none; border-color: var(--neutral-200, #e5e7eb); }
.cc-card .kpi2-value { margin: 0; font-size: 26px; }
.cc-card .kpi2-label { display: block; margin-top: 6px; font-size: 13px; }
.cc-card.clickable { cursor: pointer; }
.cc-card.clickable:hover { box-shadow: 0 8px 22px rgba(15, 23, 42, .09); border-color: var(--kpi-tone); }
.cc-card.active { border-color: var(--kpi-tone); box-shadow: 0 0 0 3px var(--kpi-soft); }
.cc-card.urgent { background: rgba(220, 38, 38, .06); border-color: rgba(220, 38, 38, .55); }

.cc-red-box { border: 2px solid rgba(220, 38, 38, .6); border-radius: 14px; background: rgba(220, 38, 38, .04); padding: 14px 16px 16px; }
.cc-red-title { margin: 0 0 12px; text-align: center; font-size: 16px; font-weight: 700; color: #dc2626; letter-spacing: .2px; }
.cc-table-wrap { overflow-x: auto; }
.cc-table { width: 100%; min-width: 980px; border-collapse: separate; border-spacing: 4px; table-layout: fixed; }
.cc-table th { background: rgba(220, 38, 38, .14); color: var(--text-primary-light, #0f172a); font-size: 12px; font-weight: 600;
  text-align: center; padding: 7px 4px; border-radius: 8px; border: 1px solid rgba(220, 38, 38, .35); }
.cc-table td { background: var(--white, #fff); height: 30px; border-radius: 8px; border: 1px solid rgba(220, 38, 38, .25);
  text-align: center; font-size: 12px; padding: 4px; color: var(--text-secondary-light, #64748b); }
.cc-table td.cc-empty { color: var(--text-secondary-light, #94a3b8); }

.cc-panel { height: 100%; box-sizing: border-box; background: var(--white, #fff); border: 1px solid var(--neutral-200, #e5e7eb);
  border-radius: 14px; padding: 14px 16px 16px; }
.cc-panel h6 { margin: 0 0 10px; font-size: 15px; font-weight: 700; color: #1e3a8a; }
.cc-bar-row { display: flex; align-items: center; gap: 10px; margin-bottom: 7px; font-size: 12.5px; }
.cc-bar-row:last-child { margin-bottom: 0; }
.cc-bar-label { width: 96px; flex-shrink: 0; color: var(--text-secondary-light, #64748b); }
.cc-bar-track { flex: 1; height: 10px; border-radius: 3px; background: var(--neutral-100, #f1f5f9); overflow: hidden; }
.cc-bar-fill { display: block; height: 100%; background: #94a3b8; opacity: .55; border-radius: 3px; }
.cc-bar-val { width: 28px; text-align: right; font-weight: 700; font-variant-numeric: tabular-nums; color: var(--text-primary-light, #0f172a); }
.cc-stat-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.cc-stat { font: inherit; width: 100%; box-sizing: border-box; text-align: center; padding: 10px 8px; cursor: pointer;
  background: var(--white, #fff); border: 1px solid var(--neutral-200, #e5e7eb); border-radius: 10px;
  transition: box-shadow .15s, border-color .15s; }
.cc-stat:hover:not(:disabled) { box-shadow: 0 6px 16px rgba(15, 23, 42, .09); border-color: #1e3a8a; }
.cc-stat:focus-visible { outline: 2px solid #1e3a8a; outline-offset: 2px; }
.cc-stat:disabled { cursor: default; }
.cc-stat-grid .cc-stat:last-child:nth-child(odd) { grid-column: 1 / -1; }
.cc-stat-val { display: block; font-size: 22px; font-weight: 700; font-variant-numeric: tabular-nums;
  color: var(--text-primary-light, #0f172a); }
.cc-stat-label { display: block; margin-top: 2px; font-size: 12.5px; color: var(--text-secondary-light, #64748b); }
.cc-stat.hrp .cc-stat-val { color: #dc2626; }
.cc-text-panel { display: flex; flex-direction: column; justify-content: center; }
.cc-text-panel p { margin: 0 0 4px; text-align: center; font-size: 13px; color: var(--text-secondary-light, #475569); }

.cc-drill { display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 8px; padding: 10px 14px;
  border: 1px solid #bfdbfe; background: rgba(2, 132, 199, .08); border-radius: 10px; font-size: 13px; font-weight: 600; color: #1e3a8a; }
.cc-drill .sep { opacity: .6; }
`;

const fmt = (v) => {
  if (v === undefined || v === null) return "00";
  if (typeof v === "number")
    return v < 10 ? `0${v}` : v.toLocaleString("en-IN");
  return v;
};

// cards that open a list below them (add a key here when its list is ready)
const CLICKABLE = [
  "active_pw",
  "hrp",
  "weeks_28_plus",
  "near_edd",
  "hrp_near_edd",
  "mobilisation_pending",
  "admitted",
  "referral_pending",
  "edd_today",
  "overdue",
  "maternal_death",
  "neonatal_infant_death",
];

const DistrictCommandCenter = ({
  data = {},
  priorityRows = [],
  onCardClick,
  activeCard,
  children,
}) => {
  // pad to at least 3 visible rows like the design
  const rows = [...priorityRows];
  while (rows.length < 3) rows.push(null);

  return (
    <div className="mb-24">
      <style>{CC_CSS}</style>

      {/* 1. headline cards */}
      <div className="row row-cols-xl-6 row-cols-md-3 row-cols-2 gy-3 mb-24">
        {CARDS.map((c) => (
          <div className="col" key={c.key}>
            <div
              className={`kpi2 cc-card${c.tone === RED ? " urgent" : ""}${
                CLICKABLE.includes(c.key) ? " clickable" : ""
              }${activeCard === c.key ? " active" : ""}`}
              style={{ "--kpi-tone": c.tone, "--kpi-soft": `${c.tone}1f` }}
              {...(CLICKABLE.includes(c.key) && onCardClick
                ? {
                    role: "button",
                    tabIndex: 0,
                    onClick: () => onCardClick(c.key, c.label),
                    onKeyDown: (e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onCardClick(c.key, c.label);
                      }
                    },
                  }
                : {})}
            >
              <p className="kpi2-value">{fmt(data[c.key])}</p>
              <span className="kpi2-label">{c.label}</span>
            </div>
          </div>
        ))}
      </div>
      {/* list opened by a card click (rendered by the page) */}
      {children}
      {/* 2. red / high priority */}
      <div className="cc-red-box mb-24">
        <h6 className="cc-red-title">RED / HIGH PRIORITY – ACTION REQUIRED</h6>
        <div className="cc-table-wrap">
          <table className="cc-table">
            <thead>
              <tr>
                {PRIORITY_COLUMNS.map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r?.id ?? `empty-${i}`}>
                  {PRIORITY_COLUMNS.map((h) => (
                    <td key={h} className={r ? "" : "cc-empty"}>
                      {r ? (r[h] ?? "—") : ""}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. monitoring panels */}
      <div className="row row-cols-xl-3 row-cols-md-2 row-cols-1 gy-3 mb-16">
        {PANELS_BARS.map((p) => (
          <div className="col" key={p.key}>
            <div className="cc-panel">
              <h6>{p.title}</h6>
              {p.rows.map((r) => {
                const panelData = data[p.key];
                const v = panelData?.[r.key];
                // real data -> bar length relative to the biggest row of this panel; no data yet -> design placeholder
                const max = panelData
                  ? Math.max(1, ...Object.values(panelData).map(Number))
                  : 0;
                const width = panelData ? ((Number(v) || 0) / max) * 100 : r.w;
                const clickable = r.metric && onCardClick;
                return (
                  <div
                    className="cc-bar-row"
                    key={r.key}
                    style={clickable ? { cursor: "pointer" } : undefined}
                    {...(clickable
                      ? {
                          role: "button",
                          tabIndex: 0,
                          onClick: () =>
                            onCardClick(r.metric, `${p.title} – ${r.label}`),
                          onKeyDown: (e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              onCardClick(r.metric, `${p.title} – ${r.label}`);
                            }
                          },
                        }
                      : {})}
                  >
                    <span className="cc-bar-label">{r.label}</span>
                    <span className="cc-bar-track">
                      <span
                        className="cc-bar-fill"
                        style={{ width: `${width}%` }}
                      />
                    </span>
                    <span className="cc-bar-val">{fmt(v)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        {PANELS_STATS.map((p) => (
          <div className="col" key={p.key}>
            <div className="cc-panel">
              <h6>{p.title}</h6>
              <div className="cc-stat-grid">
                {p.items.map((it) => (
                  <button
                    type="button"
                    key={it.key}
                    className={`cc-stat${it.key === "hrp_found" ? " hrp" : ""}`}
                    disabled={!onCardClick}
                    onClick={() =>
                      onCardClick(it.metric, `${p.title} – ${it.label}`)
                    }
                  >
                    <span className="cc-stat-val">
                      {fmt(data[p.key]?.[it.key])}
                    </span>
                    <span className="cc-stat-label">{it.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ))}
        {PANELS_TEXT.map((p) => (
          <div className="col" key={p.key}>
            <div className="cc-panel cc-text-panel">
              <h6>{p.title}</h6>
              {p.lines.map((l) => (
                <p key={l}>{l}</p>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* 4. drill-down path */}
      <div className="cc-drill">
        <span>Drill-down:</span>
        {DRILL_PATH.map((d, i) => (
          <React.Fragment key={d}>
            {i > 0 && <span className="sep">&gt;</span>}
            <span>{d}</span>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default DistrictCommandCenter;
