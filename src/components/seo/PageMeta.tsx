import { useEffect } from "react";

interface Props {
  title: string;
  description?: string;
}

/**
 * Lightweight page metadata setter — avoids the react-helmet dependency.
 * Sets document.title and meta[name="description"] for the current route.
 */
export function PageMeta({ title, description }: Props) {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = title;

    let metaEl: HTMLMetaElement | null = null;
    let prevDesc: string | null = null;
    if (description) {
      metaEl = document.querySelector('meta[name="description"]');
      if (!metaEl) {
        metaEl = document.createElement("meta");
        metaEl.setAttribute("name", "description");
        document.head.appendChild(metaEl);
      }
      prevDesc = metaEl.getAttribute("content");
      metaEl.setAttribute("content", description);
    }

    return () => {
      document.title = prevTitle;
      if (metaEl && prevDesc !== null) metaEl.setAttribute("content", prevDesc);
    };
  }, [title, description]);

  return null;
}
