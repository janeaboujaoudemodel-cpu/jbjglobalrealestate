import { useEffect, useState } from 'react';
import { KeyRound, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { isPasskeySupported, signInWithPasskey } from '@/lib/passkeys';

interface Props {
  onSuccess?: () => void;
  className?: string;
}

export function PasskeyButton({ onSuccess, className }: Props) {
  const [supported, setSupported] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => { setSupported(isPasskeySupported()); }, []);
  if (!supported) return null;

  const handle = async () => {
    setBusy(true);
    try {
      await signInWithPasskey(false);
      toast.success('Signed in with passkey');
      onSuccess?.();
    } catch (e) {
      const msg = (e as Error).message || 'Passkey sign-in failed';
      if (!/NotAllowedError|abort/i.test(msg)) toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handle}
      disabled={busy}
      className={className}
      data-no-contrast-guard
    >
      {busy ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <KeyRound className="w-4 h-4 mr-2" />}
      Continue with Passkey
    </Button>
  );
}

export default PasskeyButton;
