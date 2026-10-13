# Garuda Fitness Zone V159 — Fixes and deployment

## Included changes
- Member top-page weight progress now reflects the selected gaining/losing goal, the latest weight, and the previous recorded weight. Green indicates progress toward the goal, red indicates movement away from the goal, and black indicates no change.
- Weight-goal progress preview reacts to edits before saving.
- Removed the duplicate Pay Fee button from the member fee card. The existing Renew button remains; it turns red only when the fee due date is within 3 days (including the due date). Expired members retain the inactive status and attendance-calendar lock.
- Expiry popup uses Renew as the action for expired membership.
- Admin Members gets persistent All Members / Paid / Not Paid filters above search. Paid status is derived from a recorded paid membership-renewal payment in the current 30-day billing window, rather than merely treating any future due date as paid.
- Biometric attendance/door control remains out of scope for this version, as requested.

## Deploy
1. Extract this archive and copy the contents of `FIX/` into the root of the existing GitHub repository; do not create `FIX/FIX`.
2. Commit and push to the branch connected to Render.
3. Wait for Render deployment and hard-refresh the site on mobile.
4. Test with a non-critical member: change the weight goal/current weight, check the top progress card, inspect the Renew button before/during the three-day window, and verify the admin Paid/Not Paid filters.

Do not run the production seed against existing member data.

## Validation
Backend syntax checks, all inline script syntax checks, static smoke test, and the existing 13 targeted regression checks passed. Live Render, database, payment, and messaging behavior was not available for verification in this environment.
