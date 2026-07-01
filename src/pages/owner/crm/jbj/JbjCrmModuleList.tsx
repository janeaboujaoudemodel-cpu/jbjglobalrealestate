import { useEffect, useMemo, useState, useCallback } from "react";
import { ChevronLeft, ChevronRight, RefreshCw, Search, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Row = Record<string, any>;

interface Column {
  key: string;
  label: string;
}

interface Props {
  zohoModule: string;
  title: string;
  columns: Column[];
  primaryKey?: string;
}

export default function JbjCrmModuleList({ zohoModule, title, columns, primaryKey = "id" }: Props) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [more, setMore] = useState(false);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Row | null>(null);
  const perPage = 25;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fnErr } = await supabase.functions.invoke("zoho-crm-proxy", {
        body: { module: zohoModule, page, per_page: perPage },
      });
      if (fnErr) throw fnErr;
      if (data?.error) throw new Error(data.error);
      setRows(Array.isArray(data?.data) ? data.data : []);
      setMore(Boolean(data?.info?.more_records));
    } catch (e: any) {
      setError(e?.message || "Failed to load records");
      setRows([]);
      setMore(false);
    } finally {
      setLoading(false);
    }
  }, [zohoModule, page]);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    if (!query.trim()) return rows;
    const q = query.toLowerCase();
    return rows.filter((r) =>
      columns.some((c) => String(r[c.key] ?? "").toLowerCase().includes(q))
    );
  }, [rows, query, columns]);

  return (
    <section className="jbj-crm-list" aria-label={title}>
      <header className="jbj-crm-list-head">
        <div className="jbj-crm-list-title">
          <h1>{title}</h1>
          <span className="jbj-crm-list-count">{rows.length} records</span>
        </div>
        <div className="jbj-crm-list-tools">
          <div className="jbj-crm-list-search">
            <Search size={14} aria-hidden />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Search ${title.toLowerCase()}`}
            />
          </div>
          <button className="jbj-crm-list-iconbtn" onClick={load} aria-label="Refresh">
            <RefreshCw size={14} />
          </button>
        </div>
      </header>

      <div className="jbj-crm-list-scroll">
        {loading ? (
          <div className="jbj-crm-list-empty">Loading…</div>
        ) : error ? (
          <div className="jbj-crm-list-empty jbj-crm-list-error">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="jbj-crm-list-empty">No records found.</div>
        ) : (
          <table className="jbj-crm-table">
            <thead>
              <tr>
                {columns.map((c) => (
                  <th key={c.key}>{c.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r[primaryKey] ?? Math.random()} onClick={() => setSelected(r)}>
                  {columns.map((c) => (
                    <td key={c.key}>{formatCell(r[c.key])}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <footer className="jbj-crm-list-footer">
        <button
          className="jbj-crm-list-iconbtn"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1 || loading}
          aria-label="Previous page"
        >
          <ChevronLeft size={14} />
        </button>
        <span className="jbj-crm-list-page">Page {page}</span>
        <button
          className="jbj-crm-list-iconbtn"
          onClick={() => setPage((p) => p + 1)}
          disabled={!more || loading}
          aria-label="Next page"
        >
          <ChevronRight size={14} />
        </button>
      </footer>

      {selected && (
        <div className="jbj-crm-drawer-scrim" onClick={() => setSelected(null)}>
          <aside className="jbj-crm-drawer" onClick={(e) => e.stopPropagation()}>
            <header className="jbj-crm-drawer-head">
              <h2>{recordTitle(selected, columns)}</h2>
              <button className="jbj-crm-list-iconbtn" onClick={() => setSelected(null)} aria-label="Close">
                <X size={14} />
              </button>
            </header>
            <div className="jbj-crm-drawer-body">
              {Object.entries(selected)
                .filter(([k]) => !k.startsWith("$") && k !== "id")
                .map(([k, v]) => (
                  <div key={k} className="jbj-crm-drawer-row">
                    <div className="jbj-crm-drawer-k">{humanize(k)}</div>
                    <div className="jbj-crm-drawer-v">{formatCell(v) || "—"}</div>
                  </div>
                ))}
            </div>
          </aside>
        </div>
      )}
    </section>
  );
}

function formatCell(v: any): string {
  if (v == null) return "";
  if (typeof v === "object") {
    if ("name" in v) return String(v.name);
    return JSON.stringify(v);
  }
  return String(v);
}

function humanize(key: string): string {
  return key.replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
}

function recordTitle(r: Row, columns: Column[]): string {
  const first = columns[0]?.key;
  return formatCell(r[first ?? ""]) || "Record";
}
