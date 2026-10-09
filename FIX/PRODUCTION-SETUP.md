# Garuda Fitness Zone — Production Setup

## 1. Server
- Node.js 20+ (22 recommended)
- MongoDB Atlas or another production MongoDB deployment
- HTTPS domain

## 2. Environment
Copy `.env.example` to `.env` and set:
- `MONGO_URI`
- `JWT_SECRET`
- `ADMIN_USERNAME`
- `ADMIN_PIN`
- `CORS_ORIGIN`
- Razorpay keys
- SMS provider credentials

Keep `.env` out of Git and never expose provider secrets to the browser.

## 3. Database
Run once against the production database:

```bash
npm install
npm run seed
npm start
```

The seed creates the initial admin/member accounts and replaces the catalog plans/products/gallery with the configured Garuda Fitness Zone catalog. Change the seeded admin PIN immediately after first deployment.

## 4. Payments
Production requires Razorpay credentials. Demo payments are disabled by default when `NODE_ENV=production`.

Configure the Razorpay webhook to:

`https://YOUR-DOMAIN/api/payments/webhook`

Use the webhook secret in `RAZORPAY_WEBHOOK_SECRET`.

The backend calculates product/plan totals from MongoDB instead of trusting the browser's price.

## 5. Renewal notifications
The server checks memberships hourly and creates an in-app notification and, when SMS is configured, an SMS reminder at:
- 7 days before due date
- 3 days before due date
- 1 day before due date
- due date

Notifications are deduplicated for each member/due-date/reminder window.

Manual admin trigger:

`POST /api/admin/renewal-reminders/run`

## 6. SMS
Choose one:

### Generic provider
```env
SMS_PROVIDER=generic
SMS_API_URL=https://provider.example/send
SMS_API_KEY=...
SMS_FROM=Garuda Fitness Zone
```

The provider endpoint must accept JSON containing `to`, `message`, and `from`.

### Twilio
```env
SMS_PROVIDER=twilio
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_FROM=...
```

India-specific sender/consent/DLT requirements remain the responsibility of the selected SMS provider and the gym's account.

## 7. Health check

`GET /healthz`

A successful response looks like:

```json
{"ok":true,"service":"garuda-fitness-zone"}
```

## 8. Render
A `render.yaml` is included. Set the secret environment variables in Render and deploy the Node service. Use the health check path `/healthz`.

## 9. Docker
A Dockerfile is included. It serves the same Express app and frontend.

## V147 deployment note

MongoDB is configured through `MONGO_USER`, `MONGO_PASSWORD`, `MONGO_CLUSTER`, and `MONGO_DB`.
Do not commit a MongoDB URI or password into source code.

Uploaded images are persisted in MongoDB and are served through `/api/media/:id`, so they survive Render redeploys and restarts.
