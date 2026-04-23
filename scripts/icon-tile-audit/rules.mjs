/**
 * Pure, unit-testable rule functions for the icon-tile audit.
 * Each rule returns either null (pass) or a failure object: { rule, message, ...meta }.
 */

export const RULES = {
  MISSING_ICON: "missing_icon",
  CLIPPED: "clipped",
  LOW_CONTRAST: "low_contrast",
  OBSCURED: "obscured",
  INVISIBLE: "invisible",
  COLOR_ON_COLOR: "color_on_color",
};

/** sRGB → relative luminance (WCAG) */
export function relLuminance({ r, g, b }) {
  const toLin = (c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * toLin(r) + 0.7152 * toLin(g) + 0.0722 * toLin(b);
}

/** WCAG contrast ratio between two RGB colors */
export function contrastRatio(a, b) {
  const la = relLuminance(a);
  const lb = relLuminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

/** Approximate ΔE (CIE76 over RGB; coarse but sufficient for "match") */
export function deltaE(a, b) {
  const dr = a.r - b.r;
  const dg = a.g - b.g;
  const db = a.b - b.b;
  return Math.sqrt(dr * dr + dg * dg + db * db) / 4.42; // normalize ~0..100
}

export function checkMissingIcon(tile) {
  if (!tile.hasSvg) {
    return { rule: RULES.MISSING_ICON, message: "Tile has no <svg> child" };
  }
  return null;
}

export function checkClipped(tile) {
  const { iconBox, tileBox } = tile;
  if (!iconBox) return null;
  if (iconBox.w < 12 || iconBox.h < 12) {
    return { rule: RULES.CLIPPED, message: `Icon size ${iconBox.w}×${iconBox.h} < 12px` };
  }
  if (
    iconBox.x < tileBox.x - 1 ||
    iconBox.y < tileBox.y - 1 ||
    iconBox.x + iconBox.w > tileBox.x + tileBox.w + 1 ||
    iconBox.y + iconBox.h > tileBox.y + tileBox.h + 1
  ) {
    return { rule: RULES.CLIPPED, message: "Icon bbox extends outside tile" };
  }
  return null;
}

export function checkInvisible(tile) {
  if (tile.opacity != null && tile.opacity < 0.4) {
    return { rule: RULES.INVISIBLE, message: `opacity=${tile.opacity}` };
  }
  if (tile.visibility === "hidden" || tile.display === "none") {
    return { rule: RULES.INVISIBLE, message: `${tile.visibility}/${tile.display}` };
  }
  if (tile.iconColor && tile.bgColor && deltaE(tile.iconColor, tile.bgColor) < 5) {
    return { rule: RULES.INVISIBLE, message: "Icon pixels match background (ΔE<5)" };
  }
  return null;
}

export function checkLowContrast(tile, threshold = 3.0) {
  if (!tile.iconColor || !tile.bgColor) return null;
  const ratio = contrastRatio(tile.iconColor, tile.bgColor);
  if (ratio < threshold) {
    return {
      rule: RULES.LOW_CONTRAST,
      message: `Contrast ${ratio.toFixed(2)} < ${threshold}`,
      contrast: ratio,
    };
  }
  return null;
}

export function checkColorOnColor(tile) {
  if (!tile.iconColor || !tile.bgColor) return null;
  const { iconColor: a, bgColor: b } = tile;
  if (a.r === b.r && a.g === b.g && a.b === b.b) {
    return { rule: RULES.COLOR_ON_COLOR, message: "Icon color identical to background" };
  }
  return null;
}

export function checkObscured(tile) {
  if (tile.defaultInkPx == null || tile.stateInkPx == null) return null;
  if (tile.defaultInkPx === 0) return null;
  const drop = (tile.defaultInkPx - tile.stateInkPx) / tile.defaultInkPx;
  if (drop > 0.25) {
    return {
      rule: RULES.OBSCURED,
      message: `Visible ink dropped ${(drop * 100).toFixed(0)}% in ${tile.state} state`,
    };
  }
  return null;
}

export function runAllRules(tile) {
  const out = [];
  for (const fn of [
    checkMissingIcon,
    checkClipped,
    checkInvisible,
    checkLowContrast,
    checkColorOnColor,
    checkObscured,
  ]) {
    const r = fn(tile);
    if (r) out.push({ ...r, contrast: r.contrast ?? (tile.iconColor && tile.bgColor ? contrastRatio(tile.iconColor, tile.bgColor) : null) });
  }
  return out;
}
