const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/**
 * Generates a human-readable task name from master name + date range.
 * Examples:
 *  "Jasmine Garland — Aug 1–15 Task"
 *  "Jasmine Garland — Aug 5 – Sep 3 Task"
 */
const generateTaskName = (masterName, startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);

  const startMonth = MONTHS[start.getMonth()].slice(0, 3);
  const endMonth = MONTHS[end.getMonth()].slice(0, 3);
  const startDay = start.getDate();
  const endDay = end.getDate();

  let rangeLabel;
  if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
    rangeLabel = `${startMonth} ${startDay}\u2013${endDay}`;
  } else {
    rangeLabel = `${startMonth} ${startDay} \u2013 ${endMonth} ${endDay}`;
  }

  return `${masterName} \u2014 ${rangeLabel} Task`;
};

module.exports = { generateTaskName };
