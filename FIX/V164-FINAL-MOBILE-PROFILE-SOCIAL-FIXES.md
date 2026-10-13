# Garuda Fitness Zone V164 — final requested UI fixes

## Changes
- Account navigation opens the signed-in member dashboard instead of the social profile modal. If not signed in, it opens authentication.
- Social links use inline SVG brand marks for Instagram, YouTube, Facebook, and X rather than text glyph approximations.
- Removed Delete post controls from profile media thumbnails. The delete action appears only inside the opened post viewer and only for the signed-in post owner.

## Validation
- `npm run check` passed.
- `npm run test:static` passed.
- All inline scripts in `public/index.html` passed `node --check`.
- `public/backend-client.js` passed `node --check`.

Live Render behavior and actual iPhone Safari interactions still require deployment testing.
