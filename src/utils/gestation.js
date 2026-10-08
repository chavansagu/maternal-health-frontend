const toInputDate = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

// LMP se aaj tak ke weeks, 28+ ho to enhanced
export const getTrackingFromLmp = (lmp) => {
  if (!lmp) return { weeks: null, isEnhanced: false };
  const weeks = Math.floor(
    (Date.now() - new Date(lmp).getTime()) / (7 * 86400000),
  );
  return { weeks, isEnhanced: weeks >= 28 };
};

// Enhanced -> visit date ke +1 se +7 din; Regular -> +1 din se aage koi bhi
export const getNextVisitRange = (visitDate, isEnhanced) => {
  if (!visitDate) return {};
  const base = new Date(visitDate);
  const min = new Date(base);
  min.setDate(base.getDate() + 1);
  const range = { min: toInputDate(min) };
  if (isEnhanced) {
    const max = new Date(base);
    max.setDate(base.getDate() + 7);
    range.max = toInputDate(max);
  }
  return range;
};
