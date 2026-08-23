/**
 * Central calculation utilities used consistently across
 * daily records, tasks, dashboard, and reports.
 */

const round2 = (num) => Math.round((Number(num) + Number.EPSILON) * 100) / 100;

const calculateDailyAmount = (quantity, rate) => round2(Number(quantity || 0) * Number(rate || 0));

const calculatePaymentStatus = (totalAmount, totalPaid) => {
  if (totalPaid <= 0) return 'Pending';
  if (totalPaid >= totalAmount && totalAmount > 0) return 'Paid';
  return 'Partially Paid';
};

const calculateProgress = (completedDays, totalDays) => {
  if (!totalDays) return 0;
  return round2((completedDays / totalDays) * 100);
};

/**
 * Recomputes and returns aggregate fields for a task based on its daily records.
 * Does not save - caller is responsible for persisting.
 */
const aggregateTaskFromRecords = (records) => {
  let completedDays = 0;
  let missedDays = 0;
  let totalQuantity = 0;
  let totalAmount = 0; // earned (completed only)
  let expectedAmount = 0; // sum across all planned days (quantity*rate for every record that has a quantity)

  for (const r of records) {
    if (r.status === 'COMPLETED') {
      completedDays += 1;
      totalQuantity += Number(r.quantity || 0);
      totalAmount += Number(r.amount || 0);
    }
    if (r.status === 'MISSED') {
      missedDays += 1;
    }
    expectedAmount += Number(r.amount || 0);
  }

  return {
    completedDays,
    missedDays,
    totalQuantity: round2(totalQuantity),
    totalAmount: round2(totalAmount),
    expectedAmount: round2(expectedAmount),
  };
};

module.exports = {
  round2,
  calculateDailyAmount,
  calculatePaymentStatus,
  calculateProgress,
  aggregateTaskFromRecords,
};
