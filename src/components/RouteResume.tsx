import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";

/**
 * Helps the Lovable preview experience: if the preview refresh drops you back on "/",
 * we automatically resume the Interior Design AI flow when there is saved progress.
 */
export default function RouteResume() {
  const location = useLocation();
  const navigate = useNavigate();
  const hasCheckedRef = useRef(false);

  // Persist last visited route (useful for debugging / future resume flows)
  useEffect(() => {
    try {
      sessionStorage.setItem(
        "last-route",
        `${location.pathname}${location.search}${location.hash}`
      );
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

      const hasProgress =
        (typeof step === "number" && step > 1) ||
        showComparison === false ||
        !!designResult ||
        (typeof selectedPackage === "string" && selectedPackage.length > 0);

      if (hasProgress) {
        navigate("/interior-design-ai", { replace: true });
      }
    } catch {
      // ignore
    }
  }, [location.pathname, navigate]);

  return null;
}
