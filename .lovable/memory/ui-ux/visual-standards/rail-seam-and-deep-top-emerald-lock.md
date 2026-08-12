---
name: Rail Seam & Deep-Top Emerald Lock
description: Sidebar brand band is full-bleed, the utility bar is pinned right:0 (never 100vw math), and the emerald rail starts deepest at the top
type: design
---

- The horizontal utility bar is `right: 0; width: auto` — never sized with `100vw - sidebar` math, so expanding/collapsing the rail can never leave an unpainted strip on the right.
- The sidebar brand band (monogram + wordmark) paints edge to edge in both collapsed and expanded states. Never a highlight covering only the middle of the row; the inner link is always transparent.
- Emerald rail gradient: deepest at the very top (#01120b), a slight lift around the middle (#043524 ~46%), returning to black at the bottom. Same in collapsed and expanded.
- Sun collapsed rail footer glyphs/labels are always black (#0A0A0A); no gold scrollbar sliver or pseudo-element arch on the rail.

Enforced in `src/styles/pass-309-rail-seam-and-deep-top.css`.
