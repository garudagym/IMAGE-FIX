# V180 targeted regression repairs

1. The Profile click interceptor that runs first (V176) now searches the member directory using all supported identifiers before calling the original renderer, instead of relying only on the first identifier.
2. The final bottom navigation setup replaces existing nav button nodes before binding the single final click handler. This removes accumulated listeners attached directly to the buttons by previous versions, which could intercept Home and other navigation actions before the latest handler ran.
3. The earlier Back handlers remain gated by the early V179 flag; the consolidated Back dispatcher remains active.

Validation is source-level only in this environment. A Chromium/Playwright attempt was blocked by the environment's browser policy, so authenticated end-to-end behavior against Render has not been verified here. Do not treat this as a production-tested release until live role-based tests pass.
