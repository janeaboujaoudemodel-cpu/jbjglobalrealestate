import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

/**
 * useAntiCapture — Prevents screenshots, copy, print, and recording for auditors.
 * Activated only when isAuditor && !isOwner.
 */
export function useAntiCapture() {
  const { isAuditor, isOwner } = useAuth();
  const isActive = isAuditor && !isOwner;

  useEffect(() => {
    if (!isActive) return;

    // CSS restrictions
    const style = document.createElement("style");
    style.id = "anti-capture-style";
    style.textContent = `
      body {
        -webkit-user-select: none !important;
        -moz-user-select: none !important;
        -ms-user-select: none !important;
        user-select: none !important;
        -webkit-touch-callout: none !important;
      }
      @media print {
        body { display: none !important; }
      }
    `;
    document.head.appendChild(style);

    // Block keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      // Block Ctrl+C, Ctrl+P, Ctrl+S, PrintScreen
      if (
        (e.ctrlKey || e.metaKey) &&
        ["c", "p", "s", "a"].includes(e.key.toLowerCase())
      ) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      if (e.key === "PrintScreen" || e.key === "F12") {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    // Block right-click
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    // Block copy
    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
    };

    document.addEventListener("keydown", handleKeyDown, true);
    document.addEventListener("contextmenu", handleContextMenu, true);
    document.addEventListener("copy", handleCopy, true);

    return () => {
      const existingStyle = document.getElementById("anti-capture-style");
      if (existingStyle) existingStyle.remove();
      document.removeEventListener("keydown", handleKeyDown, true);
      document.removeEventListener("contextmenu", handleContextMenu, true);
      document.removeEventListener("copy", handleCopy, true);
    };
  }, [isActive]);
}
