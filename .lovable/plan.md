

# Complete Color Palette Audit — JBJ Global Real Estate

Every visible color currently used across the platform, organized by role.

---

## 1. GOLD SYSTEM (Primary Brand / CTA / Accents)

| Token | HSL | Hex Equivalent | Where Used |
|-------|-----|----------------|------------|
| `--gold` | `42 45% 59%` | `#C8A766` | Buttons, borders, active states, icons — **everywhere** |
| `--gold-light` | `42 50% 65%` | `#D4B87A` | Hover states, lighter accents |
| `--gold-dark` | `42 40% 50%` | `#B3944D` | Darker gold accents |
| `--gold-muted` | `42 35% 55%` | `#B89F66` | Muted gold for subtle elements |
| Hardcoded gold variant | — | `#C9A84C` | Owner sidebar, CRM cards, email signatures (~521 files) |
| Hardcoded bright gold | — | `#D4AF37` | Brand palette accent default |

**Note:** `#C9A84C` and `#C8A766` are used interchangeably — these are two slightly different golds competing across the codebase.

---

## 2. CHAMPAGNE SYSTEM (Header / Sidebar / Layer 2 Surfaces)

| Token | HSL | Hex Equivalent | Where Used |
|-------|-----|----------------|------------|
| `--champagne-1` | `39 52% 90%` | `#EEDEC3` | Header gradient start, layer-2 gradients |
| `--champagne-2` | `38 38% 85%` | `#DED0B8` | Header gradient mid, also `--primary` |
| `--champagne-3` | `38 28% 74%` | `#C4B59C` | Header gradient end, sidebar body |
| Hardcoded champagne gradient | — | `#F5EBD7 → #E8DCC8 → #D4C4A8` | Layer-2 cards, tab triggers, icon boxes, buttons (~500+ occurrences) |
| Body background (desktop) | — | `#E8DCC8` | `body` background on md+ screens |

---

## 3. PEARL SYSTEM (Layer 3 / Inner Cards / Inputs)

| Token | HSL | Hex Equivalent | Where Used |
|-------|-----|----------------|------------|
| `--pearl-1` | `40 38% 96%` | `#F8F4ED` | Inner card surfaces |
| `--pearl-2` | `39 28% 92%` | `#EDE6DA` | Mid pearl |
| `--pearl-3` | `38 24% 87%` | `#DDD4C6` | Darker pearl |
| Hardcoded pearl gradient | — | `#FDFBF7 → #F5F0E6 → #EDE4D3` | Card interiors, inputs, modals, dialogs (~500+ occurrences) |

---

## 4. DARK BACKGROUND (Page / Section Background)

| Description | HSL | Hex Equivalent | Where Used |
|-------------|-----|----------------|------------|
| Dark luxury brown start | `38 35% 12%` | `#291F12` | Page backgrounds (129 files) |
| Dark luxury brown mid | `36 30% 16%` | `#2E2418` | Page backgrounds |
| Dark luxury brown end | `34 25% 12%` | `#261F15` | Page backgrounds |
| Initial paint / body | — | `#1a1510` | `index.html` body to prevent white flash |

---

## 5. TEXT COLORS

| Description | Hex / Class | Where Used |
|-------------|-------------|------------|
| Primary text (near black) | `#1A1A1A` / `--foreground: 222.2 84% 4.9%` (`#030712`) | Body text, headings |
| Black | `#000000` / `text-black` | Labels, active navigation items |
| Muted text | `--muted-foreground: 215.4 16.3% 46.9%` (`#64748B`) | Secondary text, descriptions |
| Zinc-700 | `#3F3F46` (Tailwind) | Inactive nav items, secondary labels |
| Warm brown icon | `#8B7355` | Icon color on champagne surfaces (~19 files) |
| White text | `#FFFFFF` | Text on dark/gold backgrounds |

---

## 6. FUNCTIONAL / STATUS COLORS

| Token | HSL | Hex Equivalent | Where Used |
|-------|-----|----------------|------------|
| `--destructive` | `0 84.2% 60.2%` | `#EF4444` | Delete buttons, error states |
| `--handover` | `24 95% 52%` | `#F97316` | Handover badges, listing tags |
| Emerald (success) | Tailwind `emerald-500` | `#10B981` | Success states, checkmarks |

---

## 7. UI FRAMEWORK COLORS

| Token | HSL | Purpose |
|-------|-----|---------|
| `--background` | `0 0% 100%` | Base white background |
| `--foreground` | `222.2 84% 4.9%` | Base text color |
| `--card` | `0 0% 100%` | Card backgrounds |
| `--popover` | `0 0% 100%` | Popover backgrounds |
| `--border` | `214.3 31.8% 91.4%` | Default borders |
| `--input` | `214.3 31.8% 91.4%` | Input borders |
| `--ring` | `38 28% 74%` | Focus rings (champagne-tinted) |
| `--secondary` | `210 40% 96.1%` | Secondary surfaces |
| `--muted` | `210 40% 96.1%` | Muted surfaces |
| `--accent` | `210 40% 96.1%` | Accent surfaces |

---

## 8. PREMIUM / CRM / SIDEBAR

| Token | HSL | Purpose |
|-------|-----|---------|
| `--premium-bg` | `0 0% 5%` | Premium dark bg |
| `--premium-card` | `0 0% 9%` | Premium card bg |
| `--premium-card-border` | `0 0% 18%` | Premium card border |
| `--crm-bg` | `0 0% 100%` | CRM white bg |
| `--crm-highlight` | `210 40% 98%` | CRM highlight |
| `--jj-suit` | `155 18% 18%` | Suit green (icons) |

---

## 9. AI TOOL COLORS (excluded per your request, listed for completeness)

`--ai-purple`, `--ai-fuchsia`, `--ai-cyan`, `--ai-emerald`, `--ai-amber`, `--ai-rose`, `--ai-glow`

---

## SUMMARY — Your Brand Colors At A Glance

```text
GOLD SYSTEM
  Primary Gold:     #C8A766  (also #C9A84C variant)
  Bright Gold:      #D4AF37
  Gold Light:       #D4B87A
  Gold Dark:        #B3944D

CHAMPAGNE (Header/Sidebar/Layer 2)
  Light:            #EEDEC3 → #F5EBD7
  Mid:              #DED0B8 → #E8DCC8
  Dark:             #C4B59C → #D4C4A8

PEARL (Cards/Inputs/Layer 3)
  Light:            #FDFBF7
  Mid:              #F5F0E6
  Dark:             #EDE4D3

DARK BROWN (Page Backgrounds)
  Start:            #291F12
  Mid:              #2E2418
  End:              #261F15
  Initial Paint:    #1a1510

TEXT
  Primary:          #000000 / #1A1A1A
  Muted:            #64748B
  Warm Brown Icon:  #8B7355
  White:            #FFFFFF

FUNCTIONAL
  Destructive Red:  #EF4444
  Handover Orange:  #F97316
  Success Green:    #10B981
```

This is your complete, active color system. Tell me which colors you want to change and what the new hex values should be, and I'll prepare a global update plan.

