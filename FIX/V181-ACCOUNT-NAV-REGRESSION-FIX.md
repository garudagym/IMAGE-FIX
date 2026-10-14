# V181 Account navigation regression fix

## Root cause identified
The consolidated V180 navigation handler calls `window.openMemberDashboard()`, but the existing `openMemberDashboard` function was declared locally inside another IIFE and was not assigned to `window`. The optional call therefore silently did nothing for authenticated members.

## Change
Expose the existing dashboard function as `window.openMemberDashboard` immediately after its declaration. This preserves its existing logic and makes it callable by the consolidated navigation handler.

## Validation
- All 53 inline JavaScript blocks passed `node --check`.
- Static assertions confirmed the global export exists and the V180 Account handler calls it.
- ZIP integrity verified after packaging.
- Not browser-tested; authenticated live Account navigation still requires real browser verification.
