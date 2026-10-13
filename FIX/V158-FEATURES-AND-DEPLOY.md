# Garuda Fitness Zone V158 — Member goals, fee status, and expiry controls

## Included
- Admin Members section has All Members, Paid, and Not Paid filters while preserving member cards and search.
- Member profile lets a member choose weight gaining/losing, target weight, and update current weight.
- Goal progress uses green when the last update moves toward the goal, red when it moves away, and black when unchanged.
- Reaching the target marks the goal complete and adds a Weight Goal Achieved medal in Awards.
- Member dashboard warns when membership is due within three days; expired memberships show an alert and disable attendance calendar interactions.
- API denies member attendance reads/writes when membership is past its due date.
- Pay Fee button is red and launches the existing renewal checkout.
- Existing Cloudinary, welcome notifications, auth persistence, and member/payment search are retained.

## Deploy
1. Copy the contents of `FIX/` into the existing repository root; do not create a nested FIX/FIX directory.
2. Commit and push to the branch connected to Render.
3. Keep existing Render environment variables and secrets unchanged.
4. Test one account before broad rollout.

## Notes
- Membership expiry is determined from `feeDueDate` in Asia/Kolkata. Due today remains active; the day after due date is expired.
- Attendance access is protected in the API as well as hidden/disabled in the UI.
- The Paid/Not Paid filters use whether the fee due date is today or in the future as a lightweight fee-status indicator. If the business needs a separately auditable `paid/unpaid` state independent of due date, that requires a dedicated fee ledger/state migration.
- Cloudinary and WhatsApp delivery still require valid Render credentials and approved Meta templates; those external services were not live-tested here.
