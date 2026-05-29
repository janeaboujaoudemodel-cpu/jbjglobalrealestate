/**
 * Loads approved owner UI overrides for the current route and injects them
 * as a scoped <style> block. Pending/rejected overlays are loaded only when
 * the WebDev dock asks for them (preview mode).
 *
 * Mount once at app root. Reads from public.owner_ui_overrides.
 */
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

type OverrideRow = {
  id: string;
  route_pattern: string;
  selector: string;
  css: Record<string, string>;
  status: string;
};

function camelToKebab(s: string) {
  return s.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
}

function buildCss(rows: OverrideRow[]) {
  return rows
    .map((r) => {
      const body = Object.entries(r.css ?? {})
        .map(([k, v]) => `  ${camelToKebab(k)}: ${v} !important;`)
        .join("\n");
      return `/* override:${r.id} */\n${r.selector} {\n${body}\n}`;
    })
    .join("\n\n");
}

function matchesRoute(pattern: string, pathname: string) {
  if (pattern === "*" || pattern === pathname) return true;
  // simple prefix wildcard support: "/owner/*"
  if (pattern.endsWith("/*")) return pathname.startsWith(pattern.slice(0, -1));
  return false;
}

export default function OwnerOverrideLoader() {
  const { pathname } = useLocation();
  const [rows, setRows] = useState<OverrideRow[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("owner_ui_overrides")
        .select("id, route_pattern, selector, css, status")
        .in("status", ["approved"]);
      if (cancelled || error || !data) return;
      setRows(data as OverrideRow[]);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    // also listen for preview updates fired by the dock
    const onPreview = (e: Event) => {
      const ce = e as CustomEvent<OverrideRow[]>;
      setRows((prev) => {
        const stillApproved = prev.filter((r) => r.status === "approved");
        return [...stillApproved, ...(ce.detail ?? [])];
      });
    };
    window.addEventListener("jbj:override-preview", onPreview);
    return () => window.removeEventListener("jbj:override-preview", onPreview);
  }, []);

  const active = rows.filter((r) => matchesRoute(r.route_pattern, pathname));
  if (!active.length) return null;
  return (
    <style data-owner-override="1">{buildCss(active)}</style>
  );
}
