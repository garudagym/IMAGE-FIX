# Garuda Fitness Zone — Full Backend

This package adds a real Node.js/Express + MongoDB backend to the existing Garuda Fitness Zone site. The existing UI is preserved and served from `public/`.

## Stack
- Node.js 20+
- Express 5
- MongoDB + Mongoose
- JWT authentication
- bcryptjs PIN hashing
- Razorpay server-side Orders + signature verification + webhook verification
- Multer image uploads
- Helmet, CORS and rate limiting

Razorpay secrets stay server-side. Razorpay's current security guidance recommends keeping the API secret out of the client, validating payment signatures, and validating webhooks with HMAC.

## Features
- Member login with 4-digit PIN
- Admin login
- Admin member creation / PIN generation / member updates
- Member profile persistence
- Attendance persistence
- Gym plans and products
- Gallery CRUD + image uploads
- Coupons
- Orders and payments
- Membership renewal
- Automatic fee due-date update after a successful renewal
- In-site payment notifications
- Optional real SMS provider webhook
- Razorpay production checkout integration when credentials are configured
- Local demo payment mode when Razorpay keys are empty
- Frontend/backend synchronization so the existing site's local data model can migrate without rewriting every existing screen

## Run locally

1. Install Node.js 20+.
2. Start MongoDB locally or create a MongoDB Atlas database.
3. Copy `.env.example` to `.env` and set `MONGO_URI` and `JWT_SECRET`.
4. Install packages:

```bash
npm install
```

5. Seed the database:

```bash
npm run seed
```

6. Start the site:

```bash
npm start
```

Open `http://localhost:5050`.

### Demo credentials
- Admin: `admin` / `2468`
- Member: `GFZ-1001` / `1234`

Change these before production.

## Razorpay
Set:

```env
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...
RAZORPAY_WEBHOOK_SECRET=...
```

The backend creates Razorpay Orders. The browser receives only the public key ID and order ID. The server verifies the returned signature before marking an order paid. Configure the Razorpay webhook URL as:

`https://YOUR-DOMAIN/api/payments/webhook`

Use HTTPS in production.

## SMS
The site always creates an in-site payment notification. For actual SMS delivery, configure `SMS_API_URL`, `SMS_API_KEY`, and `SMS_FROM` for the SMS provider you choose. The adapter sends JSON containing `to`, `message`, and `from`; map it to the provider's required schema if needed.

## Main API

### Authentication
- `POST /api/auth/member/login`
- `POST /api/auth/admin/login`
- `GET /api/auth/me`

### Catalog
- `GET /api/bootstrap`
- `GET /api/products`
- `GET /api/plans`
- `GET /api/gallery`
- `GET /api/coupons/validate?code=...&amount=...`
- Admin product and coupon CRUD

### Members
- `GET /api/members` — admin
- `GET /api/members/me` — member
- `PATCH /api/members/me` — member
- `POST /api/members` — admin
- `PATCH /api/members/:memberCode` — admin
- `DELETE /api/members/:memberCode` — admin deactivate
- Attendance GET/PUT endpoints
- Member notification endpoint

### Payments
- `POST /api/payments/create-order`
- `POST /api/payments/verify`
- `POST /api/payments/webhook`
- `GET /api/payments` — admin
- `GET /api/payments/orders` — admin

### Admin
- `GET /api/admin/dashboard`
- `POST /api/admin/members/:memberCode/generate-pin`
- Gallery CRUD
- Admin notifications
- Settings

## Production notes
- Put the site behind HTTPS.
- Use a long random `JWT_SECRET`.
- Use Razorpay live credentials only in server environment variables.
- Do not commit `.env`.
- Configure a real SMS provider before promising SMS delivery.
- Restrict MongoDB network access and use a dedicated database user.
- Back up MongoDB.
- Add a proper email/SMS provider and monitoring before production launch.

Express recommends security middleware such as Helmet and rate limiting/brute-force protection for authorization endpoints; this backend includes both.


## Production deployment (V132)

This package is intended to run as a real public site, not a demo. Use MongoDB Atlas or another managed MongoDB service, set a strong JWT_SECRET, configure Razorpay Live/Test keys as appropriate, and set CORS_ORIGIN to the exact public origin. Demo payments are disabled in production unless ALLOW_DEMO_PAYMENTS=true is explicitly set.

### Public assets
Hero assets are in public/assets/desktop-hero.jpg and public/assets/mobile-hero.jpg. Facility assets are in public/gallery/. The seed database references these same server-relative URLs, so gallery images do not depend on the local filesystem outside the deployed app.

### Renewal notifications
The server checks active members hourly and creates in-app renewal notifications at 7, 3, 1 and 0 days before the fee due date. If SMS_PROVIDER is configured, the same reminders are sent by SMS. Payment confirmation also creates an in-app notification and sends SMS. Use POST /api/admin/renewal-reminders/run as an admin for an immediate manual run.

### SMS
SMS_PROVIDER=generic uses SMS_API_URL and SMS_API_KEY. SMS_PROVIDER=twilio uses TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN and TWILIO_FROM. Provider credentials belong only in server environment variables.

### Health check
GET /healthz returns a JSON health response.
