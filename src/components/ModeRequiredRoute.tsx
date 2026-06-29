import { ReactNode, useEffect, useRef } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { useUserModeContext, UserMode } from '@/contexts/UserModeContext';

interface ModeRequiredRouteProps {
  /** Modes allowed to view this route. */
  modes: UserMode[];
  /** Route children. */
  children: ReactNode;
}

const MODE_LABEL: Record<UserMode, string> = {
  investor: 'Investor',
  broker: 'Broker',
  developer: 'Developer',
  owner: 'Owner',
};

/**
 * Auto-aligns the user's selected mode to a mode required by the route.
 *
 * Behaviour:
 * - If the user's current mode is already in `modes`, render children unchanged.
 * - If the user hasn't picked a mode yet (forced picker still up), render
 *   children — the picker overlay handles the gate.
 * - Otherwise, switch the user's mode to the first allowed mode (one-shot),
 *   show a toast, and keep rendering the page so it re-skins in place.
 *
 * No redirect — we keep the user on the page they asked for, in the right mode.
 */
const ModeRequiredRoute = ({ modes, children }: ModeRequiredRouteProps) => {
  const { mode, hasMadeInitialSelection, setMode } = useUserModeContext();
  const didSwitchRef = useRef(false);
  const location = useLocation();
  const previewQuery = new URLSearchParams(location.search).get('preview');
  const isExplicitOwnerPreview = mode === 'owner' && previewQuery === '1';

  const matches = modes.includes(mode) || isExplicitOwnerPreview;
  const target = modes[0];

  if (hasMadeInitialSelection && mode === 'owner' && !modes.includes('owner') && !isExplicitOwnerPreview) {
    return <Navigate to="/owner" replace state={{ from: location }} />;
  }

  useEffect(() => {
    if (matches) return;
    if (!hasMadeInitialSelection) return;
    if (didSwitchRef.current) return;
    didSwitchRef.current = true;
    void setMode(target);
    toast.success(`Switched to ${MODE_LABEL[target]} mode for this page`, {
      description: 'You can change your mode anytime from the account menu.',
      duration: 4500,
    });
  }, [matches, hasMadeInitialSelection, setMode, target]);

  return <>{children}</>;
};

export default ModeRequiredRoute;
