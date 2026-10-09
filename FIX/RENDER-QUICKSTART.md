# Render — quickest deployment path

## A. Put the app on GitHub

Create a new GitHub repository and upload the **contents of this folder** so `package.json` and `render.yaml` are at the repository root.

Do not upload `.env` or `node_modules`.

## B. Create MongoDB Atlas first

1. Create a free MongoDB Atlas cluster.
2. Create a database user.
3. Copy the connection string for the `garuda_fitness_zone` database.
4. For the first deployment, allow Render to connect to Atlas. Atlas network-access configuration is outside this app package.

## C. Deploy on Render

Use Render → **New → Blueprint** if you want Render to read the included `render.yaml`.

Or use **New → Web Service** and enter:

- Runtime: `Node`
- Build Command: `npm install`
- Start Command: `npm start`
- Health Check Path: `/healthz`
- Root Directory: leave blank because this repository is the app root.

## D. Set environment variables

After Render creates the service, set:

```text
NODE_ENV=production
MONGO_URI=<Atlas connection string>
JWT_SECRET=<long random secret>
ADMIN_USERNAME=<your real admin username>
ADMIN_PIN=<new private admin PIN>
CORS_ORIGIN=https://YOUR-SERVICE.onrender.com
RAZORPAY_KEY_ID=<Razorpay test key first>
RAZORPAY_KEY_SECRET=<Razorpay test secret>
RAZORPAY_WEBHOOK_SECRET=<webhook secret>
ALLOW_DEMO_PAYMENTS=false
SMS_PROVIDER=none
SMS_FROM=Garuda Fitness Zone
```

After Render gives you the exact `onrender.com` URL, put that URL into `CORS_ORIGIN` and redeploy.

## E. Initialize the database

Do **not** point a local development `.env` at production by accident.

Run the seed once against the production database using the production `MONGO_URI`:

```bash
npm install
npm run seed
```

The seed creates the catalog and initial demo accounts. Change the admin PIN immediately. Do not publish the demo member credentials.

## F. Verify

Open:

```text
https://YOUR-SERVICE.onrender.com/healthz
```

Then:

```text
https://YOUR-SERVICE.onrender.com
```

Test the public site, member login, attendance, admin, catalog, cart and checkout.

## G. Razorpay

Start with Test Mode. Set the Razorpay webhook to:

```text
https://YOUR-SERVICE.onrender.com/api/payments/webhook
```

Only switch to live keys after a complete test transaction and webhook verification succeed.

## H. SMS

Keep `SMS_PROVIDER=none` until the rest of the system works. Then configure `generic` or `twilio` with server-side credentials. Indian SMS sender/template/consent requirements depend on the provider and account.

## Important Render production notes

- Render gives each web service a public `onrender.com` URL; a custom domain is optional.
- The app listens on `0.0.0.0` and uses Render's `PORT` environment variable.
- The bundled hero/gallery assets are inside the repository and are safe to deploy with the app.
- Runtime uploads currently use the service filesystem. Do not rely on them for permanent production storage across redeploys; use persistent storage/object storage before enabling important user uploads.
- An hourly renewal scheduler runs inside the web service. If you need reliable notifications independent of web-service sleeping/restarts, use a paid always-on service or move the reminder job to a dedicated scheduled job/worker.
