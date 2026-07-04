import { defineMcp } from "@lovable.dev/mcp-js";
import echoTool from "./tools/echo";
import searchPropertiesTool from "./tools/search-properties";

export default defineMcp({
  name: "jbj-global-mcp",
  title: "JBJ Global Real Estate",
  version: "0.1.0",
  instructions:
    "MCP tools for JBJ Global Real Estate. Use `search_properties` to query published property listings by keyword, city, or price range. Use `echo` to verify connectivity.",
  tools: [echoTool, searchPropertiesTool],
});
