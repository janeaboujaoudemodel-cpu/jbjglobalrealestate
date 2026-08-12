---
name: Deep-Top Rail & No White Seam Lock
description: Rail deep-top emerald must outrank pass-305 specificity; Moon homepage top 160px is emerald so no white strip can appear under the header
type: design
---

- The vertical rail (collapsed and expanded, Moon / default) is always darkest at the very top (#01120b), and fades continuously to black at the bottom with NO brighter mid band behind the icons (#01120b -> #021610 -> #010c07 -> #000). Any new rule must outrank `html[data-jbj-theme="moon"]:not([data-jbj-backend-lock="1"])` from pass-305, which otherwise repaints the rail with the bright-top `--jj-long-emerald-v`.
- Moon's page canvas is intentionally light (#F5F7F6). To prevent a white strip under the 56px utility bar while hero media loads, the homepage shell paints emerald for its first 160px.
- Enforced in `src/styles/pass-310-deep-rail-and-seam-lock.css`.
