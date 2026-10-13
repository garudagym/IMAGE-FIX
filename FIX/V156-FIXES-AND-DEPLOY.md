# Garuda Fitness Zone V156 — image storage, login persistence, member and payment admin fixes

## Changes in V156
- New image uploads use Cloudinary when `CLOUDINARY_URL` is configured on Render. Until it is configured, the existing MongoDB Media storage remains as a backwards-compatible fallback. Old `/api/media/:id` image URLs continue to work.
- Image upload response shape remains `{ files: [{ url, id, name, type, size }] }`, so member/product/gallery clients can persist the returned URL.
- `index.html` is not browser-cached across deployments; backend client is cache-busted to `v156`.
- Saved authentication tokens are validated on page load through `/api/auth/me`. A valid admin/member session reloads the appropriate dashboard and server data; invalid/expired tokens are cleared. JWT validity remains limited to seven days.
- Member editing uses an explicit editing member code and always PATCHes that record. Creating a member always POSTs and lets the server reject duplicate IDs; browser-local member-list contents no longer determine whether an edit is a create.
- Admin Members and Add New Member are separate navigation options. Members has search by name/member ID/phone, edit, delete, and Mark as Paid controls. The overview's duplicated combined directory is hidden.
- Payments has separate search inputs for members to mark paid and payment history.
- Indian phone inputs accept a local 10-digit mobile number. The backend normalizes it to `+91` and rejects invalid 10-digit Indian mobile numbers. Existing international numbers with an explicit `+` are preserved.
- Manual fee recording uses an idempotency key and a MongoDB transaction so a retry cannot create duplicate payment records or extend the due date twice. The payment and fee extension are recorded before attempting delivery.
- Payment confirmation is sent through the configured `SMS_PROVIDER`. If `SMS_PROVIDER=meta-whatsapp`, this is an approved WhatsApp template message (not carrier SMS); for actual SMS use a configured SMS provider such as Twilio or a compatible generic API. Delivery status/error is recorded and payment success is not rolled back if message delivery fails.

## Render environment
- Keep the existing MongoDB and JWT variables.
- For Cloudinary, create a free account and set `CLOUDINARY_URL` in Render Environment using `cloudinary://API_KEY:API_SECRET@CLOUD_NAME` with your account values (URL-encode special characters). Do not put it in frontend code or commit it to GitHub.
- For Meta WhatsApp payment confirmations, set `SMS_PROVIDER=meta-whatsapp`, `META_ACCESS_TOKEN`, `META_PHONE_NUMBER_ID`, `META_API_VERSION`, `META_TEMPLATE_LANGUAGE`, and `META_TEMPLATE_PAYMENT` to an approved template with three body variables in this order: member name, amount, due date.
- For actual SMS rather than WhatsApp, configure `SMS_PROVIDER=twilio` with `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and `TWILIO_FROM`, or configure a supported generic SMS API. Indian SMS delivery may require provider-specific DLT registration/templates/consent.
- Do not share credentials in chat or source control. Rotate any token that has been exposed.

## Deploy and verify
1. Use this folder's contents as the Render root (the folder containing `package.json`), not an extra nested `FIX/FIX`.
2. Render build command: `npm install`; start command: `npm start`.
3. Add `CLOUDINARY_URL` in Render Environment before testing Cloudinary uploads. If absent, upload still uses MongoDB media fallback.
4. Test login + refresh for admin and member; test a member edit and verify the member count does not increase; test new-member duplicate ID handling; search members and payment history; mark a test member paid and verify payment, due date, and message status.
5. Upload one test member photo, product image, and gallery image; verify the URL saved in MongoDB and the image still loads after a page refresh and a Render redeploy.

## Production notes
- MongoDB transaction support is required for the manual-payment atomicity guarantee; MongoDB Atlas supports transactions on replica-set deployments.
- Live Cloudinary, Render, MongoDB and messaging delivery cannot be verified from this local package without the user's accounts and credentials.
