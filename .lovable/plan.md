## Targeted global contrast repair

I’ll fix the actual broken global patterns instead of adding another broad override.

### 1. Fix invisible icons in label tiles globally
**File:** `src/index.css`

The current icon contrast guard is too broad:

```css
[class*="bg-[#B89555]"] > svg { color: #FFFFFF; }
[class*="bg-[#1A1A1A]"] > svg { color: #FFFFFF; }
```

This also matches translucent tiles like `bg-[#B89555]/10` and `bg-[#1A1A1A]/75`, which makes icons white inside pale champagne/gold boxes. That is why some boxes look empty.

I will replace those substring selectors with exact class-token selectors:

```css
[class~="bg-[#B89555]"] > svg
[class~="bg-[#1A1A1A]"] > svg
```

This preserves white icons on **solid** dark/gold tiles, but stops forcing white icons on faded/tinted icon boxes. IconTile and all similar label/icon tiles will show their correct gold/red/semantic icons again.

### 2. Make vertical sidebar Contact / Support readable
**File:** `src/components/navigation/GlobalVerticalNav.tsx`

Update the bottom Contact and Support actions so they are not plain faint text on champagne:

- Use visible champagne cards with `border-red-600/35` and `bg-red-600/8`.
- Keep icons solid red (`#DC2626`) at rest.
- Text stays solid ink (`#1A1A1A`) at rest.
- Hover becomes solid red background with white text/icon.
- Collapsed sidebar Contact/Support icons get the same red readable treatment.

### 3. Remove the unwanted “54 / 054” property count from filter shortcut areas
**Files:**
- `src/pages/Properties.tsx`
- `src/components/filters/FilterShortcutBar.tsx`
- `src/components/navigation/HorizontalUtilityBar.tsx`

The property filter rail currently has a live result badge:

```tsx
<Activity /> 54 Properties
```

This is what is showing as the unwanted number in the search/filter area. I will remove it from the horizontal shortcut filter UI and keep result counts only in the proper results header/list area.

Changes:
- Stop passing `resultsCount={finalProjects.length}` into `FilterShortcutBar` from `Properties.tsx`.
- Keep `resultsLabel` harmless or remove it where it is unused.
- In `FilterShortcutBar`, make the live result badge opt-in only if a new prop like `showResultsCount` is explicitly true. Default false.
- Horizontal header will not show result numbers.
- Properties page filter rail will not show result numbers.

### 4. Fix “All Emirates”, “All Areas”, select triggers, popovers at normal load
**Files:**
- `src/components/ui/select.tsx`
- `src/pages/Properties.tsx`
- `src/components/filters/FilterShortcutBar.tsx`
- `src/components/navigation/HorizontalUtilityBar.tsx`

The Radix select trigger/content and filter pills must never render white text on champagne/light backgrounds.

I will harden the base UI components:
- `SelectTrigger`: force `text-[#1A1A1A]`, `bg-[#FDFBF7]`, `border-[#B89555]/40`, and ensure child `span` inherits ink.
- `SelectContent` / `SelectItem`: ensure menu items are ink on champagne at rest and hover/focus.
- `FilterShortcutBar` light variant: all inactive pills use ink text on champagne, active pills use white text only on solid ink backgrounds.
- Any `text-white/70` used inside light filter badges will be replaced with ink or removed.

This fixes All Emirates, All Areas, developer, price, bedroom, status, and other filter labels across the site.

### 5. Fix properties hero readability
**Files:**
- `src/pages/Properties.tsx`
- `src/components/PropertiesHeroVideo.tsx`
- `src/index.css`

Properties hero needs the same dark-surface protection as the homepage hero:
- Add/confirm `data-surface="dark"` on the properties hero wrapper.
- Strengthen the video/photo scrim so “Properties”, “Curated Listings. Global Standard.” and subtitle are readable at normal load.
- Lock hero text to white with strong text shadow only inside `.jj-hero-fullscreen[data-surface="dark"]`.
- Avoid forcing dark text inside dark/video heroes.

### 6. Fix listings card labels, location, developer, CTA buttons
**Files:**
- `src/components/ProjectCard.tsx`
- `src/components/ui/developer-link.tsx`
- `src/index.css`

Property listing cards currently use muted/gold classes that can be too weak on champagne surfaces.

I will update:
- Location row: solid warm-brown/ink instead of muted gray; MapPin stays visible gold/brown.
- Developer row: “by” uses ink; developer name uses solid gold or ink with underline/hover, not faded gold.
- Starting from / Price on request: readable ink/orange/gold according to existing price token rules.
- CTA buttons: enforce white text/icons only on solid red/ink/gold buttons; champagne buttons use ink text.
- Listing badges: no white text on pale gold/champagne backgrounds.

### 7. Global safety net for light surfaces only
**File:** `src/index.css`

Add a narrowly scoped light-surface guard for interactive labels:

- On champagne/light surfaces, text in buttons, anchors, select triggers, popovers, and labels cannot be white unless the element itself has a solid dark/red/gold background.
- Icons inside translucent tiles keep their authored color.
- Dark/video surfaces and `[data-surface="dark"]` remain excluded.

This makes the fix apply across the website without damaging heroes or dark sections.

## QA checklist after implementation

I will inspect real preview screenshots for:

1. Vertical sidebar expanded: Contact, Support, Sign Out readable.
2. Vertical sidebar collapsed: Contact/Support icons visible.
3. `/properties` top hero: all hero content readable.
4. `/properties` horizontal header filter: no “54/054” number in search/filter rail.
5. `/properties` in-page filter rail: no unwanted number, All Emirates/All Areas readable at rest.
6. Properties listing cards: location, developer, labels, and CTA buttons readable.
7. Any IconTile/label icon box: no empty white icon boxes; icons render in their proper color.

No features or content will be removed; only contrast, icon visibility, and the unwanted filter count display will be corrected.