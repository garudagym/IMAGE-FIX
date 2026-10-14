# V189 — Root portal header gap fix

## Root cause identified
The existing mobile stylesheet adds `padding-top:72px` to `#portal` and keeps `p-4` padding on the inner max-width wrapper. These rules, together with old sticky-header margins, push the logo header down and create the large blank area shown in the screenshot. Profile-only overrides could not fix this root-level portal spacing.

## Fix
- Remove mobile top and bottom padding from `#portal`.
- Remove the inner wrapper's mobile padding and margins.
- Pin the brand header to the top of the portal viewport.
- Preserve an 82px content offset below the fixed header so dashboard content does not overlap it.
- Move bottom-navigation clearance to active portal content rather than the whole portal shell.
- Keep desktop layout unchanged.

## Validation
Static validation only. Run `npm run check`, `npm run test:static`, and `npm run test:navigation-auth` before deploying. Real iPhone Safari validation remains necessary.
