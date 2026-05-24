/**
 * GlobalSupportMount — mounts the always-visible SupportLauncher and a global
 * AIConcierge drawer that any component can open via `window.dispatchEvent(new CustomEvent("jbj:open-concierge"))`.
 */
import { useEffect, useState } from "react";
import SupportLauncher from "./SupportLauncher";
import AIConcierge from "@/components/home/AIConcierge";

export default function GlobalSupportMount() {
  const [conciergeOpen, setConciergeOpen] = useState(false);

  useEffect(() => {
    const onOpen = () => setConciergeOpen(true);
    window.addEventListener("jbj:open-concierge", onOpen as EventListener);
    return () => window.removeEventListener("jbj:open-concierge", onOpen as EventListener);
  }, []);

  return (
    <>
      <SupportLauncher />
      {conciergeOpen && (
        <AIConcierge open={conciergeOpen} onClose={() => setConciergeOpen(false)} />
      )}
    </>
  );
}
