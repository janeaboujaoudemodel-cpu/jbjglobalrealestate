// CRMSideRail — slide-in dock for Calendar / Notes / Tasks.
// Lets the owner peek at the workspace without leaving the current CRM section.
import { lazy, Suspense, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CalendarDays, NotebookPen, ListChecks, X, LayoutGrid } from "lucide-react";

const CRMCalendar = lazy(() => import("@/pages/CRMCalendar"));
const CRMNotes    = lazy(() => import("@/pages/CRMNotes"));
const CRMTasks    = lazy(() => import("@/pages/CRMTasks"));

type Tab = "calendar" | "notes" | "tasks";

const PanelFallback = () => (
  <div className="p-6 text-sm text-[#1A1A1A]/60">Loading…</div>
);

export default function CRMSideRail() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("calendar");

  const openWith = (t: Tab) => { setTab(t); setOpen(true); };

  return (
    <>
      {/* Edge dock — fixed right rail, three premium pills */}
      <div
        aria-label="CRM workspace dock"
        className="fixed right-0 top-1/2 -translate-y-1/2 z-40 flex flex-col gap-2 pr-1"
      >
        {[
          { id: "calendar" as const, label: "Calendar", Icon: CalendarDays },
          { id: "notes" as const,    label: "Notes",    Icon: NotebookPen },
          { id: "tasks" as const,    label: "Tasks",    Icon: ListChecks },
        ].map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => openWith(id)}
            title={label}
            className="group inline-flex items-center gap-2 px-3 py-2 rounded-l-xl bg-[#FDFBF7] border border-r-0 border-[#B89555]/40 shadow-sm hover:bg-[#EFE6D6] transition-colors text-[#1A1A1A]"
          >
            <Icon className="h-4 w-4" />
            <span className="text-xs font-semibold tracking-wide hidden md:inline">{label}</span>
          </button>
        ))}
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-[520px] p-0 bg-[#FDFBF7] border-l border-[#B89555]/30 [&>button]:hidden"
        >
          <SheetHeader className="px-5 pt-4 pb-3 border-b border-[#B89555]/20 bg-[#F7F2EA]">
            <div className="flex items-center justify-between gap-3">
              <SheetTitle className="text-[#1A1A1A] text-base font-semibold tracking-tight">
                Workspace
              </SheetTitle>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close workspace"
                className="h-8 w-8 inline-flex items-center justify-center rounded-full hover:bg-[#EFE6D6] text-[#1A1A1A]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)} className="mt-3">
              <TabsList className="bg-[#FDFBF7] border border-[#B89555]/30 p-1 rounded-full h-auto">
                <TabsTrigger
                  value="calendar"
                  className="rounded-full px-4 py-1.5 text-xs font-semibold data-[state=active]:bg-[#EFE6D6] data-[state=active]:text-[#1A1A1A] data-[state=active]:border data-[state=active]:border-[#B89555]"
                >
                  <CalendarDays className="h-3.5 w-3.5 mr-1.5" /> Calendar
                </TabsTrigger>
                <TabsTrigger
                  value="notes"
                  className="rounded-full px-4 py-1.5 text-xs font-semibold data-[state=active]:bg-[#EFE6D6] data-[state=active]:text-[#1A1A1A] data-[state=active]:border data-[state=active]:border-[#B89555]"
                >
                  <NotebookPen className="h-3.5 w-3.5 mr-1.5" /> Notes
                </TabsTrigger>
                <TabsTrigger
                  value="tasks"
                  className="rounded-full px-4 py-1.5 text-xs font-semibold data-[state=active]:bg-[#EFE6D6] data-[state=active]:text-[#1A1A1A] data-[state=active]:border data-[state=active]:border-[#B89555]"
                >
                  <ListChecks className="h-3.5 w-3.5 mr-1.5" /> Tasks
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </SheetHeader>

          <div className="h-[calc(100vh-128px)] overflow-y-auto crm-embed">
            <Suspense fallback={<PanelFallback />}>
              {tab === "calendar" && <CRMCalendar />}
              {tab === "notes"    && <CRMNotes />}
              {tab === "tasks"    && <CRMTasks />}
            </Suspense>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
