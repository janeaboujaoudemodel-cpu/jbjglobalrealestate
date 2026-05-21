import { useState } from "react";
import {
  useBrokerPersonalTasks, useCreateBrokerTask,
  useUpdateBrokerTask, useDeleteBrokerTask,
  type TaskStatus,
} from "@/hooks/useBrokerPersonalTasks";
import { Plus, Trash2, Calendar as CalIcon } from "lucide-react";

const COLUMNS: { id: TaskStatus; label: string }[] = [
  { id: "todo", label: "To Do" },
  { id: "doing", label: "In Progress" },
  { id: "done", label: "Done" },
];

const PRIORITY_RING: Record<string, string> = {
  low: "border-l-[#1A1A1A]/20",
  normal: "border-l-[#B89555]/50",
  high: "border-l-amber-500",
  urgent: "border-l-red-500",
};

export default function BrokerTasks() {
  const tasks = useBrokerPersonalTasks();
  const create = useCreateBrokerTask();
  const update = useUpdateBrokerTask();
  const del = useDeleteBrokerTask();
  const [draft, setDraft] = useState({ title: "", priority: "normal", due_at: "" });

  const submit = async () => {
    if (!draft.title.trim()) return;
    await create.mutateAsync({
      title: draft.title,
      priority: draft.priority as any,
      due_at: draft.due_at ? new Date(draft.due_at).toISOString() : null,
    });
    setDraft({ title: "", priority: "normal", due_at: "" });
  };

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">Tasks</h1>
        <p className="text-sm text-[#1A1A1A]/70 mt-1">Track your personal follow-ups. Private to you and the owner.</p>
      </header>

      <div className="rounded-xl bg-[#F7F2EA] border border-[#B89555]/20 p-4 mb-6 flex flex-col md:flex-row gap-2">
        <input
          value={draft.title}
          onChange={(e) => setDraft({ ...draft, title: e.target.value })}
          placeholder="New task title…"
          className="flex-1 bg-white/60 border border-[#B89555]/20 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#B89555]/50"
        />
        <select
          value={draft.priority}
          onChange={(e) => setDraft({ ...draft, priority: e.target.value })}
          className="bg-white/60 border border-[#B89555]/20 rounded-md px-3 py-2 text-sm"
        >
          <option value="low">Low</option><option value="normal">Normal</option>
          <option value="high">High</option><option value="urgent">Urgent</option>
        </select>
        <input
          type="date" value={draft.due_at}
          onChange={(e) => setDraft({ ...draft, due_at: e.target.value })}
          className="bg-white/60 border border-[#B89555]/20 rounded-md px-3 py-2 text-sm"
        />
        <button
          onClick={submit} disabled={!draft.title.trim() || create.isPending}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-[#1A1A1A] text-[#F7F2EA] text-sm hover:opacity-90 disabled:opacity-40"
        >
          <Plus className="h-4 w-4" /> Add
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {COLUMNS.map((col) => {
          const items = tasks.data?.filter((t) => t.status === col.id) ?? [];
          return (
            <div key={col.id} className="rounded-xl bg-[#F7F2EA] border border-[#B89555]/20 min-h-[400px]">
              <div className="px-4 py-3 border-b border-[#B89555]/15 flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider font-medium">{col.label}</span>
                <span className="text-[11px] text-[#1A1A1A]/60 tabular-nums">{items.length}</span>
              </div>
              <div className="p-3 space-y-2">
                {items.map((t) => (
                  <div
                    key={t.id}
                    className={`bg-white rounded-md p-3 border border-[#B89555]/15 border-l-4 ${PRIORITY_RING[t.priority]}`}
                  >
                    <div className="text-sm font-medium">{t.title}</div>
                    {t.description && <p className="text-xs text-[#1A1A1A]/70 mt-1">{t.description}</p>}
                    <div className="flex items-center justify-between mt-2">
                      {t.due_at ? (
                        <span className="inline-flex items-center gap-1 text-[10px] text-[#1A1A1A]/60">
                          <CalIcon className="h-3 w-3" />
                          {new Date(t.due_at).toLocaleDateString()}
                        </span>
                      ) : <span />}
                      <div className="flex items-center gap-1">
                        <select
                          value={t.status}
                          onChange={(e) => update.mutate({ id: t.id, status: e.target.value as TaskStatus })}
                          className="text-[10px] bg-transparent border border-[#B89555]/20 rounded px-1.5 py-0.5"
                        >
                          <option value="todo">Todo</option>
                          <option value="doing">Doing</option>
                          <option value="done">Done</option>
                        </select>
                        <button
                          onClick={() => { if (confirm("Delete task?")) del.mutate(t.id); }}
                          className="p-1 rounded hover:bg-[#B89555]/10"
                        >
                          <Trash2 className="h-3 w-3 text-[#1A1A1A]/50" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {items.length === 0 && (
                  <p className="text-xs text-[#1A1A1A]/50 text-center py-6">No tasks here.</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
