What is happening now:

- **HR Inbox is currently inside:** `/owner/careers-portal?section=approvals`
- It is not a visible top-level Careers Portal tab. It is mounted under **Approvals**, below the approval workflow, which is why you cannot find it easily.
- The old CV URL is still wired in several places. Worse, it still redirects to `/owner/careers-portal?section=contracts&tpl=candidate_cv`, which is exactly what you asked not to happen.
- `candidate_cv` was removed from the Document Studio catalog, but old saved/session state can still force Document Studio into an invalid template state. That is why the left vertical sidebar can look empty.
- The current Document Studio page preview is still one tall canvas with visual page-break overlays. That is causing the broken/cropped “Page 2 / Page 3” feeling and can affect export.

Plan to build/fix:

1. **Make HR Inbox obvious**
   - Add a separate **HR Inbox** tab in Careers Portal navigation.
   - Keep the current HR Inbox component, but move access from hidden-inside-Approvals to its own section.
   - Update HR Inbox item clicks so they do **not** open the removed `candidate_cv` contract template.

2. **Restore Document Studio career templates without touching the templates**
   - Keep all existing staff templates in Document Studio exactly as they are.
   - Add a safety guard: if Document Studio receives an invalid old template ID like `candidate_cv`, it resets to normal template selection instead of showing an empty sidebar.
   - Clear/ignore stale saved session state that points to removed templates.

3. **Remove the old CV URL from SEO and public discovery**
   - Remove `/toolkit/corporate-suite/cv-resume` from sitemap/page sitemap/footer/navigation/AI Hub/corporate suite/tool lists.
   - Add robots `Disallow` for the old URL so search engines stop discovering it.
   - Keep only a hidden safety redirect or replace route behavior so old visitors are not sent into Document Studio contracts.

4. **Create a separate real CV Builder tool**
   - Build a standalone CV Builder section/page, separate from Document Studio and Contracts.
   - It will not use JBJ letterhead, JBJ footer, stamps, signatures, or contract send/sign flow.
   - It will use a proper CV workflow: personal details, headline, summary, experience, education, skills, languages, certifications, portfolio links, achievements, references, upload/import area, add/delete/edit section items.
   - The right side becomes **Live CV Editor / Preview**, not “document review”.

5. **Make the CV Builder visible on the frontend but controllable**
   - Register the new CV Builder as the existing controllable tool ID `cv-resume` in the tools control panel.
   - When visibility is **Public**, it appears on the frontend tools/home/AI Hub areas.
   - When visibility is **Hidden**, it disappears from frontend discovery so you can hide it while testing.

6. **Fix A4 rendering and export behavior**
   - For Document Studio: remove the fake page-label overlay system from exported/visible pages and ensure one true A4 page appears unless content needs more pages.
   - For CV Builder: render real A4 pages and create a new A4 page only when content overflows.
   - Export PDF using section-aware pagination so content is not randomly cropped and every PDF page remains true A4.

7. **Clarify the PDF types in the UI text**
   - Applicant CV export = clean personal CV, no JBJ branding.
   - Internal recruiter dossier, if added later, would be a separate branded HR file for your team only — not the applicant’s CV.

Files to update:

- `src/pages/owner/CareersPortal.tsx`
- `src/components/hr/HRInboxTab.tsx`
- `src/components/document-studio/DocumentStudio.tsx`
- `src/components/document-studio/export/exporters.ts`
- `src/routes/ToolkitRoutes.tsx`
- `src/pages/AIHub.tsx`
- `src/pages/toolkit/CorporateSuite.tsx`
- `src/pages/owner/AIToolsControlPanel.tsx`
- `src/config/publicToolAccess.ts`
- `src/pages/Sitemap.tsx`
- `src/components/Footer.tsx`
- `src/components/navigation/GlobalVerticalNav.tsx`
- `scripts/generate-sitemap.ts`
- `public/robots.txt`
- plus a new standalone CV Builder component/page.

Expected result:

- HR Inbox has its own clear place in Careers Portal.
- Document Studio career templates show again and are not damaged by the removed CV template.
- CV Builder becomes a separate proper tool, not a contract/document template.
- The old CV URL is removed from SEO/public links.
- A4 pages and PDF exports stop showing broken cropped third pages.