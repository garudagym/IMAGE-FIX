# V177 focused repair

- Captures and calls the original `openProfile` renderer for the authenticated member; no fake profile shell is generated.
- Disables legacy `popstate` listeners before they register and installs one close-first Back dispatcher.
- Sets manual scroll restoration early and uses one guarded homepage entry reset that preserves shared-post URLs and does not keep pulling a user back after they scroll.

## Verification

Run `npm run check` and `npm run test:static`. JavaScript syntax checks are not a substitute for authenticated browser testing; verify Home → Account → Profile and repeated Back in a real browser before production rollout.


## Root-cause corrections in V178
- Corrected the member Profile delegated handler to target `#portal`, the actual member dashboard container. Removed the earlier competing delegated Profile handler.
- The final Profile handler invokes the original profile renderer directly with the authenticated member's canonical identifier and reports a concrete rendering error if no profile modal is created.
- Removed competing delayed startup scroll-reset loops. One controlled initial reset remains, with exceptions for direct shared-post URLs and the member portal.
- Kept the single final close-first Back dispatcher; legacy popstate handlers remain disabled by the early navigation guard.

Validation is code-level only. Browser testing against a live Render session is still required for final confirmation.
