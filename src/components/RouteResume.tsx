import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";

/**
 * Helps the preview experience: some refreshes drop you back on "/".
 * We restore the last in-app route, and also resume the Interior Design AI flow when it has saved progress.
 */
export default function RouteResume() {
  const location = useLocation();
  const navigate = useNavigate();
  const hasCheckedRef = useRef(false);
  const initialPathRef = useRef(location.pathname);

  // Persist last visited route.
  // Important: On initial load, if the preview incorrectly lands on "/", don't overwrite the previous route.
  useEffect(() => {
    try {
      const route = `${location.pathname}${location.search}${location.hash}`;
      const existing = sessionStorage.getItem("last-route");

      // Don't overwrite a real deep route with "/" on initial mount
      if (!hasCheckedRef.current && route === "/" && existing && existing !== "/") {
        return;
      }

      // Never save auth-redirect pages as last-route
      if (route.startsWith("/auth") || route === "/403") {
        return;
      }

      sessionStorage.setItem("last-route", route);
    } catch {
      // ignore
    }
  }, [location.pathname, location.search, location.hash]);

  // Run only once per page load
  useEffect(() => {
    if (hasCheckedRef.current) return;
    hasCheckedRef.current = true;

    if (location.pathname !== "/") return;

    try {
      // 1) Interior Design AI resume
      const step = JSON.parse(sessionStorage.getItem("interior-design-step") ?? "1");
      const showComparison = JSON.parse(
        sessionStorage.getItem("interior-design-showComparison") ?? "true"
      );
      const designResult = JSON.parse(
        sessionStorage.getItem("interior-design-designResult") ?? "null"
      );
      const selectedPackage = JSON.parse(
        sessionStorage.getItem("interior-design-selectedPackage") ?? '""'
      );

      const hasInteriorProgress =
        (typeof step === "number" && step > 1) ||
        showComparison === false ||
        !!designResult ||
        (typeof selectedPackage === "string" && selectedPackage.length > 0);

      if (hasInteriorProgress) {
        navigate("/interior-design-ai", { replace: true });
        return;
      }

      // 2) Generic last-route resume
      const lastRoute = sessionStorage.getItem("last-route") || "";
      if (lastRoute && lastRoute !== "/") {
        navigate(lastRoute, { replace: true });
      }
    } catch {
      // ignore
    }
  }, [location.pathname, navigate]);

  return null;
}

