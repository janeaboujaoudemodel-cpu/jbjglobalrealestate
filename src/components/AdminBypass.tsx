import { ReactNode } from "react";

interface AdminBypassProps {
  children: ReactNode;
}

/**
 * AdminBypass - Previously gated public access behind Coming Soon.
 * NOW: The public site is fully open. This component simply renders children.
 * Admin route protection (/listing-admin) is handled separately via ListingAdminGuard.
 */
const AdminBypass = ({ children }: AdminBypassProps) => {
  return <>{children}</>;
};

export default AdminBypass;