// Lightweight statistical AI-style insights for expenses.
// Purely frontend, uses existing expenses API responses.

const MILLIS_IN_DAY = 1000 * 60 * 60 * 24;

const startOfMonth = (date) => {
  const d = new Date(date);
  return new Date(d.getFullYear(), d.getMonth(), 1);
};

const monthKey = (date) => {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

/**
 * Groups expenses by month and optionally by group id.
 */
const groupByMonthAndGroup = (expenses) => {
  const map = new Map(); // key: `${monthKey}|${groupId}`

  expenses.forEach((e) => {
    const key = `${monthKey(e.date)}|${e.group}`;
    map.set(key, (map.get(key) || 0) + e.amount);
  });

  return map;
};

/**
 * Estimate next month's spending per group using a simple moving average
 * over the last N months (default 3).
 */
export function predictNextMonth(expenses, monthsWindow = 3) {
  if (!expenses || expenses.length === 0) return { total: 0, perGroup: {} };

  const byMonthGroup = groupByMonthAndGroup(expenses);

  // Collect distinct months
  const months = new Set();
  byMonthGroup.forEach((_, key) => {
    const [m] = key.split('|');
    months.add(m);
  });

  const sortedMonths = Array.from(months).sort();
  const recent = sortedMonths.slice(-monthsWindow);

  const perGroup = {};

  byMonthGroup.forEach((value, key) => {
    const [m, groupId] = key.split('|');
    if (!recent.includes(m)) return;
    if (!perGroup[groupId]) {
      perGroup[groupId] = { sum: 0, months: 0 };
    }
    perGroup[groupId].sum += value;
    perGroup[groupId].months = Math.max(perGroup[groupId].months, 1);
  });

  const resultPerGroup = {};
  let total = 0;

  Object.entries(perGroup).forEach(([groupId, { sum, months }]) => {
    const avg = months > 0 ? sum / monthsWindow : 0;
    resultPerGroup[groupId] = avg;
    total += avg;
  });

  return { total, perGroup: resultPerGroup };
}

/**
 * Detect if the current month spending is significantly higher than
 * the average of previous months.
 */
export function detectOverspend(expenses, threshold = 1.25) {
  if (!expenses || expenses.length === 0) return null;

  const now = new Date();
  const thisMonthKey = monthKey(now);

  const byMonth = new Map();
  expenses.forEach((e) => {
    const key = monthKey(e.date);
    byMonth.set(key, (byMonth.get(key) || 0) + e.amount);
  });

  const months = Array.from(byMonth.keys()).sort();
  if (months.length < 2) return null;

  const thisMonthTotal = byMonth.get(thisMonthKey) || 0;
  const prevMonths = months.filter((m) => m !== thisMonthKey);

  if (prevMonths.length === 0) return null;

  const prevAvg =
    prevMonths.reduce((sum, m) => sum + (byMonth.get(m) || 0), 0) /
    prevMonths.length;

  if (prevAvg === 0) return null;

  const ratio = thisMonthTotal / prevAvg;

  if (ratio >= threshold) {
    return {
      thisMonthTotal,
      prevAvg,
      ratio,
    };
  }

  return null;
}

/**
 * Suggest a safe monthly budget per group: slightly above the moving
 * average to leave some headroom.
 */
export function suggestBudgetsPerGroup(expenses, headroomFactor = 1.1) {
  if (!expenses || expenses.length === 0) return {};

  const byMonthGroup = groupByMonthAndGroup(expenses);
  const monthCounts = new Map(); // groupId -> months counted
  const sums = new Map(); // groupId -> sum of all months

  byMonthGroup.forEach((value, key) => {
    const [, groupId] = key.split('|');

    sums.set(groupId, (sums.get(groupId) || 0) + value);
    monthCounts.set(groupId, (monthCounts.get(groupId) || 0) + 1);
  });

  const budgets = {};

  sums.forEach((sum, groupId) => {
    const months = monthCounts.get(groupId) || 1;
    const avg = sum / months;
    budgets[groupId] = avg * headroomFactor;
  });

  return budgets;
}

/**
 * High-level helper combining all insights in one place for easy use in UI.
 */
export function buildInsights(expenses) {
  const prediction = predictNextMonth(expenses);
  const overspend = detectOverspend(expenses);
  const budgets = suggestBudgetsPerGroup(expenses);

  return {
    prediction,
    overspend,
    budgets,
  };
}
