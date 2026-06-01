/**
 * TeamRouteGate
 * --------------
 * The /team page is hidden by default. The owner can flip it on/off from
 * Owner › Founder Settings (TeamPageVisibilityToggle). When hidden, the
 * route renders the NotFound page so visitors see exactly the same thing
 * as if /team did not exist.
 */
import { Suspense, lazy } from "react";
import { useTeamVisibility } from "@/hooks/useTeamVisibility";

const MeetTheTeam = lazy(() => import("@/pages/MeetTheTeam"));
const NotFound = lazy(() => import("@/pages/NotFound"));

export default function TeamRouteGate() {
  const { isPageVisible, loaded } = useTeamVisibility();

  // Avoid flashing the team page while DB visibility is loading.
  if (!loaded) return null;

  return (
    <Suspense fallback={null}>
      {isPageVisible ? <MeetTheTeam /> : <NotFound />}
    </Suspense>
  );
}
