# Image persistence and Meta messaging setup

## Why uploaded images may not remain saved

This version stores uploaded image bytes in MongoDB (`Media`) and stores the resulting `/api/media/<id>` URL in the gallery/product/member record. That persistence only works when the Node backend is running and connected to the same MongoDB database.

1. Start the backend from this project folder with `npm install` then `npm start`. Do not open `public/index.html` directly and do not use a static-only Live Server; those do not run the `/api/uploads/image` endpoint.
2. Configure the required MongoDB environment variables (`MONGO_USER`, `MONGO_PASSWORD`, `MONGO_CLUSTER`, and optionally `MONGO_DB`) plus `JWT_SECRET`. See `.env.example`.
3. Log in through the site's Admin Portal so `gfz_api_token` is set, then upload from the Admin Gallery or Store product editor.
4. If upload fails, check the browser DevTools Network tab for `POST /api/uploads/image` and the backend terminal logs. The API now returns clearer file-size/type errors. Each image must be 10 MB or smaller; up to 8 images can be uploaded in one request.
5. After a successful upload, check that the gallery/product save request also succeeds. Uploading media and creating a gallery entry are two separate requests. If the first succeeds and the second fails, an unused media record can remain in MongoDB.
6. MongoDB Atlas must allow connections from the server's IP/network and the database user needs write permissions. On a hosted service, set environment variables in that service's dashboard; do not upload `.env`.

## Meta Business messaging

The code integrates **WhatsApp Business Platform / WhatsApp Cloud API**, not ordinary SMS. A Meta access token cannot send a standard carrier SMS by itself. For SMS text messages, use an SMS provider (for example, a provider with Indian DLT-compliant sender/template setup).

For WhatsApp messages, configure these server-side variables in `.env` locally or your hosting provider's environment settings:

- `SMS_PROVIDER=meta-whatsapp`
- `META_ACCESS_TOKEN` — a newly rotated token; keep secret
- `META_PHONE_NUMBER_ID` — the WhatsApp sender's Phone Number ID from Meta
- `META_API_VERSION=v23.0` — use a currently supported Graph API version for your app
- `META_TEMPLATE_LANGUAGE=en_US` — must match the approved template language
- `META_TEMPLATE_PAYMENT`, `META_TEMPLATE_RENEWAL`, and/or `META_TEMPLATE_GENERIC` — exact approved WhatsApp template names whose body variables match the code

Business-initiated messages outside the customer-service window generally require approved WhatsApp message templates. The payment template is called with three body parameters in the payment flow; ensure the template has the matching number and order of variables. The reminder/generic templates must match the parameters passed by the corresponding notification flow.

### Token safety

A token pasted into a chat, issue, screenshot, or source file should be treated as exposed. Revoke/rotate it in Meta for Developers, then set the replacement only as `META_ACCESS_TOKEN` in the backend environment. Never paste it into `public/index.html`, `public/backend-client.js`, GitHub, or this ZIP. Do not commit your real `.env` file.

### Verification limits

Local static checks can validate JavaScript syntax, but actual persistence and message delivery require valid MongoDB credentials, Meta app permissions, a WhatsApp Business sender, approved templates, and a permitted recipient phone number.
