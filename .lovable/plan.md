# Restore "Generate with AI" Button in Document Studio Step 2

## Problem

In Document Studio's left sidebar at **Step 2 — Details**, the footer currently shows only one button:

```
[ Continue to Review & Send  → ]
```

The previous **"Generate with AI"** action (which calls `handleGenerate`, line 1081, to draft the AI intro/closing and run the composer) was removed from this rail. The user has to either click into Step 3 (which only exposes Subject + Recipient + Send) or hunt for the Generate button hidden inside the center preview's `EmptyBody` empty-state — and that empty state never appears once the auto-composed body is showing.

Because the dedicated Generate control is gone, the user filled in the details on the left, saw a preview they consider empty (no AI-drafted intro/closing, just the deterministic skeleton), and has no obvious way to ask the AI to fill it in.

## Fix

In `src/components/document-studio/DocumentStudio.tsx`, in the Step 2 details panel footer (the block currently rendering "Continue to Review & Send" around lines 2257–2264), restore Generate with AI as the **primary** button, keep Continue as **secondary**.

```text
[ ✦ Generate with AI ]   ← primary, full width
[ Continue to Review & Send → ]   ← outline, full width
```

Behaviour:

- **Generate with AI** calls the existing `handleGenerate()`. Disabled while `generating` is true; shows the spinner and "Generating…" label inside the same button when busy (same pattern already used in `EmptyBody`).
- Disabled when required fields for the current template are missing — reuse the existing `canGenerate`-style check (or fall back to `!template`).
- **Continue to Review & Send** keeps its current behaviour (`setStep(3)`).
- Tip caption below adjusts to: *"Tip: Generate drafts the AI body. You can also type directly into the page or use the AI assistant on the right."*

No other panels, the top toolbar, the email panel, or the composer are touched. No new files. No design tokens introduced.

## Out of scope

- The Step 3 panel keeps Subject / Recipient / Send / Export / Test exactly as it is.
- The center preview's empty-state Generate button stays as is (it's a fallback for when `bodyHtml` is empty).
- No change to `handleGenerate`, the composer, the auto-render `useEffect`, signature block, or letterhead.
