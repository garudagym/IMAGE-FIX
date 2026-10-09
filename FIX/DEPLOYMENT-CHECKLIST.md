# Garuda Fitness Zone deployment checklist

## Before production
- [ ] MongoDB Atlas / managed MongoDB configured
- [ ] Strong random JWT_SECRET
- [ ] Admin PIN changed from the demo value
- [ ] Member demo PIN changed
- [ ] Razorpay live key ID/secret configured only on the server
- [ ] Razorpay webhook secret configured
- [ ] HTTPS enabled
- [ ] SMS provider configured and tested
- [ ] CORS_ORIGIN restricted to the real site origin
- [ ] MongoDB network access restricted
- [ ] Database backups enabled
- [ ] Upload storage moved to durable object storage if the host uses ephemeral disks
- [ ] Test membership renewal end-to-end with a Razorpay test account before live launch

## Payment verification
The browser should never decide that a payment is successful. The backend creates the order, verifies the payment signature, records the payment, updates membership state, and processes the webhook. Razorpay recommends server-side handling of the secret, signature verification, and HMAC webhook validation.
