import { Navigate } from "react-router-dom";

/**
 * /register/developer is the unified entry point for developer onboarding.
 * It delegates to the existing developer-hub company registration flow,
 * which already handles full validation, document upload, and admin review.
 */
export default function RegisterDeveloper() {
  return <Navigate to="/developer-hub/company-registration" replace />;
}
