import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

function getRouteString(loc: { pathname: string; search: string; hash: string }) {
  return `${loc.pathname}${loc.search}${loc.hash}`;
}

export default function BackNavButton() {
  const location = useLocation();
  const navigate = useNavigate();
  const [stack, setStack] = useState<string[]>(() => {
    try {
      const raw = sessionStorage.getItem("nav-stack");
      const parsed = raw ? (JSON.parse(raw) as unknown) : [];
      return Array.isArray(parsed) ? (parsed.filter((v) => typeof v === "string") as string[]) : [];
    } catch {
      return [];
    }
  });

  const current = useMemo(
    () => getRouteString({ pathname: location.pathname, search: location.search, hash: location.hash }),
    [location.pathname, location.search, location.hash]
  );

  useEffect(() => {
    setStack((prev) => {
      const next = prev.length && prev[prev.length - 1] === current ? prev : [...prev, current];
      const trimmed = next.slice(-20);
      try {
        sessionStorage.setItem("nav-stack", JSON.stringify(trimmed));
      } catch {
        // ignore
      }
      return trimmed;
    });
  }, [current]);

  const previous = stack.length >= 2 ? stack[stack.length - 2] : null;
  if (!previous || previous === current) return null;

  return (
    <div className="fixed bottom-6 left-6 z-50">
      <Button
        type="button"
        variant="outline"
        onClick={() => navigate(previous)}
        className="backdrop-blur-sm"
        aria-label="Go back"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Button>
    </div>
  );
}
