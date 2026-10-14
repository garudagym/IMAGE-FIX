# V177 focused repair

- Captures and calls the original `openProfile` renderer for the authenticated member; no fake profile shell is generated.
- Disables legacy `popstate` listeners before they register and installs one close-first Back dispatcher.
- Sets manual scroll restoration early and uses one guarded homepage entry reset that preserves shared-post URLs and does not keep pulling a user back after they scroll.

## Verification

Run `npm run check` and `npm run test:static`. JavaScript syntax checks are not a substitute for authenticated browser testing; verify Home → Account → Profile and repeated Back in a real browser before production rollout.
