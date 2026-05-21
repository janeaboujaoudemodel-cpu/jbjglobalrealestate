import { useEffect } from "react";

/**
 * Projects = the full public front-end project browser. Brokers already have
 * full access (AuthRequiredRoute), so we just send them there in a new tab.
 */
export default function BrokerProjectsRedirect() {
  useEffect(() => {
    window.open("/projects", "_blank", "noopener");
  }, []);

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">Projects</h1>
        <p className="text-sm text-[#1A1A1A]/70 mt-1">
          Opens the full project browser in a new tab.
        </p>
      </header>
      <a
        href="/projects" target="_blank" rel="noopener"
        className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[#1A1A1A] text-[#F7F2EA] text-sm hover:opacity-90"
      >
        Open Projects →
      </a>
    </div>
  );
}
