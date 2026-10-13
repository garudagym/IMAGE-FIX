# V165 — Full-page member profile and scrolling fix

- Replaces the boxed member profile presentation with a full-viewport profile page.
- Makes the profile page itself the scroll container with iOS momentum scrolling and overscroll containment, so media and profile content scroll naturally instead of moving the background page.
- Adds a Back control that closes the profile and restores the previous page scroll position.
- Preserves the existing profile social links, post viewer, and member-owned post actions.
- Adds cache-busting for `backend-client.js` so clients load the current frontend bundle.

Deploy by copying the contents of `FIX` into the repository root and pushing to the Render-connected branch. Do not run the production seed.
