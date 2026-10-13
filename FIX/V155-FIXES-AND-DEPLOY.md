# Garuda Fitness Zone V155 — persistence, member CRUD, loader and reminders

## Changes
- MongoDB connection accepts `MONGO_URI` (as documented for Render) or the legacy `MONGO_USER`, `MONGO_PASSWORD`, `MONGO_CLUSTER` values.
- Member API responses now expose `id` as the canonical `memberCode`, fixing admin rows that previously rendered undefined IDs and therefore failed Edit/Delete for database-loaded members.
- Added authenticated `GET /api/members/:memberCode` for fresh member data before editing.
- Member lookup, update and delete normalize member codes case-insensitively; linked attendance/notifications are removed using the canonical stored code.
- Admin edit loads current server values and fills phone/address fields, and member-photo upload now fails visibly if the server doesn't return a persisted URL.
- Admin deletion refreshes the authoritative server member list after deletion.
- Reworked the API loading overlay to use a smoother iOS-inspired fade/scale and subtle activity indicator with reduced-motion support.
- Renewal reminder parameters are now `[memberName, monthlyFee, feeDueDate]`, matching a 3-variable approved renewal template. Scheduler checks once each day at 09:00 India time and targets 7, 3, 1, 0 and 3 days overdue. Notifications are deduplicated by member, due date and reminder offset.
- Cache-busted backend client to v155.

## Required Render configuration
- Set either `MONGO_URI` to the full MongoDB Atlas connection string, OR the three legacy `MONGO_USER`, `MONGO_PASSWORD`, `MONGO_CLUSTER` values.
- Set `SMS_PROVIDER=meta-whatsapp`, `META_ACCESS_TOKEN`, `META_PHONE_NUMBER_ID`, `META_API_VERSION`, `META_TEMPLATE_LANGUAGE` and the exact approved template names.
- The renewal template must have exactly three body variables in this order: member name, fee amount, due date. Example env names: `META_TEMPLATE_RENEWAL=gfz_membership_renewal`.
- Do not deploy a real token in source control. Rotate any token that has been shared in chat or logs.
- The in-process scheduler assumes one Render web instance. If scaling to multiple instances, move reminders to one dedicated Render Cron Job/worker or implement a distributed lock.

## Deploy
1. Replace repository contents with this folder's contents (not an extra nested `FIX/FIX`).
2. Render root directory should point to the folder containing `package.json`; build `npm install`, start `npm start`.
3. Set production environment variables and redeploy.
4. Test `/healthz`, admin login, edit/delete with a non-demo test member, upload member and product images, reload/restart, and check that image URLs still load.
5. First run reminder logic against test members and verify Meta template delivery before enabling live notifications.

## Limitations to verify in production
This patch can be syntax/static-tested locally, but MongoDB credentials, Render deployment, Meta template approval and actual WhatsApp delivery must be verified in the deployed environment.
