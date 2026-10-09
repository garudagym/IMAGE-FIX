# Garuda Fitness Zone — Render Deployment

This folder is the deployable Node/Express application. It serves the public website and API from the same service.

## 1. Create MongoDB Atlas

Create a MongoDB Atlas database and a database user. Copy the MongoDB connection string. The database name can be `garuda_fitness_zone`.

## 2. Put this folder in GitHub

Recommended repository layout:

```text
repo-root/
  public/
  src/
  uploads/
  package.json
  package-lock.json
  render.yaml
  Dockerfile
```

Do not commit `.env`, passwords, Razorpay secrets, SMS secrets, or `node_modules`.

## 3. Create the Render service

In Render:

1. New → Web Service.
2. Connect the GitHub repository.
3. Runtime: Node.
4. Build command: `npm install`
5. Start command: `npm start`
6. Health check path: `/healthz`
7. If you are deploying this repository with the files at the repository root, leave Root Directory blank.
8. If you instead keep this app inside a `backend/` subfolder, set Root Directory to `backend`.

Render will give you a temporary public URL such as:

`https://garuda-fitness-zone.onrender.com`

No custom domain is required for the first test.

## 4. Required Render environment variables

Set these in Render → Environment:

```text
NODE_ENV=production
MONGO_URI=<MongoDB Atlas connection string>
JWT_SECRET=<long random secret>
ADMIN_USERNAME=<your real admin username>
ADMIN_PIN=<new private admin PIN>
CORS_ORIGIN=https://<your-render-host>.onrender.com
RAZORPAY_KEY_ID=<test key first>
RAZORPAY_KEY_SECRET=<test secret first>
RAZORPAY_WEBHOOK_SECRET=<webhook secret>
ALLOW_DEMO_PAYMENTS=false
SMS_PROVIDER=none
SMS_FROM=Garuda Fitness Zone
```

Do not put these values in `public/` or frontend JavaScript.

## 5. Seed the production database

Run the seed once against the production database. The safest approach is to run it from a local checkout using the production `MONGO_URI`, or use a one-off Render shell if available:

```bash
npm install
npm run seed
```

The seed creates the initial catalog and demo accounts. Change the seeded admin PIN immediately. Do not use the demo member credentials as a public account.

## 6. Verify the service

Open:

`https://<your-render-host>.onrender.com/healthz`

Expected:

```json
{"ok":true,"service":"garuda-fitness-zone"}
```

Then open the root URL and test:

- public pages/navigation
- hero and gallery images
- Strength, Cardio, Strength + Cardio and Personal Training sections
- member login
- attendance calendar
- admin login
- products/cart/checkout

## 7. Razorpay test mode

Use Razorpay Test Mode first. Configure the webhook URL as:

`https://<your-render-host>.onrender.com/api/payments/webhook`

Keep `ALLOW_DEMO_PAYMENTS=false` in production.

Test order creation, Checkout, signature verification, webhook handling, payment records and membership renewal before switching to live keys.

## 8. SMS

Set `SMS_PROVIDER` and provider credentials only after the payment and membership flows work.

Supported adapters in this build:

- `none`
- `generic`
- `twilio`

For an Indian SMS provider, use its approved API/template/sender configuration and place the credentials in Render environment variables.

## 9. Persistent uploads

The bundled public gallery/hero assets are part of the deployment and do not depend on local files. Runtime uploads are written to `uploads/` by the current backend. For production member/product/gallery uploads, use persistent object storage (for example S3/R2/Cloudinary) before relying on uploads across redeploys.

## 10. Before going live

- Replace demo admin credentials.
- Use a strong JWT secret.
- Use Razorpay Live keys only after Test Mode passes.
- Configure and verify the Razorpay webhook.
- Configure SMS provider and any required Indian sender/template/consent requirements.
- Use HTTPS (Render provides HTTPS on its public URL).
- Add a custom domain later if desired.
- Do not commit `.env` or secrets.
