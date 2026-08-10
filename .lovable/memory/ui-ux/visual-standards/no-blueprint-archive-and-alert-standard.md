---
name: No Blueprint — Archive & Alert Standard
description: Missing developer/project media is never shown as an emerald blueprint or empty field; the record is archived from the public site and flagged in the owner Developer Hub alerts
type: constraint
---

# No Blueprint — Archive & Alert (LOCKED)

**Never render an emerald blueprint field, placeholder pattern, or empty media
slot anywhere on the public site.** If verified media is missing, the record is
withheld from public view and flagged in the backend instead.

## Rules
1. **Developer cards** — a developer with no usable cover photograph is archived
   from the public `/developers` directory (`DeveloperCard` returns `null` unless
   `allowMissingCover` is set, which only owner/backend views pass).
2. **Developer detail hero** — with no photograph, the hero is a compact
   champagne masthead with black text, never a full-screen emerald void.
3. **Owner backend alerts** — `src/components/owner/DeveloperHubAlerts.tsx`
   (rendered in the Developer data gaps queue, `/owner/crm/jbj/owner-developer-gaps`)
   holds every gap bucket:
   - Archived — needs cover photo (developers with no `feature_image_url`)
   - Needs official logo (`needs_real_logo` or no logo at all)
   - Incomplete projects (live projects missing photo, price or description)
4. All gap flags are **owner-only**. They never render on public routes.
5. Projects themselves are still never blocked from publishing — see
   "Projects Never Blocked (LOCKED)". They publish and get flagged here.
