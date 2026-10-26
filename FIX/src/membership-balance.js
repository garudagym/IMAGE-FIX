const SUCCESS_STATUSES = /^(paid|success|captured|completed)$/i;

function normalizeDate(value) {
  if (!value) return '';
  const match = String(value).match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : '';
}

async function getMembershipBalance(member, billingPeriodDueDate = member?.feeDueDate, session = null) {
  const { Payment } = require('./models');
  const period = normalizeDate(billingPeriodDueDate);
  const fee = Math.max(0, Number(member?.monthlyFee) || 0);
  if (!member?.memberCode || !period || fee <= 0) {
    return { fee, paid: 0, balance: fee, billingPeriodDueDate: period, paymentCount: 0 };
  }
  let query = Payment.find({
    memberId: member.memberCode,
    mode: 'membership-renewal',
    billingPeriodDueDate: period,
    status: SUCCESS_STATUSES
  }).select('amount').lean();
  if (session) query = query.session(session);
  const payments = await query;
  const paid = payments.reduce((sum, payment) => sum + Math.max(0, Number(payment.amount) || 0), 0);

  // Older records have no billing-period allocation. If one falls in the current
  // 30-day billing window, the correct period cannot be inferred safely from
  // the legacy schema, so do not send a potentially incorrect dues amount.
  const periodStart = addDaysISO(period, -30);
  let legacyQuery = Payment.find({
    memberId: member.memberCode,
    mode: 'membership-renewal',
    billingPeriodDueDate: { $exists: false },
    date: { $gte: new Date(`${periodStart}T00:00:00.000Z`), $lte: new Date() },
    status: SUCCESS_STATUSES
  }).select('amount date').lean();
  if (session) legacyQuery = legacyQuery.session(session);
  const legacyPayments = await legacyQuery;
  const legacyBalanceUncertain = legacyPayments.length > 0;
  return {
    fee,
    paid,
    balance: Math.max(0, Math.round((fee - paid) * 100) / 100),
    billingPeriodDueDate: period,
    paymentCount: payments.length,
    legacyBalanceUncertain,
    legacyPaymentCount: legacyPayments.length
  };
}

function addDaysISO(value, days) {
  const normalized = normalizeDate(value) || new Date().toISOString().slice(0, 10);
  const [year, month, day] = normalized.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function indiaToday(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(now);
  const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function daysUntil(dueDate, today = indiaToday()) {
  const due = normalizeDate(dueDate);
  const current = normalizeDate(today);
  if (!due || !current) return null;
  const [dy, dm, dd] = due.split('-').map(Number);
  const [ty, tm, td] = current.split('-').map(Number);
  return Math.round((Date.UTC(dy, dm - 1, dd) - Date.UTC(ty, tm - 1, td)) / 86400000);
}

module.exports = { getMembershipBalance, addDaysISO, indiaToday, daysUntil, normalizeDate };
