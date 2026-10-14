# Garuda Fitness Zone V163 — Regression Fixes

This revision consolidates the mobile navigation and session behavior after reviewing V162's actual source. It is intended to replace V162, not be layered on top of it.

## Changes

- A final authoritative navigation handler updates the selected tab and animated capsule indicator together.
- Closing the member portal for Home navigation no longer clears the in-memory member or removes the saved auth token.
- A valid member session is restored on refresh while leaving the public Home page visible; the member can open their profile/dashboard using the profile avatar. This avoids reopening a member portal automatically on every refresh.
- Profile avatar is refreshed after session restoration and stays in the Account/Profile navigation item.
- The member post deletion handler checks the signed-in member ID against the post owner before sending the updated post list to the backend. The server's member-state route only accepts changes to that member's own posts.
- Product operations reselect the admin Store tab after the operation completes.
- Legacy static "Working… Please wait" loader markup is removed, and stacked bottom padding is reduced to one fixed-navigation/safe-area inset.
- Existing persistent post loading and social links remain in place.

## Validation performed

- `npm run check`
- `npm run test:static`
- `npm run test:v156`
- `node --check public/backend-client.js`
- `node --check` for every inline JavaScript block in `public/index.html`

These are source/static checks. They do not replace testing the deployed Render app on a real iPhone or verifying live database behavior.

## Deploy

Replace the repository files with the contents of `FIX/`, commit and push to the Render-connected branch, then test member Home navigation, refresh/session restoration, capsule movement, deleting an owned post, and admin product add/delete. Do not run the production seed.
