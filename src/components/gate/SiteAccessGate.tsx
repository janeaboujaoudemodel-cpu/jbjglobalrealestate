import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

// Paths that unauthenticated visitors are allowed to see.
const PUBLIC_PATH_PREFIXES = [
  "/access",
  "/auth",
  "/reset-password",
  "/oauth",
  "/legal",
  "/privacy",
  "/terms",
  "/cookies",
  "/aml",
];

function isPublicPath(pathname: string) {
  if (pathname === "/") return false;
  return PUBLIC_PATH_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

export default function SiteAccessGate({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <>{children}</>; // don't flash-redirect during boot
  if (user) return <>{children}</>;
  if (isPublicPath(location.pathname)) return <>{children}</>;

  return <Navigate to="/access" replace state={{ from: location.pathname + location.search }} />;
}
