/**
 * JBJ Hub — unified owner console that re-mounts the three existing admin
 * surfaces (Projects, Developers, Areas & Communities) as tabs.
 *
 * NO duplication: each tab lazy-mounts the current page component so all
 * business logic, RLS, mutations and hooks stay in one place. Deep-linkable
 * via ?tab=projects|developers|areas.
 */
import { lazy, Suspense, useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Building2, Users, MapPin, Sparkles } from "lucide-react";
import PageLoader from "@/components/PageLoader";
import { cn } from "@/lib/utils";

// Reuse the exact same pages that back /owner/developers/projects,
// /owner/developers and /owner/areas.
const DeveloperLiveEditor = lazy(() => import("@/pages/developer-hub/DeveloperLiveEditor"));
const DeveloperDirectory = lazy(() => import("@/pages/developer-hub-admin/DeveloperDirectory"));
const OwnerAreasAdmin = lazy(() => import("@/pages/owner/OwnerAreasAdmin"));

type TabKey = "projects" | "developers" | "areas";

const TABS: { key: TabKey; label: string; icon: typeof Building2; blurb: string }[] = [
  { key: "projects",   label: "Projects",              icon: Building2, blurb: "Every project — edit, complete, enrich." },
  { key: "developers", label: "Developers",            icon: Users,     blurb: "Developer directory — profiles, logos, company docs." },
  { key: "areas",      label: "Areas & Communities",   icon: MapPin,    blurb: "Areas & emirates — mark manually verified once curated." },
];

export default function JbjHub() {
  const [params, setParams] = useSearchParams();
  const active = (params.get("tab") as TabKey) || "projects";

  const setTab = (t: TabKey) => {
    const next = new URLSearchParams(params);
    next.set("tab", t);
    setParams(next, { replace: true });
  };

  const ActiveView = useMemo(() => {
    switch (active) {
      case "developers": return <DeveloperDirectory />;
      case "areas":      return <OwnerAreasAdmin />;
      case "projects":
      default:           return <DeveloperLiveEditor />;
    }
  }, [active]);

  return (
    <div className="min-h-screen bg-background">
      {/* Hub header */}
      <header className="border-b bg-gradient-to-r from-emerald-950 via-emerald-900 to-black text-white">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-amber-300" />
            <h1 className="text-2xl font-semibold tracking-tight">JBJ Hub</h1>
            <span className="ml-2 rounded-full bg-white/10 px-2 py-0.5 text-[11px] uppercase tracking-wider text-white/80">
              Unified admin
            </span>
          </div>
          <p className="mt-2 max-w-2xl text-sm text-white/70">
            One console for Projects, Developers, and Areas. AI enrichment, missing-field flags and
            auto-provisioning wire in here next.
          </p>

          {/* Tabs */}
          <nav className="mt-5 flex flex-wrap gap-2" aria-label="JBJ Hub sections">
            {TABS.map((t) => {
              const Icon = t.icon;
              const isActive = t.key === active;
              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition",
                    isActive
                      ? "bg-white text-emerald-900 shadow"
                      : "bg-white/10 text-white/80 hover:bg-white/20"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {t.label}
                </button>
              );
            })}
          </nav>

          <p className="mt-3 text-xs text-white/60">
            {TABS.find((t) => t.key === active)?.blurb}
            {" · "}
            <Link to="/owner/data-gaps" className="underline underline-offset-2 hover:text-white">
              Data gaps
            </Link>
          </p>
        </div>
      </header>

      {/* Active section */}
      <section key={active} className="min-h-[60vh]">
        <Suspense fallback={<PageLoader />}>{ActiveView}</Suspense>
      </section>
    </div>
  );
}
