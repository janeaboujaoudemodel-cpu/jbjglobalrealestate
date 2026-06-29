import "@testing-library/jest-dom";

// Skip DOM mocks when running in a node environment (e.g. Playwright-driven specs).
if (typeof window === "undefined") {
  // No-op: setup file requires a DOM. Tests opting into `node` env handle their own setup.
} else {
// Mock matchMedia (not available in jsdom)
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});

// Mock ResizeObserver (used by Radix UI primitives like Slider)
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock DOMRect
global.DOMRect = class DOMRect {
  bottom = 0; height = 0; left = 0; right = 0; top = 0; width = 0; x = 0; y = 0;
  static fromRect() { return new DOMRect(); }
  toJSON() { return {}; }
};
}


