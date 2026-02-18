
# AI Document Generator — Smart Per-Type Forms & Intelligent Edge Function

## The Core Problem

The AI Document Generator shows the **same 5 fields** regardless of whether you pick "SMS/WhatsApp", "Property Listing", or "Follow-up Email". This means:
- An SMS form asks for the same info as a legal contract
- The AI gets very little context, producing nearly identical generic output
- Fields like "Recipient Name" and "Subject" make no sense for a Property Listing
- The edge function expects `propertyDetails` / `partyDetails` but the frontend sends `details` / `recipientName` — there is a **field name mismatch** causing the AI to get the wrong data

## What Each Type Should Have

| Document Type | Unique Fields |
|---|---|
| **Property Listing** | Property name, Location/Area, Size (sqft), Bedrooms, Price (AED), Key features (amenities), Developer, Handover date, ROI/yield %, View type |
| **Follow-up Email** | Client name, Previous meeting date, Properties discussed, Next steps, Urgency level |
| **Introduction Email** | Client name, Nationality, Budget, Property type interest, How they found us |
| **SMS / WhatsApp** | Client name, Message purpose, Character limit (160 / 320), Include link? |
| **Social Media Post** | Platform (Instagram/LinkedIn/Twitter/TikTok), Property highlights, Hashtag style, Include emojis? |
| **Newsletter** | Topic, Target segment, Key properties to feature, Market stat to include |
| **Brochure Text** | Property name, Developer, USPs, Lifestyle description, Location advantages |
| **Client Report** | Client name, Budget range, Requirements, Properties viewed, Recommendation |

## Plan

### File 1: `src/components/ai-tools/premium/AIDocumentGeneratorPremium.tsx`

**Complete redesign** with dynamic form rendering:

1. **Type Selector Row** — Keep the 4-button quick-pick grid (top row) + dropdown for more. When you click a type, the form below **morphs** to show only the fields relevant to that type.

2. **Per-type field configs** — A `DOCUMENT_TYPE_CONFIGS` map that defines each type's unique fields:

```typescript
const DOCUMENT_TYPE_CONFIGS = {
  "listing": {
    label: "Property Listing",
    description: "A compelling MLS-style listing description for portals (Bayut, PropertyFinder, Dubizzle)",
    fields: [
      { key: "propertyName", label: "Property / Project Name *", type: "input", placeholder: "e.g. Emaar Beachfront - Marina Vista" },
      { key: "location", label: "Area / Location *", type: "input", placeholder: "e.g. Dubai Marina, JBR" },
      { key: "propertyType", label: "Property Type", type: "select", options: ["Apartment","Villa","Townhouse","Penthouse","Office","Retail","Plot"] },
      { key: "bedrooms", label: "Bedrooms", type: "select", options: ["Studio","1BR","2BR","3BR","4BR","5BR+","Commercial"] },
      { key: "size", label: "Size (sqft)", type: "input", placeholder: "e.g. 1,250 sqft" },
      { key: "price", label: "Price (AED)", type: "input", placeholder: "e.g. AED 2,500,000" },
      { key: "developer", label: "Developer", type: "input", placeholder: "e.g. Emaar Properties" },
      { key: "handover", label: "Handover / Completion", type: "input", placeholder: "e.g. Q4 2026" },
      { key: "amenities", label: "Key Amenities & Features", type: "textarea", placeholder: "Pool, gym, sea view, smart home..." },
      { key: "roi", label: "Expected ROI / Rental Yield", type: "input", placeholder: "e.g. 6-8% annual" },
    ]
  },
  "email-follow-up": {
    label: "Follow-up Email",
    description: "A professional follow-up after a meeting or property viewing",
    fields: [
      { key: "clientName", label: "Client Name *", type: "input", placeholder: "e.g. Mr. Ahmed Al Mansoori" },
      { key: "meetingDate", label: "Previous Meeting / Viewing Date", type: "input", placeholder: "e.g. 15 February 2026" },
      { key: "propertiesDiscussed", label: "Properties / Projects Discussed", type: "textarea", placeholder: "e.g. Sobha Hartland 2 villas, Dubai Hills townhouses" },
      { key: "clientBudget", label: "Client Budget", type: "input", placeholder: "e.g. AED 3–5M" },
      { key: "nextSteps", label: "Proposed Next Steps", type: "input", placeholder: "e.g. Schedule site visit, send EOI form" },
      { key: "urgency", label: "Urgency", type: "select", options: ["Low – exploring options","Medium – actively looking","High – ready to buy this month"] },
    ]
  },
  "email-introduction": { ... },
  "sms": { ... },
  ...
}
```

3. **Dynamic field state** — Instead of a fixed `formData` object, use a `Record<string, string>` that resets when type changes:

```typescript
const [typeFields, setTypeFields] = useState<Record<string, string>>({});
const handleTypeChange = (newType: string) => {
  setFormData(prev => ({ ...prev, documentType: newType }));
  setTypeFields({}); // reset fields on type switch
};
```

4. **Dynamic form renderer** — A `renderField()` helper renders `input`, `textarea`, `select`, or `radio` based on the field config.

5. **Tone selector** — Keep as-is, but hide it for SMS (character limit matters more than tone there).

6. **Submit payload** — Sends the full `typeFields` record alongside `documentType` and `tone` to the edge function:

```typescript
const result = await invokeTool("ai-document-generator", {
  documentType: formData.documentType,
  tone: formData.tone,
  typeFields,  // all per-type specific fields
});
```

### File 2: `supabase/functions/ai-document-generator/index.ts`

**Rewrite the prompt system** to be per-document-type aware:

1. **Fix the field name mismatch** — Accept `typeFields` from frontend (plus backwards-compat with old `details`)

2. **Per-type system prompts** — Each type gets a specialized system role and output instructions:

```typescript
const TYPE_PROMPTS: Record<string, { systemRole: string; outputInstructions: string; maxChars?: number }> = {
  "listing": {
    systemRole: "You are an expert Dubai real estate copywriter specializing in property portal listings (Bayut, PropertyFinder). Write compelling, SEO-optimized listings.",
    outputInstructions: "Write a 300-400 word property listing with: headline, 3-sentence overview, bullet-point features, location section, payment plan mention, call to action."
  },
  "email-follow-up": {
    systemRole: "You are a top real estate agent writing a professional client follow-up email after a property viewing.",
    outputInstructions: "Write a warm, professional follow-up email with: subject line, greeting, recap of viewing, 2-3 property highlights, next steps CTA, signature from JBJ Global."
  },
  "sms": {
    systemRole: "You write concise, high-converting real estate WhatsApp/SMS messages.",
    outputInstructions: "Write 2 versions: (1) under 160 characters for SMS, (2) under 320 characters for WhatsApp. Both must include a call to action. No filler words."
  },
  "social-media": {
    systemRole: "You are a real estate social media content creator for Dubai luxury properties.",
    outputInstructions: "Write the post body, 3 hashtag sets (general/location/luxury), a caption hook for the first line, and a CTA. Adapt style for the specified platform."
  },
  ...
};
```

3. **Structured output per type** — The JSON response shape changes per type:
   - `listing`: returns `{ document, headline, keyFeatures[], callToAction }`
   - `email-follow-up`: returns `{ subject, document, nextSteps[] }`
   - `sms`: returns `{ smsVersion (≤160 chars), whatsappVersion (≤320 chars), document }`
   - `social-media`: returns `{ document, hashtags[], hook, platform }`

4. **Smart context assembly** — Build the prompt from the `typeFields`:

```typescript
const fieldContext = Object.entries(typeFields || {})
  .map(([k, v]) => `${k}: ${v}`)
  .join('\n');
```

### File 3: Output Display in `AIDocumentGeneratorPremium.tsx`

The results section needs to adapt per type too:
- **SMS** → show two boxes: "SMS Version (160 chars)" and "WhatsApp Version (320 chars)"
- **Email types** → show subject line box + email body
- **Social Media** → show post content + hashtag chips + platform badge
- **Property Listing** → show full listing + a "Copy as Portal Format" button
- **All** → keep copy and alternative versions

## Priority Order

1. Frontend form per-type configs and dynamic renderer (`AIDocumentGeneratorPremium.tsx`)
2. Edge function per-type prompt system + fix field mismatch (`ai-document-generator/index.ts`)
3. Per-type output display in results section

## Summary of Files

| File | Change |
|---|---|
| `AIDocumentGeneratorPremium.tsx` | Full redesign: per-type field configs, dynamic form renderer, per-type output display |
| `supabase/functions/ai-document-generator/index.ts` | Rewrite: accept `typeFields`, per-type system prompts, per-type structured output |
