

## Add CI job for PDF export QA gate

Add an automated check that runs on every push/PR, generates a sample of the platform's PDF exports, validates them against edge-coverage and DPI thresholds, and fails the build when violations are reported.

### What gets built

1. **PDF QA script** — `scripts/pdf-qa/check-exports.mjs`
   - Boots a headless Chromium (Playwright) against the built Vite preview.
   - Triggers each registered export route (Company Profile, Investor Portfolio Summary, CRM Client