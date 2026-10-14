# V187 — Mobile profile layout and media stability fix

- Pins the member-profile top bar to the top of the profile viewport with iOS safe-area support.
- Adds a window-capture handler for the close (×) button, ahead of legacy document handlers.
- Uses a standalone media viewer for profile photos/videos to avoid nested modal scroll deadlocks on iOS Safari.
- Centers the Member media / Photos & videos heading and post count.
- Reduces excessive profile section gaps and bottom padding.
- Preserves existing backend, authentication, and desktop layout.

Run `node --check src/server.js` and the included smoke tests. A real iPhone test is still recommended before production deployment.
