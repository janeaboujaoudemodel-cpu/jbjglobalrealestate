# Repair partial rendering and complete Apollo connection

## What will change
- Prevent deferred homepage and detail sections from remaining as permanent blank reserved panels when browser intersection callbacks stall.
- Recover from repeated render errors instead of leaving the entire application blank after silent retries are exhausted.
- Consolidate stale-chunk recovery so one failure cannot trigger competing reload loops.
- Make visible images start promptly and replace failed image requests through existing branded media behavior rather than leaving empty boxes.
- Validate the homepage and representative listing/gallery routes with the project’s required screenshot runner.
- Verify the newly linked Apollo connector and report any provider-side key permission issue clearly.

## Technical details
- Add bounded fallback timers to `LazyVisible` and `DeferredSection` while retaining their current off-screen performance behavior.
- Update `AppErrorBoundary` and boot preload recovery to share one rate-limit key and hard-recover persistent non-chunk failures.
- Tune the global image enforcer so current-viewport images are not stranded behind a global promotion cap.
- Keep the existing JBJ layout, emerald/champagne themes, and section dimensions unchanged.
