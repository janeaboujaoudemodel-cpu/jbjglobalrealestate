import { ReactNode } from "react";
import { usePodcastVisibility } from "@/contexts/PodcastVisibilityContext";

interface PodcastVisibilityGateProps {
  children: ReactNode;
}

/**
 * PodcastVisibilityGate - Conditionally renders the JBJ Podcast section based
 * on the admin-controlled visibility setting in `site_settings.podcast_visibility`.
 *
 * The owner no longer has a bypass — the section is hidden for everyone
 * (including the owner's own homepage feed) until the toggle is flipped on
 * in Admin → Podcast Visibility or Owner → Founder Settings.
 */
export const PodcastVisibilityGate = ({ children }: PodcastVisibilityGateProps) => {
  const { isPodcastVisible, isLoading } = usePodcastVisibility();

  if (isLoading) return null;
  if (!isPodcastVisible) return null;

  return <>{children}</>;
};

export default PodcastVisibilityGate;
