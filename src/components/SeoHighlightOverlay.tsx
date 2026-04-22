/**
 * SeoHighlightOverlay
 *
 * When a /services/* page is opened with `?seoHighlight=1`, this overlay reads
 * the live <title> and <meta name="description"> emitted at runtime, compares
 * them to the expected values from the SEO catalog (passed via query params
 * `expectedTitle` / `expectedDescription`), and shows a fixed inspector card.
 *
 * It also draws a soft outline around the first <h1> on the page so the
 * "effective" page title is visually located at a glance.
 *
 * Origin: deep-linked from /owner/seo-review.
 */
import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, X, Eye, EyeOff } from "lucide-react";

const HIGHLIGHT_CLASS = "seo-review-highlight-target";

const ensureHighlightStyles = () => {
  if (document.getElementById("seo-review-highlight-styles")) return;
  const style = document.createElement("style");
  style.id = "seo-review-highlight-styles";
  style.textContent = `
    .${HIGHLIGHT_CLASS} {
      outline: 2px dashed hsl(var(--primary)) !important;
      outline-offset: 4px !important;
      border-radius: 4px !important;
      transition: outline-color 0.2s ease;
    }
  `;
  document.head.appendChild(style);
};

export const SeoHighlightOverlay = () => {
  const { pathname, search } = useLocation();
  const params = useMemo(() => new URLSearchParams(search), [search]);
  const enabled = params.get("seoHighlight") === "1";
  const expectedTitle = params.get("expectedTitle") || "";
  const expectedDescription = params.get("expectedDescription") || "";

  const [liveTitle, setLiveTitle] = useState("");
  const [liveDescription, setLiveDescription] = useState("");
  const [hidden, setHidden] = useState(false);

  // Scope: only run on /services/* pages (catalog targets) when enabled.
  const isService = pathname.startsWith("/services/");

  useEffect(() => {
    if (!enabled || !isService) return;

    ensureHighlightStyles();

    // Read current head metadata and re-read after every DOM mutation so we
    // catch the values that <SEOHead /> actually injects post-render.
    const read = () => {
      setLiveTitle(document.title || "");
      const meta = document.querySelector(
        'meta[name="description"]',
      ) as HTMLMetaElement | null;
      setLiveDescription(meta?.content || "");
    };
    read();

    const headObserver = new MutationObserver(read);
    headObserver.observe(document.head, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["content"],
    });

    // Highlight first H1
    const h1 = document.querySelector("main h1, h1");
    if (h1) h1.classList.add(HIGHLIGHT_CLASS);

    return () => {
      headObserver.disconnect();
      document
        .querySelectorAll(`.${HIGHLIGHT_CLASS}`)
        .forEach((el) => el.classList.remove(HIGHLIGHT_CLASS));
    };
  }, [enabled, isService, pathname]);

  if (!enabled || !isService) return null;

  const titleMatches = expectedTitle
    ? liveTitle.trim() === expectedTitle.trim()
    : null;
  const descMatches = expectedDescription
    ? liveDescription.trim() === expectedDescription.trim()
    : null;

  if (hidden) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setHidden(false)}
        className="fixed bottom-4 right-4 z-[9999] gap-2 shadow-lg bg-background"
      >
        <Eye className="w-4 h-4" />
        SEO Inspector
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-4 right-4 z-[9999] w-[380px] max-w-[calc(100vw-2rem)] p-4 shadow-2xl border-foreground/20 bg-background">
      <div className="flex items-start justify-between mb-3 gap-2">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            SEO Inspector
          </div>
          <div className="text-sm font-medium text-foreground mt-0.5">
            Live vs. expected metadata
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 -mr-1 -mt-1"
          onClick={() => setHidden(true)}
          aria-label="Hide SEO inspector"
        >
          <EyeOff className="w-4 h-4" />
        </Button>
      </div>

      <div className="space-y-3 text-xs">
        <Field
          label="Title"
          live={liveTitle}
          expected={expectedTitle}
          matches={titleMatches}
        />
        <Field
          label="Description"
          live={liveDescription}
          expected={expectedDescription}
          matches={descMatches}
        />
      </div>

      <p className="text-[11px] text-muted-foreground mt-3 pt-3 border-t border-border">
        First H1 on the page is outlined. Open from{" "}
        <code className="text-foreground">/owner/seo-review</code>.
      </p>
    </Card>
  );
};

const Field = ({
  label,
  live,
  expected,
  matches,
}: {
  label: string;
  live: string;
  expected: string;
  matches: boolean | null;
}) => (
  <div>
    <div className="flex items-center justify-between mb-1">
      <span className="font-semibold text-foreground">{label}</span>
      {matches !== null && (
        <Badge
          variant={matches ? "outline" : "destructive"}
          className="gap-1 text-[10px] px-1.5 py-0"
        >
          {matches ? (
            <>
              <Check className="w-3 h-3" /> match
            </>
          ) : (
            <>
              <X className="w-3 h-3" /> mismatch
            </>
          )}
        </Badge>
      )}
    </div>
    <div className="space-y-1">
      <div>
        <span className="text-muted-foreground">Live: </span>
        <span className="text-foreground break-words">{live || <em className="text-muted-foreground">(empty)</em>}</span>
      </div>
      {expected && (
        <div>
          <span className="text-muted-foreground">Expected: </span>
          <span className="text-foreground break-words">{expected}</span>
        </div>
      )}
    </div>
  </div>
);

export default SeoHighlightOverlay;
