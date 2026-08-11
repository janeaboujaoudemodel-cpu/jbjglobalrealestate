import { usePageScope } from "@/hooks/usePageScope";

/**
 * PageScope — declarative wrapper around `usePageScope`.
 *
 * Render it anywhere inside a page's JSX to publish that page's scope token on
 * `<body data-page-scope="…">`. Renders nothing.
 *
 * This replaces document-subject `:has()` scope detection in `index.css`.
 * See `usePageScope` for the performance rationale.
 */
export default function PageScope({ token }: { token: string }) {
  usePageScope(token);
  return null;
}
