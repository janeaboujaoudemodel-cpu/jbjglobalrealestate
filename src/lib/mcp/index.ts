import { auth, defineMcp } from "@lovable.dev/mcp-js";
import echoTool from "./tools/echo";
import searchProjectsTool from "./tools/search-projects";
import getProjectTool from "./tools/get-project";
import listDevelopersTool from "./tools/list-developers";

// Build the Supabase Auth issuer from the project ref (baked at build time by
// Vite). Do NOT read from SUPABASE_URL — Lovable Cloud may proxy that host and
// mcp-js verifies the issuer strictly per RFC 8414 §3.3.
const projectRef =
  import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "jbj-global-mcp",
  title: "JBJ Global Real Estate",
  version: "0.2.0",
  instructions:
    "MCP tools for JBJ Global Real Estate — the JBJ Dubai off-plan and ready-property catalogue. " +
    "Use `search_projects` to find PUBLISHED projects by keyword, emirate, price range or bedroom count. " +
    "Use `get_project` to fetch full detail for a single project by URL slug. " +
    "Use `list_developers` to browse the UAE developer directory. " +
    "Use `echo` to verify connectivity. " +
    "All results include a canonical public URL on https://jbj.ae so agents can link users directly to the listing.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [echoTool, searchProjectsTool, getProjectTool, listDevelopersTool],
});

