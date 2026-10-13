# Garuda Fitness Zone V149 — Gallery + Portal Stability Fix

## Fixed
- Gallery uploads now always use the uploaded image URL returned by the backend.
- Gallery records with UUID/ObjectId-style image values are automatically converted to `/api/media/<id>` so older uploads render instead of showing a blank card.
- UUID-style gallery names are replaced with a clean `Gym photo N` label when the backend contains a malformed legacy name.
- New gallery titles use the actual uploaded filename when no custom title is entered.
- Gallery upload fields reset after a successful upload.
- Member profile pictures are stored through the persistent Render/Mongo media endpoint.
- After member login, the top navigation avatar uses that member's actual profile picture.
- Random remote member profile photos are removed; members without a photo use the neutral Garuda fallback instead.
- Editing a member's profile photo updates the active navigation avatar immediately when it is the logged-in member.
- State synchronization no longer writes stale plans/products/gallery/coupon snapshots back over the dedicated backend catalog. This prevents old UUID gallery data from coming back after unrelated saves.
- Admin/member portal now has a single controlled vertical scroll surface on mobile/tablet, with contained overscroll to reduce iOS rubber-band behavior.
- Added an Apple-style global loading overlay for backend/API and image-upload operations.
- Cache-busted `backend-client.js` to V149 so Render/browser caches pick up the fixes.

## Validation
- `npm run check` — PASS
- `npm run test:static` — PASS
- Inline JavaScript syntax check — PASS
