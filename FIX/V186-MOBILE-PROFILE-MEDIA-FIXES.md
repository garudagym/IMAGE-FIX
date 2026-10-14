# Garuda Fitness Zone V186 — mobile profile and media fixes

Based on the user-provided V185 archive. This update is scoped to the existing full-page member profile and post viewer; it does not change backend routes, schemas, authentication, or payment behavior.

## Changes
- Replaced the profile's Back label/arrow with a clear circular × close control.
- Tightened mobile profile typography and vertical spacing between identity, actions, social links, and media.
- Removed the extra bottom padding on the profile overlay and reduced content padding to account for the floating bottom navigation without leaving an oversized blank area.
- Kept the profile header sticky at the top of the profile's own scroll container and styled it for light/dark themes.
- Raised the post viewer above the profile overlay so tapping a media tile no longer opens the viewer behind the profile.
- Kept the existing post viewer's own close button and made it dismiss only the viewer, leaving the profile underneath.
- Kept the bottom navigation below the post viewer, so it cannot cover media controls.
- Desktop-specific spacing remains separately defined and the desktop page layout is otherwise unchanged.

## Validation
- Inline JavaScript syntax check and project static tests are run before packaging.
- A live iPhone Safari test with authenticated member/admin sessions still requires deployment; this archive does not claim live-device verification.
