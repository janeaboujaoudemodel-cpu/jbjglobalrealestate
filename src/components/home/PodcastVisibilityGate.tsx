import { ReactNode } from "react";
import { usePodcastVisibility } from "@/contexts/PodcastVisibilityContext";
import { useAuth } from "@/contexts/AuthContext";

interface PodcastVisibilityGateProps {
  children: ReactNode;
}

/**
 * PodcastVisibilityGate - Conditionally renders podcast section based on visibility setting.
 * 
 * Logic:
 * - Owner: Always sees the podcast section (for testing)
 * - Visitors: Only see it when isPodcastVisible is true
 */
export const PodcastVisibilityGate = ({ children }: PodcastVisibilityGateProps) => {
  const { isPodcastVisible, isLoading: isVisibilityLoading } = usePodcastVisibility();
  const { isOwner, loading: isAuthLoading } = useAuth();

  // Owner ALWAYS sees the podcast section - check first, before loading states
  if (isOwner) {
    return <>{children}</>;
  }

  // For non-owners, wait for both auth AND visibility to resolve
  if (isAuthLoading || isVisibilityLoading) {
    return null;
  }

  // Non-owner: only show if visibility is enabled
  if (!isPodcastVisible) {
    return null;
  }

  return <>{children}</>;
};

export default PodcastVisibilityGate;
