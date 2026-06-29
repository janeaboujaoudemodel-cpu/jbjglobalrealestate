import { useState } from "react";
import {
  useBrokerPersonalNotes, useCreateBrokerNote,
  useUpdateBrokerNote, useDeleteBrokerNote,
} from "@/hooks/useBrokerPersonalNotes";
import { Pin, Trash2, Plus, Save } from "lucide-react";
import { formatDisplayDate } from "@/utils/formatDate";

export default function BrokerNotes() {
  const notes = useBrokerPersonalNotes();
  const create = useCreateBrokerNote();
  const update = useUpdateBrokerNote();
  const del = useDeleteBrokerNote();

  const [draft, setDraft] = useState({ title: "", body: "" });
  const [editing, setEditing] = useState<Record<string, { title: string; body: string }>>({});

  const submit = async () => {
    if (!draft.body.trim()) return;
    await create.mutateAsync({ title: draft.title || null, body: draft.body });
    setDraft({ title: "", body: "" });
  };

  return (
    <div>
      <header className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Notes</h1>
          <p className="text-sm text-[#1A1A1A]/70 mt-1">
            Private to you. The owner can see all notes for oversight; nobody else can.
          </p>
        </div>
      </header>

      {/* Composer */}
      <div className="rounded-xl bg-[#F7F2EA] border border-[#B89555]/20 p-4 mb-6">
        <input
          value={draft.title}
          onChange={(e) => setDraft({ ...draft, title: e.target.value })}
          placeholder="Title (optional)"
          className="w-full bg-transparent text-sm font-medium border-b border-[#B89555]/15 pb-2 mb-2 focus:outline-none focus:border-[#B89555]/60"
        />
        <textarea
          value={draft.body}
          onChange={(e) => setDraft({ ...draft, body: e.target.value })}
          placeholder="Write a note…"
          rows={3}
          className="w-full bg-transparent text-sm resize-none focus:outline-none"
        />
        <div className="flex justify-end mt-2">
          <button
            onClick={submit}
            disabled={!draft.body.trim() || create.isPending}
            className="jj-pill-emerald-metallic inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs disabled:opacity-40"
          >
            <Plus className="h-3.5 w-3.5" /> Add note
          </button>
        </div>
      </div>

      {/* List */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {notes.data?.length === 0 && (
          <div className="col-span-full text-center text-sm text-[#1A1A1A]/60 p-12 bg-[#F7F2EA] border border-[#B89555]/20 rounded-xl">
            No notes yet.
          </div>
        )}
        {notes.data?.map((n) => {
          const e = editing[n.id];
          return (
            <article
              key={n.id}
              className={`rounded-xl border p-4 flex flex-col ${
                n.pinned ? "bg-[#EFE6D6] border-[#B89555]/50" : "bg-[#F7F2EA] border-[#B89555]/20"
              }`}
            >
              {e ? (
                <>
                  <input
                    value={e.title}
                    onChange={(ev) => setEditing({ ...editing, [n.id]: { ...e, title: ev.target.value } })}
                    className="bg-transparent text-sm font-medium border-b border-[#B89555]/20 pb-1 mb-2 focus:outline-none"
                  />
                  <textarea
                    value={e.body}
                    onChange={(ev) => setEditing({ ...editing, [n.id]: { ...e, body: ev.target.value } })}
                    rows={4}
                    className="bg-transparent text-sm flex-1 focus:outline-none resize-none"
                  />
                </>
              ) : (
                <>
                  {n.title && <h3 className="text-sm font-medium mb-1">{n.title}</h3>}
                  <p className="text-sm whitespace-pre-wrap flex-1">{n.body}</p>
                </>
              )}
              <div className="flex items-center justify-between mt-3 pt-2 border-t border-[#B89555]/15">
                <span className="text-[10px] uppercase tracking-wider text-[#1A1A1A]/55">
                  {formatDisplayDate(n.updated_at)}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    title={n.pinned ? "Unpin" : "Pin"}
                    onClick={() => update.mutate({ id: n.id, pinned: !n.pinned })}
                    className="p-1.5 rounded hover:bg-[#B89555]/10"
                  >
                    <Pin className={`h-3.5 w-3.5 ${n.pinned ? "text-[#B89555]" : "text-[#1A1A1A]/60"}`} />
                  </button>
                  {e ? (
                    <button
                      title="Save"
                      onClick={async () => {
                        await update.mutateAsync({ id: n.id, title: e.title || null, body: e.body });
                        setEditing(({ [n.id]: _, ...rest }) => rest);
                      }}
                      className="p-1.5 rounded hover:bg-[#B89555]/10"
                    >
                      <Save className="h-3.5 w-3.5" />
                    </button>
                  ) : (
                    <button
                      title="Edit"
                      onClick={() => setEditing({ ...editing, [n.id]: { title: n.title ?? "", body: n.body } })}
                      className="text-[11px] px-2 py-1 rounded hover:bg-[#B89555]/10"
                    >
                      Edit
                    </button>
                  )}
                  <button
                    title="Delete"
                    onClick={() => { if (confirm("Delete this note?")) del.mutate(n.id); }}
                    className="p-1.5 rounded hover:bg-[#B89555]/10"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-[#1A1A1A]/60" />
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
