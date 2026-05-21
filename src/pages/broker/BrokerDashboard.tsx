import { Link } from "react-router-dom";
import { useBrokerScopedDatabases } from "@/hooks/useBrokerScopedDatabases";
import { useBrokerScopedLeads } from "@/hooks/useBrokerScopedLeads";
import { useBrokerPersonalTasks } from "@/hooks/useBrokerPersonalTasks";
import { useBrokerPersonalNotes } from "@/hooks/useBrokerPersonalNotes";
import { useBrokerPersonalCalendar } from "@/hooks/useBrokerPersonalCalendar";
import { Database, Users, ListTodo, StickyNote, Calendar, ArrowRight } from "lucide-react";

function Stat({ icon: Icon, label, value, to }: any) {
  return (
    <Link to={to} className="block p-5 rounded-xl bg-[#F7F2EA] border border-[#B89555]/20 hover:border-[#B89555]/50 transition">
      <div className="flex items-center justify-between">
        <Icon className="h-5 w-5 text-[#1A1A1A]/60" />
        <ArrowRight className="h-4 w-4 text-[#1A1A1A]/40" />
      </div>
      <div className="mt-3 text-3xl font-semibold tabular-nums">{value}</div>
      <div className="text-xs text-[#1A1A1A]/70 mt-1">{label}</div>
    </Link>
  );
}

export default function BrokerDashboard() {
  const dbs = useBrokerScopedDatabases();
  const leads = useBrokerScopedLeads();
  const tasks = useBrokerPersonalTasks();
  const notes = useBrokerPersonalNotes();
  const cal = useBrokerPersonalCalendar({ from: new Date().toISOString() });

  const openTasks = (tasks.data ?? []).filter((t) => t.status !== "done").length;

  return (
    <div>
      <header className="mb-6">
        <div className="text-[11px] uppercase tracking-[0.18em] text-[#1A1A1A]/60">Welcome back</div>
        <h1 className="text-3xl font-semibold mt-1">Your broker workspace</h1>
        <p className="text-sm text-[#1A1A1A]/70 mt-1">
          A live snapshot of your assigned data, calendar and follow-ups.
        </p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Stat icon={Database}   label="Assigned databases" value={dbs.data?.length ?? 0}   to="/broker/crm/databases" />
        <Stat icon={Users}      label="Leads in scope"     value={leads.data?.length ?? 0} to="/broker/crm/leads" />
        <Stat icon={ListTodo}   label="Open tasks"         value={openTasks}                to="/broker/crm/tasks" />
        <Stat icon={StickyNote} label="Notes"              value={notes.data?.length ?? 0}  to="/broker/crm/notes" />
        <Stat icon={Calendar}   label="Upcoming events"    value={cal.data?.length ?? 0}    to="/broker/crm/calendar" />
      </div>

      <section className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl bg-[#F7F2EA] border border-[#B89555]/20 p-5">
          <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Database className="h-4 w-4" /> My databases
          </h2>
          {dbs.data?.length ? (
            <ul className="space-y-2">
              {dbs.data.slice(0, 5).map((d) => (
                <li key={d.grant_id}>
                  <Link to={`/broker/crm/database/${d.database_id}`} className="flex items-center justify-between text-sm py-1.5 hover:text-[#B89555]">
                    <span className="truncate">{d.database_name}</span>
                    <span className="text-[10px] uppercase tracking-wider text-[#1A1A1A]/60">{d.permission_level}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-[#1A1A1A]/60">No databases shared with you yet.</p>
          )}
        </div>

        <div className="rounded-xl bg-[#F7F2EA] border border-[#B89555]/20 p-5">
          <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <ListTodo className="h-4 w-4" /> Recent tasks
          </h2>
          {tasks.data?.length ? (
            <ul className="space-y-2">
              {tasks.data.slice(0, 5).map((t) => (
                <li key={t.id} className="flex items-center justify-between text-sm py-1.5">
                  <span className="truncate">{t.title}</span>
                  <span className="text-[10px] uppercase tracking-wider text-[#1A1A1A]/60">{t.status}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-[#1A1A1A]/60">
              No tasks yet. <Link to="/broker/crm/tasks" className="underline">Create your first task →</Link>
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
