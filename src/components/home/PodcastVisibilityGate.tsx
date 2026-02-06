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
  const { user, isOwner } = useAuth();

  // While checking visibility, don't render
  if (isVisibilityLoading) {
    return null;
  }

  // Owner always sees the podcast section for testing
  if (isOwner) {
    return <>{children}</>;
  }

  // Non-owner: only show if visibility is enabled
  if (!isPodcastVisible) {
    return null;
  }

  return <>{children}</>;
};

export default PodcastVisibilityGate;
