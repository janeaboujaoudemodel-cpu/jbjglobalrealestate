import { auth, defineMcp } from "@lovable.dev/mcp-js";
import echoTool from "./tools/echo";
import searchPropertiesTool from "./tools/search-properties";

// Build the Supabase Auth issuer from the project ref (baked at build time by
// Vite). Do NOT read from SUPABASE_URL — Lovable Cloud may proxy that host and
// mcp-js verifies the issuer strictly per RFC 8414 §3.3.
const projectRef =
  import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "jbj-global-mcp",
  title: "JBJ Global Real Estate",
  version: "0.1.0",
  instructions:
    "MCP tools for JBJ Global Real Estate. Use `search_properties` to query published property listings by keyword, city, or price range. Use `echo` to verify connectivity.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [echoTool, searchPropertiesTool],
});
