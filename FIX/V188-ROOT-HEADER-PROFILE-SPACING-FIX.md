# V188 — Root-level mobile header and compact profile layout

## Why V187 did not resolve the visible issue
The app contains multiple generations of CSS rules that override one another. V188 adds a final consolidated override and moves the portal header out of transformed portal ancestors while the member/admin portal is open, preventing iOS Safari from offsetting `position: fixed` relative to an ancestor.

## Changes
- Portal logo header is pinned to the actual viewport top while member/admin portal is open.
- Removes stacked mobile bottom padding from the document and portal wrapper.
- Reduces the portal wrapper's unnecessary top and bottom spacing.
- Member profile top bar remains pinned below the iOS safe area, with the close button on top.
- Rebuilds profile spacing rules with explicit block layout and small section margins to avoid flex/min-height gaps.
- Keeps the media grid centered and compact.
- Adds a close handler that removes the profile and media overlay.

## Checks
- `node --check src/server.js` passed.
- `node scripts/smoke-test.js` passed.
- `node scripts/navigation-auth-regression-test.js` passed (12/12 static checks).
- `node scripts/v180-regression-test.js` passed (10 static checks).

These are code/static checks, not a real-device Safari test. Test on iPhone after deploying.
