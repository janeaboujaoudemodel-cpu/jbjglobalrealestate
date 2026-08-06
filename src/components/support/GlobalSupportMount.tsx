/**
 * GlobalSupportMount — mounts the always-visible SupportLauncher and a global
 * AIConcierge drawer that any component can open via `window.dispatchEvent(new CustomEvent("jbj:open-concierge"))`.
 */
import { useEffect, useState } from "react";
import SupportLauncher from "./SupportLauncher";
const AIConcierge = lazy(() => import("@/components/home/AIConcierge"));
const LeadFormDialog = lazy(() => import("@/components/gate/LeadFormDialog"));

export default function GlobalSupportMount() {
  const [conciergeOpen, setConciergeOpen] = useState(false);
  const [advisorOpen, setAdvisorOpen] = useState(false);

  useEffect(() => {
    const onOpen = () => setConciergeOpen(true);
    window.addEventListener("jbj:open-concierge", onOpen as EventListener);
    return () => window.removeEventListener("jbj:open-concierge", onOpen as EventListener);
  }, []);

  useEffect(() => {
    const onOpen = () => setAdvisorOpen(true);
    window.addEventListener("jbj:open-advisor", onOpen as EventListener);
    window.addEventListener("jbj:open-inquiry", onOpen as EventListener);
    return () => {
      window.removeEventListener("jbj:open-advisor", onOpen as EventListener);
      window.removeEventListener("jbj:open-inquiry", onOpen as EventListener);
    };
  }, []);



  return (
    <>
      <SupportLauncher />
      {conciergeOpen && (
        <AIConcierge open={conciergeOpen} onClose={() => setConciergeOpen(false)} />
      )}
      <LeadFormDialog open={advisorOpen} onOpenChange={setAdvisorOpen} sourcePage={window.location.pathname} />
    </>
  );
}
