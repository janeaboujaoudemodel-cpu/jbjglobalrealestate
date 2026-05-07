// Excel-style grid for the Brokerage / Developer sections.
// Sticky header, configurable freeze columns, champagne-themed status dropdowns,
// optional multi-select + bulk delete, drag-reorder, undo stack, and inline
// expandable rows (used by the brokerage grid for the inline Contract section
// under the Registration row).

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { statusColor, STATUS_OPTIONS } from "@/utils/crmStatusPalette";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronDown, ChevronRight, GripVertical, Pin, PinOff, Trash2, Undo2 } from "lucide-react";

const PAGE_SIZE = 100;

export interface ExcelGridColumn<R> {
  key: keyof R | string;
  label: string;
  width?: number;
  align?: "left" | "right" | "center";
  status?: boolean;
  editable?: boolean;
  readOnly?: boolean;
  render?: (row: R) => React.ReactNode;
  statusOptions?: { value: string; label: string }[];
  onStatusChange?: (row: R, next: string) => void;
  getStatus?: (row: R) => string | undefined;
}

interface UndoEntry<R> {
  rowId: string;
  key: string;
  prev: any;
  next: any;
  apply: (row: R, key: string, prevValue: any) => void;
  // human label for toast/title
  label: string;
}

interface Props<R extends { id: string }> {
  rows: R[];
  columns: ExcelGridColumn<R>[];
  getStatus?: (row: R) => string | undefined;
  onStatusChange?: (row: R, next: string) => void;
  onCellEdit?: (row: R, key: string, value: string) => void;
  emptyLabel?: string;
  // ── New (all opt-in) ──────────────────────────────────────────────
  /** Show a checkbox column + bulk-action toolbar. */
  enableSelection?: boolean;
  /** Called when user confirms bulk delete on selected ids. */
  onBulkDelete?: (ids: string[]) => void | Promise<void>;
  /** Allow drag-to-reorder rows; receives the new ordered list. */
  enableReorder?: boolean;
  onReorder?: (rows: R[]) => void;
  /** Initial number of frozen (sticky) leading columns. User can bump it. */
  defaultFreezeColumns?: number;
  /** Render an inline expandable section under a row. */
  expandable?: {
    isExpandable?: (row: R) => boolean;
    render: (row: R) => React.ReactNode;
  };
}

export function ExcelGridView<R extends { id: string }>({
  rows,
  columns,
  getStatus,
  onStatusChange,
  onCellEdit,
  emptyLabel = "No rows match the current filters.",
  enableSelection = false,
  onBulkDelete,
  enableReorder = false,
  onReorder,
  defaultFreezeColumns = 1,
  expandable,
}: Props<R>) {
  const [editing, setEditing] = useState<{ id: string; key: string } | null>(null);
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [freeze, setFreeze] = useState<number>(Math.max(1, defaultFreezeColumns));
  const [orderedRows, setOrderedRows] = useState<R[] | null>(null);
  const [undoStack, setUndoStack] = useState<UndoEntry<R>[]>([]);
  const dragId = useRef<string | null>(null);

  // Reset internal local order when input rows change identity/length.
  useEffect(() => { setOrderedRows(null); }, [rows]);

  const effectiveRows = orderedRows ?? rows;
  const totalPages = Math.max(1, Math.ceil(effectiveRows.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const pagedRows = useMemo(
    () => effectiveRows.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE),
    [effectiveRows, safePage],
  );

  const allSelectedOnPage = pagedRows.length > 0 && pagedRows.every((r) => selected.has(r.id));
  const togglePageSelection = () => {
    setSelected((prev) => {
      const n = new Set(prev);
      if (allSelectedOnPage) pagedRows.forEach((r) => n.delete(r.id));
      else pagedRows.forEach((r) => n.add(r.id));
      return n;
    });
  };
  const toggleRow = (id: string) =>
    setSelected((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  const pushUndo = useCallback((entry: UndoEntry<R>) => {
    setUndoStack((s) => [...s.slice(-49), entry]);
  }, []);

  const undo = useCallback(() => {
    setUndoStack((s) => {
      if (s.length === 0) return s;
      const last = s[s.length - 1];
      const row = effectiveRows.find((r) => r.id === last.rowId);
      if (row) last.apply(row, last.key, last.prev);
      return s.slice(0, -1);
    });
  }, [effectiveRows]);

  // Keyboard: Cmd/Ctrl-Z for undo.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z" && !e.shiftKey) {
        if (undoStack.length > 0) { e.preventDefault(); undo(); }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo, undoStack.length]);

  const handleBulkDelete = async () => {
    if (!onBulkDelete || selected.size === 0) return;
    if (!confirm(`Delete ${selected.size} selected row${selected.size === 1 ? "" : "s"}? This cannot be undone.`)) return;
    await onBulkDelete(Array.from(selected));
    setSelected(new Set());
  };

  const handleReorderDrop = (targetId: string) => {
    if (!enableReorder || !dragId.current || dragId.current === targetId) return;
    const list = [...effectiveRows];
    const fromIdx = list.findIndex((r) => r.id === dragId.current);
    const toIdx = list.findIndex((r) => r.id === targetId);
    if (fromIdx < 0 || toIdx < 0) return;
    const [m] = list.splice(fromIdx, 1);
    list.splice(toIdx, 0, m);
    setOrderedRows(list);
    onReorder?.(list);
    dragId.current = null;
  };

  // Column freeze: clamp to columns.length-1 so at least one stays scrollable.
  const maxFreeze = Math.max(1, columns.length - 1);
  const freezeCount = Math.min(freeze, maxFreeze);
  // Compute left offset (px) per frozen column for stacking sticky cells.
  const leadingOffset = (selectionWidth: number, dragWidth: number) => {
    const offsets: number[] = [];
    let x = (enableSelection ? selectionWidth : 0) + (enableReorder ? dragWidth : 0);
    for (let i = 0; i < columns.length; i++) {
      offsets.push(x);
      x += columns[i].width ?? 150;
    }
    return offsets;
  };
  const colOffsets = leadingOffset(40, 28);

  return (
    <div className="border border-[#B89555]/40 rounded-xl overflow-hidden bg-[#FDFBF7]">
      {(enableSelection || enableReorder || undoStack.length > 0 || maxFreeze > 1) && (
        <div className="flex flex-wrap items-center gap-2 px-3 py-2 border-b border-[#B89555]/30 bg-[#F7F2EA] text-[11px] text-[#1A1A1A]">
          {enableSelection && (
            <span className="font-medium">
              {selected.size > 0 ? `${selected.size} selected` : "Select rows with the checkbox"}
            </span>
          )}
          {enableSelection && onBulkDelete && (
            <button
              type="button"
              onClick={handleBulkDelete}
              disabled={selected.size === 0}
              className="inline-flex items-center gap-1 px-2 py-1 rounded border border-[#B89555]/40 bg-white disabled:opacity-40 hover:bg-[#EFE6D6]"
            >
              <Trash2 className="w-3 h-3" /> Delete selected
            </button>
          )}
          {maxFreeze > 1 && (
            <span className="inline-flex items-center gap-1 ml-auto">
              <button
                type="button"
                onClick={() => setFreeze((f) => Math.max(1, f - 1))}
                className="inline-flex items-center gap-1 px-2 py-1 rounded border border-[#B89555]/40 bg-white hover:bg-[#EFE6D6]"
                title="Unfreeze last column"
              >
                <PinOff className="w-3 h-3" />
              </button>
              <span>Freeze: <b>{freezeCount}</b></span>
              <button
                type="button"
                onClick={() => setFreeze((f) => Math.min(maxFreeze, f + 1))}
                className="inline-flex items-center gap-1 px-2 py-1 rounded border border-[#B89555]/40 bg-white hover:bg-[#EFE6D6]"
                title="Freeze one more leading column"
              >
                <Pin className="w-3 h-3" />
              </button>
            </span>
          )}
          <button
            type="button"
            onClick={undo}
            disabled={undoStack.length === 0}
            className="inline-flex items-center gap-1 px-2 py-1 rounded border border-[#B89555]/40 bg-white disabled:opacity-40 hover:bg-[#EFE6D6]"
            title="Undo last cell change (⌘Z / Ctrl+Z)"
          >
            <Undo2 className="w-3 h-3" /> Undo {undoStack.length > 0 ? `(${undoStack.length})` : ""}
          </button>
        </div>
      )}

      <div className="overflow-auto max-h-[640px]">
        <table className="w-full text-sm border-collapse" style={{ fontFamily: "Inter, sans-serif" }}>
          <thead className="sticky top-0 z-20">
            <tr>
              {enableReorder && (
                <th
                  className="bg-[#EFE6D6] text-[#1A1A1A] font-semibold px-2 py-2 border-b-2 border-[#B89555] sticky left-0 z-30"
                  style={{ width: 28, minWidth: 28 }}
                />
              )}
              {enableSelection && (
                <th
                  className="bg-[#EFE6D6] text-[#1A1A1A] font-semibold px-2 py-2 border-b-2 border-[#B89555] sticky z-30"
                  style={{ width: 40, minWidth: 40, left: enableReorder ? 28 : 0 }}
                >
                  <input
                    type="checkbox"
                    checked={allSelectedOnPage}
                    onChange={togglePageSelection}
                    aria-label="Select all rows on this page"
                  />
                </th>
              )}
              {columns.map((c, i) => {
                const w = c.width ?? 150;
                const frozen = i < freezeCount;
                return (
                  <th
                    key={String(c.key)}
                    className={`bg-[#EFE6D6] text-[#1A1A1A] font-semibold text-left px-3 py-2 border-b-2 border-[#B89555] align-middle ${
                      frozen ? "sticky z-30 bg-[#EFE6D6]" : ""
                    }`}
                    style={{
                      width: w, minWidth: w, maxWidth: w,
                      textAlign: c.align ?? "left",
                      ...(frozen ? { left: colOffsets[i] } : {}),
                    }}
                    title={c.label}
                  >
                    <span className="block leading-tight whitespace-normal break-words">{c.label}</span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {effectiveRows.length === 0 && (
              <tr>
                <td
                  colSpan={columns.length + (enableSelection ? 1 : 0) + (enableReorder ? 1 : 0)}
                  className="text-center py-8 text-[#1A1A1A]/60"
                >
                  {emptyLabel}
                </td>
              </tr>
            )}
            {pagedRows.map((row, idx) => {
              const banded = idx % 2 === 1;
              const rowBg = banded ? "bg-[#FAF6EE]" : "bg-white";
              const isExpanded = expanded.has(row.id);
              const canExpand = expandable && (expandable.isExpandable ? expandable.isExpandable(row) : true);
              return (
                <>
                  <tr
                    key={row.id}
                    className={rowBg}
                    onDragOver={(e) => { if (enableReorder) e.preventDefault(); }}
                    onDrop={() => handleReorderDrop(row.id)}
                  >
                    {enableReorder && (
                      <td
                        className={`px-1 py-2 border-b border-[#E5DCC8] sticky left-0 z-10 ${rowBg}`}
                        style={{ width: 28, minWidth: 28 }}
                      >
                        <span
                          draggable
                          onDragStart={() => { dragId.current = row.id; }}
                          className="cursor-grab active:cursor-grabbing inline-flex"
                          title="Drag to reorder"
                        >
                          <GripVertical className="w-3.5 h-3.5 text-[#1A1A1A]/50" />
                        </span>
                      </td>
                    )}
                    {enableSelection && (
                      <td
                        className={`px-2 py-2 border-b border-[#E5DCC8] sticky z-10 ${rowBg}`}
                        style={{ width: 40, minWidth: 40, left: enableReorder ? 28 : 0 }}
                      >
                        <input
                          type="checkbox"
                          checked={selected.has(row.id)}
                          onChange={() => toggleRow(row.id)}
                          aria-label={`Select row ${row.id}`}
                        />
                      </td>
                    )}
                    {columns.map((c, i) => {
                      const raw = (row as any)[c.key];
                      const isFirst = i === 0;
                      const frozen = i < freezeCount;
                      const baseCls = `px-3 py-2 border-b border-[#E5DCC8] align-middle ${
                        frozen ? `sticky z-10 ${rowBg} ${isFirst ? "font-medium" : ""}` : ""
                      }`;
                      const cellWidth = c.width ?? 150;
                      const stickyStyle = frozen ? { left: colOffsets[i] } : {};

                      if (c.status) {
                        let current: string | undefined;
                        if (c.getStatus) current = c.getStatus(row);
                        else if (typeof raw === "boolean") current = raw ? "yes" : "no";
                        else current = getStatus ? getStatus(row) : String(raw ?? "");
                        const sc = statusColor(current);
                        const opts = c.statusOptions ?? STATUS_OPTIONS;
                        return (
                          <td
                            key={String(c.key)}
                            className={baseCls}
                            style={{ width: cellWidth, minWidth: cellWidth, maxWidth: cellWidth, textAlign: "center", ...stickyStyle }}
                          >
                            <div className="flex items-center gap-1 justify-center">
                              {isFirst && canExpand && (
                                <button
                                  type="button"
                                  onClick={() => setExpanded((s) => { const n = new Set(s); n.has(row.id) ? n.delete(row.id) : n.add(row.id); return n; })}
                                  className="p-0.5 rounded hover:bg-[#EFE6D6]"
                                  aria-label={isExpanded ? "Collapse" : "Expand"}
                                >
                                  {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                                </button>
                              )}
                              <Select
                                value={current || opts[0]?.value || ""}
                                onValueChange={(v) => {
                                  const prev = current;
                                  pushUndo({
                                    rowId: row.id,
                                    key: String(c.key),
                                    prev,
                                    next: v,
                                    label: `${c.label} → ${v}`,
                                    apply: (r, key, prevValue) => {
                                      if (c.onStatusChange) c.onStatusChange(r, prevValue ?? "");
                                      else onStatusChange?.(r, prevValue ?? "");
                                    },
                                  });
                                  if (c.onStatusChange) c.onStatusChange(row, v);
                                  else onStatusChange?.(row, v);
                                }}
                              >
                                <SelectTrigger
                                  className="h-8 w-full px-2 rounded font-semibold text-xs border-0 outline-none cursor-pointer"
                                  style={{ background: sc.cssBg, color: sc.cssFg }}
                                >
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-white border border-[#B89555]/40">
                                  {opts.map((s) => (
                                    <SelectItem key={s.value} value={s.value} className="text-[#1A1A1A]">{s.label}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </td>
                        );
                      }

                      const isEditing = editing?.id === row.id && editing?.key === c.key;
                      const display = c.render ? c.render(row) : (raw ?? "");
                      const titleText = typeof display === "string" || typeof display === "number" ? String(display) : String(raw ?? "");
                      const editable = c.editable && !c.readOnly;
                      return (
                        <td
                          key={String(c.key)}
                          className={baseCls}
                          style={{ width: cellWidth, minWidth: cellWidth, maxWidth: cellWidth, textAlign: c.align ?? "left", ...stickyStyle }}
                          title={titleText}
                          onDoubleClick={() => editable && setEditing({ id: row.id, key: String(c.key) })}
                        >
                          <div className="flex items-center gap-1">
                            {isFirst && canExpand && !c.status && (
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setExpanded((s) => { const n = new Set(s); n.has(row.id) ? n.delete(row.id) : n.add(row.id); return n; }); }}
                                className="p-0.5 rounded hover:bg-[#EFE6D6] shrink-0"
                                aria-label={isExpanded ? "Collapse" : "Expand"}
                              >
                                {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                              </button>
                            )}
                            {isEditing ? (
                              <input
                                autoFocus
                                defaultValue={String(raw ?? "")}
                                onBlur={(e) => {
                                  const next = e.target.value;
                                  const prev = raw ?? "";
                                  if (String(prev) !== String(next)) {
                                    pushUndo({
                                      rowId: row.id,
                                      key: String(c.key),
                                      prev,
                                      next,
                                      label: `${c.label}`,
                                      apply: (r, key, prevValue) => onCellEdit?.(r, key, String(prevValue ?? "")),
                                    });
                                    onCellEdit?.(row, String(c.key), next);
                                  }
                                  setEditing(null);
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                                  if (e.key === "Escape") setEditing(null);
                                }}
                                className="w-full px-2 py-1 border border-[#B89555] rounded text-sm bg-white text-[#1A1A1A]"
                              />
                            ) : (
                              <span className="text-[#1A1A1A] block leading-snug whitespace-normal break-words flex-1">{display as any}</span>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                  {isExpanded && expandable && (
                    <tr key={`${row.id}__exp`} className="bg-[#FDFBF7]">
                      <td
                        colSpan={columns.length + (enableSelection ? 1 : 0) + (enableReorder ? 1 : 0)}
                        className="border-b border-[#B89555]/30 px-4 py-3"
                      >
                        {expandable.render(row)}
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between gap-3 px-3 py-2 text-[11px] text-[#1A1A1A]/70 border-t border-[#B89555]/20 bg-[#F7F2EA]">
        <span>
          Showing {effectiveRows.length === 0 ? 0 : safePage * PAGE_SIZE + 1}–
          {Math.min(effectiveRows.length, safePage * PAGE_SIZE + PAGE_SIZE)} of {effectiveRows.length.toLocaleString()} ·
          double-click any editable cell · ⌘Z to undo · status colors export to Excel.
        </span>
        {totalPages > 1 && (
          <span className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={safePage === 0}
              className="px-2 py-1 rounded border border-[#B89555]/40 bg-white disabled:opacity-40"
            >
              ← Prev
            </button>
            <span>Page {safePage + 1} / {totalPages}</span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={safePage >= totalPages - 1}
              className="px-2 py-1 rounded border border-[#B89555]/40 bg-white disabled:opacity-40"
            >
              Next →
            </button>
          </span>
        )}
      </div>
    </div>
  );
}
