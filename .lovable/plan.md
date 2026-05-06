## Email template polish — `brokerage_breakfast_invite`

Update the `crm_email_templates` row (`variant = 'brokerage_breakfast_invite'`) via migration. No edge function changes needed.

### 1. Brand name — always uppercase
Replace every visible instance of "Citi Developers" with **"CITI DEVELOPERS"** inside the email body (header subtitle, intro paragraph, invitation card title, footer signature line). The image alt text stays as-is.

### 2. Sender email address
Change `jane@citidevelopers.com` → **`jane@citideveloper.com`** (singular, no "s") in both the `mailto:` href and the visible link text.

### 3. "Before we lock your seats" card — force full width
This card is already on its own row, but on narrow renderers it can collapse. Wrap it in a `<table width="100%" role="presentation">` with `width="100%"` and `style="width:100%;table-layout:fixed"` so Outlook/Gmail keep it spanning the full content column. Reduce inner padding from `28px 26px` → `22px 22px` and tighten list spacing to shave height.

### 4. New closing line before footer logo
Directly above the footer divider (after the "...long, successful collaboration" paragraph and outside the cream card), add a centered closing block:

```
Looking forward to a long-lasting partnership.
— {{owner_first_name}} Bou Jaoude, CITI DEVELOPERS
```

Styling: centered, `font-size:13.5px`, ink color, italic first line, 18px top margin. This sits just before the gold hairline that precedes the footer logo, giving a warm sign-off.

### 5. Footer contact tiles — 4 equal cards on one line
Today the four tiles use `display:inline-block; width:140px; margin:6px` which wraps to 2×2 on ~600px renderers. Rebuild as a true email table so they stay in a single row at equal widths and the overall footer height shrinks:

```text
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate;border-spacing:8px 0">
  <tr>
    <td width="25%"> Website tile </td>
    <td width="25%"> Visit office tile </td>
    <td width="25%"> Call us tile </td>
    <td width="25%"> WhatsApp tile </td>
  </tr>
</table>
```

Tile changes:
- Each `<a>` becomes `display:block;width:auto` filling its `<td>`
- Reduce padding `12px 10px` → `10px 6px`
- Reduce icon size `16` → `14`, font-size `12.5px` → `12px`
- Keep the gold hairline-underline on the label for the "clickable" cue

This gives 4 equal-width cards on one line in Gmail / Apple Mail / Outlook and lowers the footer height noticeably.

### 6. Overall height trim
- Outer card padding `36px` → `30px`
- Top header padding `22px 0 26px` → `16px 0 20px`
- Footer top padding `26px` → `20px`, footer logo block `22px 0 26px` → `14px 0 18px`

### Files touched
- New migration: `supabase/migrations/<timestamp>_brokerage_invite_polish.sql` containing a single `UPDATE public.crm_email_templates SET html = $$...$$ WHERE variant = 'brokerage_breakfast_invite';`

No code in `supabase/functions/crm-send-brokerage-outreach/index.ts` needs to change — it already reads the template from the DB.

### One small clarification
You said "always the emails keep it three capital letter". I'm interpreting this as **"always write CITI DEVELOPERS in all caps"** (which matches your next sentence). If you actually meant something else (e.g. capitalize only the first 3 letters, or display the email address in caps), tell me and I'll adjust before applying.
