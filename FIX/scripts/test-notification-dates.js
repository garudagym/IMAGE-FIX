const assert = require('node:assert/strict');
const { daysUntil, addDaysISO } = require('../src/membership-balance');

assert.equal(daysUntil('2026-10-29', '2026-10-26'), 3);
assert.equal(daysUntil('2026-10-28', '2026-10-26'), 2);
assert.equal(daysUntil('2026-10-27', '2026-10-26'), 1);
assert.equal(daysUntil('2026-10-26', '2026-10-26'), 0);
assert.equal(daysUntil('2026-10-25', '2026-10-26'), -1);
assert.equal(addDaysISO('2026-10-26', 30), '2026-11-25');
assert.equal(addDaysISO('2026-03-01', -1), '2026-02-28');
console.log('Notification date tests passed.');
