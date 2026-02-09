import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Declare the global flag type
declare global {
  interface Window {
    __APP_MOUNTED__?: boolean;
  }
}

const root = createRoot(document.getElementById("root")!);

root.render(
  <StrictMode>
    <App />
  </StrictMode>
);

// Mark app as mounted after first render completes
// This prevents the boot overlay from showing for runtime errors
requestAnimationFrame(() => {
  window.__APP_MOUNTED__ = true;
});
