# V182 regression repair

This build is based on the supplied V181 source and adds one final early-capture controller for the reported navigation/authentication/scroll regressions. It does not change server routes or database schemas.

## Reported issues targeted
1. Initial page position: guarded initial top reset after prior startup handlers, cancelled once user interaction begins.
2. Back navigation: early guard disables legacy conditional popstate handlers; existing consolidated Back dispatcher remains active.
3. Profile: intercepts Profile at window capture before legacy document handlers can swallow the click, then calls the existing own-profile renderer.
4. Member-page scroll: makes portal the scroll container, resets its scroll position on entry, and prevents document scrolling while portal is open.
5. Image-viewer background scroll: fixed-body lock with scroll-position restoration for supported image/post lightboxes.
6. Admin Home sign-out regression: Home route only closes surfaces and resets scroll; it does not clear authentication.
7. Admin sign-out visibility: ensures an explicit sign-out button is added to the visible admin portal.
8. Member sign-out refresh issue: intercepts sign-out before legacy handlers and immediately clears local auth state and updates UI.
9. Account navigation: intercepts the bottom navigation at window capture before document listeners can swallow the event; opens member dashboard or login based on session.

## Verification status
Static source checks and browser DOM smoke checks are run during packaging. A live authenticated Render test still requires testing with real member/admin credentials; this package must not be described as fully verified until those interactions pass.
