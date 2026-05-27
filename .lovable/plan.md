Here is the correction plan.

First, to answer your direct question: **HR Inbox is currently inside Careers Portal > Approvals**, below the approval workflow. You are on **Contracts & Templates**, so you will not see it there. That placement is confusing and I will fix it.

## What I will change

### 1. Make HR Inbox visible where you expect it
- Add a clear **HR Inbox** tab/section in the Careers Portal navigation.
- Keep CV/application notifications there, not hidden inside Approvals.
- When you click an applicant, it will open the applicant/CV workflow, not the contract document area.

### 2. Remove the old CV builder URL from public/SEO paths
- Remove `/toolkit/corporate-suite/cv-resume` from public sitemap links, footer links, AI Hub cards, side navigation, and visible tool lists.
- Stop sending users from that old URL into Contracts.
- Replace visible links with the new CV Builder route only.
- Keep the old route as a safe hidden fallback only if needed, but it will not be advertised or indexed.

### 3. Move Candidate CV out of Contracts
- Remove **Candidate CV** from **Contracts & Templates**.
- Create a separate **CV Builder** area/tool.
- It will not use JBJ letterhead, footer, stamps, signatures, or contract send/sign flow.
- The right panel becomes **Live CV Editor**, not “Live Document Editor”.

### 4. Build a real CV Builder, not a contract template
The CV Builder will include proper CV sections:
- Personal details
- Professional headline
- Summary/profile
- Work experience
- Education
- Skills
- Languages
- Certifications/licenses
- Portfolio/LinkedIn/links
- Achievements
- References optional
- Upload/import existing CV
- AI improve/rewrite per section
- Add/delete/edit fields and repeated entries, especially experience, education, skills, certifications

### 5. CV design and colors
- The CV will have its own visual style, separate from JBJ corporate documents.
- It will look like a modern professional CV builder, similar in purpose to My CV Builder / My Resume / My Perfect CV.
- It will still respect the project’s premium style, but it will not look like a JBJ contract or letterhead.

### 6. Fix A4 page rendering globally
The current preview is wrong because it visually slices one long document and overlays “Page 2 / Page 3” labels. I will replace that behavior.

New behavior:
- Each page is a true A4 sheet.
- Page 1 appears as one full A4 page.
- Page 2 only appears when content actually needs a second page.
- Page 3 only appears when content actually needs a third page.
- No fake page labels, date labels, divider bands, or broken cropped page overlays in preview or export.
- Exported PDF will match the A4 pages exactly.

### 7. Fix exports for all Document Studio templates
This is not only a CV issue, so I will fix the shared export/page system:
- Contracts/documents keep JBJ letterhead/footer only where appropriate.
- CV Builder exports unbranded CV PDFs.
- No broken third page.
- No preview-only dividers exported into the PDF.
- No cropped/non-A4 pages.

### 8. About the “branded PDF” I mentioned before
That was badly explained.

There are two different things:

1. **Employee/applicant CV PDF**  
   This should be the person’s own CV. It should **not** have JBJ header/footer/signature/stamp.

2. **Internal branded candidate dossier**  
   This could be useful later for JBJ recruiters: a clean internal PDF summary of an applicant with score, skills, notes, role fit, and original CV link. The benefit is consistency for screening and agency sharing. It is not the applicant’s personal CV.

For this fix, I will focus on the real CV Builder and correct A4 export. I will not force an internal branded applicant dossier into the CV builder.