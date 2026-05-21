## What is broken

The Voice Concierge is not failing because of the frontend form. The backend token function is reaching ElevenLabs, but ElevenLabs returns:

```text
401 missing_permissions: The API key is missing convai_write
```

So the stored ElevenLabs keys exist, and the agent ID is configured, but both available API keys do not have permission to create a Conversational AI session token.

The agent ID previously provided is:

```text
agent_2301krk3haxpf1p938485z0q5eer
```

## What is required from your end

1. Open ElevenLabs.
2. Go to API Keys / workspace settings.
3. Create or update an API key that has Conversational AI permissions, specifically `convai_write`.
4. After this plan is approved, I will trigger the secure secret update form for `ELEVENLABS_API_KEY` so you can paste the key privately.
5. Keep `ELEVENLABS_AGENT_ID` set to `agent_2301krk3haxpf1p938485z0q5eer`.

## Fix plan

### 1. Lock the backend to the correct Jessica agent ID
- Update `elevenlabs-conversation-token` so it no longer guesses or auto-selects another agent when a configured `agent_...` exists.
- Improve the backend response to distinguish:
  - missing API key
  - missing `convai_write` permission
  - wrong/missing agent ID
  - ElevenLabs quota/network failure
- Keep the intake gate required before any token request.

### 2. Add a clean fallback contact path
- If ElevenLabs is unavailable because the API key is missing permissions, show a premium fallback instead of simply “Unavailable”.
- Give the visitor two clear choices after submitting the form:
  - `Start live agent call` for ElevenLabs voice
  - `Continue on WhatsApp` using a direct `wa.me` link to the company number
- This avoids Twilio because the requirement is visitor click-to-chat, not server-side automated WhatsApp messaging.

### 3. Redesign the Speak with Us launcher
- Replace the big rectangular-looking floating button with a premium compact pill/call launcher.
- Suggested copy:
  - `Free live agent call`
  - secondary small label: `Voice or WhatsApp`
- Keep it visually aligned with the champagne/gold design system.
- Position it under/near the chat support without overlapping.

### 4. Fix the call flow UX
- Click launcher.
- If no lead exists: open intake form.
- After submit: show “Your concierge is ready” and offer:
  - start voice call
  - WhatsApp fallback
- If a lead already exists: open the choice panel directly.
- If voice call fails due to ElevenLabs permission: show a clear message and WhatsApp fallback.

### 5. Test end-to-end
- Test backend token function with an existing lead.
- Confirm the expected behavior before the new key is added: clear permission error + fallback UI.
- After you update the key: retest token creation and live call start.
- Verify the button appears globally under chat support and is not oversized.

## Files to touch

- `supabase/functions/elevenlabs-conversation-token/index.ts`
- `src/components/VoiceConciergeWidget.tsx`
- `src/components/voice-concierge/VoiceConciergeIntakeModal.tsx` only if the post-submit handoff needs a small adjustment

## Acceptance result

After implementation, visitors will not see a dead/unavailable call button. They will see a premium “Free live agent call” launcher, complete the required lead form, then either connect to the ElevenLabs voice agent when the API key has `convai_write`, or continue through WhatsApp if ElevenLabs is not available.