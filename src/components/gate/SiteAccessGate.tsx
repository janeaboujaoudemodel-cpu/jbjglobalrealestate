import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

// Paths that unauthenticated visitors are allowed to see.
const PUBLIC_PATH_PREFIXES = [
  "/access",
  "/signup",
  "/welcome",
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

  const publicPath = isPublicPath(location.pathname);
  if (publicPath) return <>{children}</>;
  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-[#FDFBF7]">
        <div className="w-10 h-10 rounded-full border-2 border-[#B89555]/30 border-t-[#064E3B] animate-spin" />
      </div>
    );
  }
  if (user) return <>{children}</>;

  return <Navigate to="/access" replace state={{ from: location.pathname + location.search }} />;
}

