# Garuda Fitness Zone — WhatsApp membership notifications patch

This is a **staging patch only**. It has not been deployed and does not send messages unless installed in the backend and the scheduler runs with real Meta credentials.

## Files in this patch

Copy these files into the existing backend at the matching paths:

- `src/notifications.js` — three approved membership templates and schedule
- `src/sms.js` — existing Meta WhatsApp client (included unchanged)
- `src/models/index.js` — adds `billingPeriodDueDate` to Payment records
- `src/routes/payments.js` — associates manual and online membership payments with a billing period; partial payments do not advance expiry until the recorded period's monthly fee is covered
- `src/membership-balance.js` — balance calculation and India-local date helpers
- `.env.example` — required template configuration names

Do not replace the whole live project with this patch. Merge/replace only the listed files in a separate branch or staging copy first.

## Notification rules implemented

- D-3: send `META_TEMPLATE_EXPIRING` with `[member name, gym name, expiry date]`.
- D-3, D-2, D-1 and D0: send `META_TEMPLATE_REMINDER` each day if the current billing period has a positive calculated balance, with `[formatted outstanding amount, gym name]`.
- D0: send `META_TEMPLATE_EXPIRED` with `[member name, gym name, expiry date]` if the expiry date is still today (a full renewal that advances the due date before the scheduler runs prevents the old expiry message).
- Uses Asia/Kolkata dates; scheduler runs at approximately 9 AM India time.
- Sent notifications are deduplicated by member, template event and date. Failed sends remain eligible for a later retry.

## Required Render environment variables

Set these in Render, using the exact template names and language code shown in Meta WhatsApp Manager:

- `SMS_PROVIDER=meta-whatsapp`
- `META_ACCESS_TOKEN`
- `META_PHONE_NUMBER_ID`
- `META_API_VERSION` (for example, the version already used by your app)
- `META_TEMPLATE_LANGUAGE`
- `META_TEMPLATE_EXPIRING`
- `META_TEMPLATE_EXPIRED`
- `META_TEMPLATE_REMINDER`
- `GYM_NAME=Garuda Fitness Zone`

The existing `META_TEMPLATE_PAYMENT` and `META_TEMPLATE_WELCOME` are separate and are not replaced by this membership scheduler.

## Important legacy-payment limitation

Old Payment documents do not have `billingPeriodDueDate`, so the backend cannot reliably tell which monthly billing period an old payment belongs to. Guessing could either overstate or understate dues. For safety, this patch suppresses a dues reminder when it detects an unallocated legacy membership payment in the current 30-day window; it logs the member code for reconciliation. Expiring/Expired notices can still be sent.

Before enabling live reminders for existing members, reconcile those legacy payment records and assign them to their correct billing period, or explicitly approve a migration rule after reviewing the payment data. New payment records created after this patch carry the billing-period field.

## Staging checklist

1. Create a Git branch and staging copy; keep production untouched.
2. Confirm the three template names and language code exactly match approved Meta templates.
3. Review/reconcile legacy payment records before sending dues reminders to existing members.
4. Run syntax checks:
   - `node --check src/notifications.js`
   - `node --check src/sms.js`
   - `node --check src/models/index.js`
   - `node --check src/routes/payments.js`
   - `node --check src/membership-balance.js`
5. Test simulated members at D-3, D-2, D-1 and D0, with full, partial, zero and legacy-ambiguous payments. Do not use real member phone numbers during tests.
6. Test with Meta credentials only after the dry-run results are approved.
7. Deploy only after explicit authorization.

## Important payment behavior change

Manual and online membership payments are recorded against the member's current `feeDueDate`. The due date advances by 30 days only when the total valid payments allocated to that billing period cover `monthlyFee`. If the gym uses membership plans whose prices differ from `monthlyFee`, review the intended accounting rule before production use.
