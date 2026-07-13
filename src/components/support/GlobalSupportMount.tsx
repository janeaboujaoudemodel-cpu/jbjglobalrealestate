/**
 * GlobalSupportMount — mounts the always-visible SupportLauncher and a global
 * AIConcierge drawer that any component can open via `window.dispatchEvent(new CustomEvent("jbj:open-concierge"))`.
 */
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import SupportLauncher from "./SupportLauncher";
import AIConcierge from "@/components/home/AIConcierge";

export default function GlobalSupportMount() {
  const [conciergeOpen, setConciergeOpen] = useState(false);
  const { pathname } = useLocation();
  const hidePublicFloatingEntry = pathname === "/access" || pathname.startsWith("/access/");

  useEffect(() => {
    const onOpen = () => setConciergeOpen(true);
    window.addEventListener("jbj:open-concierge", onOpen as EventListener);
    return () => window.removeEventListener("jbj:open-concierge", onOpen as EventListener);
  }, []);

  if (hidePublicFloatingEntry) return null;

  return (
    <>
      <SupportLauncher />
      {conciergeOpen && (
        <AIConcierge open={conciergeOpen} onClose={() => setConciergeOpen(false)} />
      )}
    </>
  );
}
