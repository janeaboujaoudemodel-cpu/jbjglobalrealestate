# Phase 1 — JBJ Global Design System Foundation (Final)

## Objective

Build ONE clean global design system that becomes the single source of truth for the entire website.

This phase is NOT about fixing individual pages.

This phase is about eliminating the technical debt that created inconsistent UI across the project.

Nothing may be changed unless it becomes globally consistent.

---

## 1. Global Audit (READ ONLY)

Before writing a single line of code:

• Audit every shared component.

• Audit every CSS contract.

• Audit every token.

• Audit every primitive.

• Audit every repeated PASS block.

• Audit every duplicated override.

• Audit every hardcoded color.

• Audit every hardcoded button.

• Audit every hardcoded icon style.

• Audit every duplicated spacing rule.

Create a complete delete list first.

Nothing is deleted until the audit is finished.

---

## 2. Preserve Locked Standards

The following are ABSOLUTELY LOCKED.

Do NOT modify.

Do NOT refactor.

Do NOT rewrite.

Do NOT optimize.

Do NOT replace.

Only preserve them exactly as they currently work.

Examples include:

• Signature Row

• Phone + CmdK

• Hero rules

• Mortgage slider

• Document Studio

• Emerald Box Lock

• Champagne Band System

• Active Card Sheen

• Universal Contrast Guard

• Every previous LOCKED standard

These are protected.

---

## 3. Global CSS Consolidation

The current project contains accumulated CSS passes.

Replace conflicting visual overrides with ONE clean global source of truth.

Never stack more overrides.

Delete obsolete visual overrides only after verifying they are completely superseded.

Never remove CSS blindly.

Every deletion must be validated manually.

---

## 4. Design Tokens

There must only be ONE definition for:

• Colors

• Radius

• Heights

• Shadows

• Typography

• Spacing

• Hover

• Active

• Focus

• Disabled

No duplicate tokens.

No duplicated variables.

No duplicated color definitions.

---

## 5. Shared Components

Every reusable component becomes the only source of truth.

Buttons

Badges

Labels

Pills

Cards

Sidebar Items

Dropdowns

Header Controls

FAQ Rows

Forms

Progress Steps

Avatar

Icon Tiles

Everything must inherit from the shared primitives.

No page-specific implementations.

---

## 6. Global UI Rules

Every future page must inherit the same rules automatically.

That includes:

Button height

Button radius

Button padding

Icon sizes

Label sizes

Typography

Hover

Active state

Focus state

Disabled state

Spacing

Border thickness

Shadows

Animations

Surface colors

Foreground colors

Everything.

No page may override these rules unless absolutely required.

---

## 7. Global Validation (MANDATORY)

Completion is NOT based on compiling successfully.

Completion is NOT based on zero TypeScript errors.

Completion is NOT based on screenshots only.

Completion requires manual validation.

Navigate the ENTIRE website manually as if you are a real user.

Desktop

Tablet

Mobile

Every page.

Every section.

Every button.

Every dropdown.

Every modal.

Every tooltip.

Every hover.

Every active state.

Every sidebar state.

Every hamburger menu.

Every download.

Every upload.

Every search.

Every filter.

Every form.

Every CTA.

Every component.

Every responsive breakpoint.

Nothing may be skipped.

Nothing may be assumed.

Nothing may be claimed complete without manual verification.

---

## 8. Completion Criteria

Phase 1 is complete ONLY when:

• There are no duplicated visual CSS contracts.

• There are no conflicting overrides.

• Every primitive has a single implementation.

• Every shared component follows the same design system.

• All LOCKED standards remain untouched.

• Manual validation confirms the website is visually and technically consistent across Desktop, Tablet and Mobile.

If any inconsistency remains, Phase 1 is NOT complete.

Never move to Phase 2 until Phase 1 satisfies every requirement above.