# V154 fixes and deployment

## Fixes
- Product image uploads now fail clearly if a selected file does not return a persisted server URL; uploaded URL takes priority over fallback images.
- Member deletion uses the authenticated MongoDB API and removes the member plus linked attendance and notifications. The demo account GFZ-1001 remains protected unless `ALLOW_DELETE_DEMO_MEMBER=true`.
- Adds server-side manual membership payment recording at `POST /api/payments/manual`; records payment, extends the fee due date by 30 days, creates an in-app notification, and attempts WhatsApp template delivery.
- Adds Meta WhatsApp Cloud API support through environment variables. Proactive messages require approved templates.
- Adds a shared iOS-style loading overlay with a counter so overlapping requests do not hide it too early.
- Cache-busts `backend-client.js` to v154.

## Render environment variables
Keep existing MongoDB and JWT values. Set admin login values in Render Environment:

- `ADMIN_USERNAME` — desired admin login username
- `ADMIN_PIN` — desired admin PIN/password (use a strong value; changing it redeploys and updates the admin hash at startup)
- `ADMIN_NAME` — display name

For Meta WhatsApp Cloud API, add:

- `SMS_PROVIDER=meta-whatsapp`
- `META_ACCESS_TOKEN` — access token (secret)
- `META_PHONE_NUMBER_ID` — WhatsApp sender phone number ID
- `META_API_VERSION=v23.0` (use a Graph API version supported by your Meta app)
- `META_TEMPLATE_LANGUAGE=en_US` (must match approved template language)
- `META_TEMPLATE_PAYMENT` — exact approved payment confirmation template name with 3 body variables (member name, amount, due date/order reference)
- `META_TEMPLATE_RENEWAL` — exact approved renewal reminder template name with 3 body variables: member name, fee amount, due date
- `META_TEMPLATE_GENERIC` — optional approved generic template for other notification types

`META_WABA_ID` is not required to send messages; it is useful for template management but not used by the send endpoint. Never put access tokens in frontend code or GitHub.

## Deploy into existing GitHub structure
This project folder's contents should replace the contents of your repository's `FIX/` folder (do not add an extra nested folder). Keep Render Root Directory set to `FIX`, Build Command `npm install`, Start Command `npm start`. Commit/push to `main`; Render should deploy the commit.

## Verification performed
- `npm run check` passed
- `node --check public/backend-client.js` passed
- Static smoke test passed
- All inline scripts in `public/index.html` passed `node --check`

Live MongoDB, Meta credentials, and real phone delivery must still be verified in your Render environment.
