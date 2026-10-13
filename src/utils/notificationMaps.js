// Shared notification metadata used by NotificationPanel.jsx and
// NotificationLayer.jsx. Kept in one place so adding a new
// notification_type on the backend only needs one frontend edit.

export const typeToPageMap = {
  // USG Appointments
  appointment_scheduled: "/usg-appointment-management",
  appointment_emergency: "/usg-appointment-management",
  appointment_accepted: "/usg-appointment-management",
  appointment_rescheduled: "/usg-appointment-management",
  appointment_cancelled: "/usg-appointment-management",
  appointment_overdue: "/usg-appointment-management",
  report_uploaded: "/usg-appointment-management",
  // PMSMA Sessions
  pmsma_session_scheduled: "/pmsma-scheduling",
  pmsma_session_rescheduled: "/pmsma-scheduling",
  // pmsma_session_completed: "/pmsma-session-management",
  pmsma_session_completed: "/pmsma-sessions",
  high_risk_alert: "/pregnant-women-management",
  // Grievances
  grievance_new: "/grievance-management",
  grievance_assigned: "/grievance-management",
  grievance_in_progress: "/grievance-management",
  grievance_resolved: "/grievance-management",
  grievance_escalated: "/grievance-management",
  grievance_overdue: "/grievance-management",
  // Registrations
  registration_self: "/pregnant-women-management",
  registration_approved: "/pregnant-women-management",
  registration_rejected: "/pregnant-women-management",
  registration_high_risk: "/pregnant-women-management",
  registration_bulk_upload: "/pregnant-women-management",
  // ANC Visits
  anc_visit_recorded: "/anc-visit-management",
  anc_usg_referral: "/anc-visit-management",
  anc_visit_due: "/anc-visit-management",
  // Alerts (spec M)
  anc_due: "/anc-visit-management",
  anc_overdue: "/anc-visit-management",
  anc_visit_missed: "/anc-visit-management",
  hrp_identified: "/pregnant-women-management",
  usg_high_risk_finding: "/pregnant-women-management",
  pmsma_due: "/pmsma-sessions",
  usg_scheduled: "/usg-appointment-management",
  edd_approaching: "/mobilisation-management",
  hrp_near_edd: "/mobilisation-management",
  edd_today_not_admitted: "/mobilisation-management",
  edd_crossed_no_delivery: "/mobilisation-management",
  mobilisation_pending: "/mobilisation-management",
  referral_initiated: "/delivery-referral-management",
  referral_pending: "/delivery-referral-management",
  admission_confirmed: "/delivery-referral-management",
  death_recorded: "/delivery-referral-management",
  // User Management
  user_created: "/users-list",
  user_activated: "/users-list",
  user_deactivated: "/users-list",
  user_permissions_updated: "/users-list",
  password_changed: "/change-password",
  // Administrative
  block_created: "/administrative-management",
  block_deactivated: "/administrative-management",
  sub_centre_created: "/administrative-management",
  sub_centre_deactivated: "/administrative-management",
};

export const getRedirectUrl = (notification) =>
  typeToPageMap[notification.notification_type] || null;

export const categoryIcons = {
  appointment: "solar:calendar-outline",
  pmsma: "solar:health-outline",
  grievance: "solar:document-text-outline",
  registration: "solar:user-plus-outline",
  anc_visit: "solar:health-outline",
  user_management: "solar:settings-outline",
  admin: "solar:shield-user-outline",
  alert: "solar:bell-bing-outline",
  delivery: "solar:hospital-outline",
  system: "solar:info-circle-outline",
};

export const getCategoryIcon = (category) =>
  categoryIcons[category] || categoryIcons.system;

export const priorityColors = {
  low: "#6c757d",
  normal: "#0d6efd",
  high: "#fd7e14",
  urgent: "#dc3545",
};

export const getPriorityColor = (priority) =>
  priorityColors[priority] || priorityColors.normal;

// Options for the category filter dropdown in NotificationLayer.jsx
export const categoryFilterOptions = [
  { value: "appointment", label: "Appointments" },
  { value: "pmsma", label: "PMSMA" },
  { value: "grievance", label: "Grievances" },
  { value: "registration", label: "Registrations" },
  { value: "anc_visit", label: "ANC Visits" },
  { value: "user_management", label: "User Management" },
  { value: "admin", label: "Administrative" },
  { value: "alert", label: "Alerts" },
  { value: "delivery", label: "Delivery" },
];

// Escalated alerts get "[Escalated] " prefix in the title from the backend
export const isEscalated = (n) =>
  !!n?.title && n.title.startsWith("[Escalated]");

// Alerts jinka popup UI mein dikhega (Sub-centre ko turant pata chale).
// List se type hata/jod ke popup control kar sakte ho.
export const POPUP_ALERT_TYPES = [
  "anc_overdue",
  "anc_visit_due",
  "anc_visit_missed",
  "hrp_identified",
  "hrp_near_edd",
  "edd_today_not_admitted",
  "edd_crossed_no_delivery",
  "mobilisation_pending",
  "usg_high_risk_finding",
  "referral_pending",
  "death_recorded",
];

export const isPopupAlert = (n) =>
  !!n && POPUP_ALERT_TYPES.includes(n.notification_type) && !n.is_resolved;
