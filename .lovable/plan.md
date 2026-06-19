You are right to call this out. The problem happened because the previous change was applied to `ProjectInquiryForm`, but the visible page still uses two different components: `ConsultationRequestForm` for “Register Interest in Distrikt…” and `CallToActionSection` for “Request a Call Back Now”. I also did not verify the exact clicked UI before claiming the brochure proxy was fixed. That was wrong.

Plan to fix it now:

1. Replace the visible “Register Interest in Distrikt…” form
   - Update `ConsultationRequestForm` because this is the actual visible form on the project page.
   - Add the professional real-estate fields there, including a single full-width “Preferred Size” selector with market buckets instead of broken min/max/from/to inputs.
   - Remove redundant wording and keep labels professional: minimum/maximum only where range language is needed, not “to/to” or cramped two-line placeholders.
   - Fix borders, surfaces, placeholders, buttons, select triggers, and phone input styling to the champagne/ink/gold system.
   - Make the form responsive on phone/tablet: no two-column controls where text wraps or clips.

2. Fix “Request a Call Back Now”
   - Update `CallToActionSection`, which is the visible callback form.
   - Apply the same field styling system and mobile-safe layout.
   - Ensure buttons use locked CTA primitives or explicit dark CTA styling with correct white-on-black contrast only when the button background is truly black.

3. Stop the wrong generic popup from hijacking project brochure flows
   - The “Unlock Premium Features / Buying” modal in the screenshot is `LeadCapturePopup`, not the brochure form.
   - Suppress that generic smart popup on `/project/:slug` pages so project CTAs open only the project-specific lead capture modal.
   - Keep browsing free and do not force a generic access form over project pages.

4. Fix brochure download correctly
   - Update `ProjectDetailLayout.handleDocumentDownload` to use `proxyAnyDownloadUrl` for every document URL, not only storage URLs.
   - This fixes external brochure PDFs that currently bypass the proxy and trigger Chrome’s blocked/download warning.
   - Update document success download behavior so it fetches the proxied URL as a blob and starts a same-tab download instead of relying on cross-origin anchor behavior.
   - Keep the fallback as “Request Brochure” only when no valid brochure URL exists.

5. Harden the backend download proxy and source rules
   - Update `download-file` edge function allowed domains to remove forbidden secondary portals from document proxying.
   - Reuse the shared source allowlist logic where appropriate so brochure/document fetching rejects secondary portals with `secondary_source_blocked`.
   - Keep developer-direct and Provident partner sources allowed.
   - Fix CORS headers on the shared rejection response so frontend receives a clean 403 instead of an opaque failure.

6. Lock the rule in memory and code comments
   - Ensure the no-secondary-source scraping rule remains in project memory and in the shared edge allowlist.
   - Add a short code-level warning on the proxy/fetch path so future scraper/download changes do not re-add Bayut/Dubizzle/Property Finder/etc.

7. Visual and functional validation before claiming done
   - Desktop: project hero Download Brochure click.
   - Desktop: brochure section Unlock/Download click.
   - Desktop: visible Register Interest form.
   - Desktop: Request a Call Back Now form.
   - Tablet viewport.
   - Phone viewport.
   - Network check: confirm brochure downloads call `/api/download-file` or the backend function, not a raw external PDF URL.
   - Screenshot each validated state and report exactly what was tested.