import { useEffect, useState } from 'react';
import { KeyRound, Loader2, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { isPasskeySupported, signInWithPasskey } from '@/lib/passkeys';

interface Props {
  onSuccess?: () => void;
  className?: string;
}

/**
 * Premium JBJ-branded passkey CTA.
 * - Emerald gradient with a slow continuous champagne sheen.
 * - Renders regardless of platform capability; if the current browser
 *   cannot use WebAuthn, we still surface the button and explain why
 *   on click, so users are never left staring at a missing option.
 */
export function PasskeyButton({ onSuccess, className }: Props) {
  const [supported, setSupported] = useState(false);
  const [hasLocalPasskey, setHasLocalPasskey] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const webauthnOk = isPasskeySupported();
      if (!webauthnOk) return;
      // Must have conditional-mediation capability (modern platform authenticator).
      let conditional = false;
      try {
        conditional =
          typeof PublicKeyCredential !== 'undefined' &&
          typeof (PublicKeyCredential as any).isConditionalMediationAvailable === 'function' &&
          (await (PublicKeyCredential as any).isConditionalMediationAvailable());
      } catch {
        conditional = false;
      }
      // And this device must have previously enrolled a passkey for the app.
      // Accept both legacy '1' and current 'true' values written by Auth.tsx.
      const flag =
        typeof window !== 'undefined'
          ? window.localStorage.getItem('jbj_passkey_enrolled')
          : null;
      const enrolledFlag = flag === '1' || flag === 'true';
      setSupported(webauthnOk && conditional);
      setHasLocalPasskey(enrolledFlag);
    })();
  }, []);

  // Hide entirely if the device has no enrolled passkey / no capability.
  if (!supported || !hasLocalPasskey) return null;

  const handle = async () => {
    if (!supported) {
      toast.error('This browser does not support passkeys. Try Safari, Chrome or Edge on a device with biometrics.');
      return;
    }
    setBusy(true);
    try {
      await signInWithPasskey(false);
      toast.success('Signed in with passkey');
      onSuccess?.();
    } catch (e) {
      const msg = (e as Error).message || 'Passkey sign-in failed';
      // NotAllowedError = user cancelled the OS prompt — stay silent.
      if (!/NotAllowedError|abort|cancel/i.test(msg)) toast.error(msg, {
        description: /No passkeys/i.test(msg) ? 'Sign in with email once; your device will be asked to create the passkey before the next sign-in.' : undefined,
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handle}
      disabled={busy}
      data-no-contrast-guard
      data-allow-dark-cta
      data-surface="emerald"
      data-emerald-action="true"
      aria-label="Continue with passkey"
      className={[
        'jj-passkey-cta jj-cta-emerald allow-white group relative w-full overflow-hidden rounded-xl',
        'flex items-center justify-center gap-3 h-12 px-6',
        'text-white font-semibold text-[15px] tracking-wide',
        'shadow-[0_10px_30px_-12px_rgba(6,78,59,0.65)]',
        'transition-transform duration-300 hover:-translate-y-[1px] active:translate-y-0',
        'disabled:opacity-70 disabled:cursor-not-allowed',
        className || '',
      ].join(' ')}
      style={{
        background:
          'linear-gradient(135deg, #064E3B 0%, #086148 35%, #042C1C 70%, #000000 100%)',
        border: 0,
      }}
    >
      {/* champagne sheen sweep */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'linear-gradient(115deg, transparent 35%, rgba(239,230,214,0.16) 50%, transparent 65%)',
          transform: 'translateX(-120%)',
          animation: 'jj-passkey-sheen 4.5s ease-in-out infinite',
          mixBlendMode: 'screen',
        }}
      />

      <span className="relative flex items-center gap-2.5" style={{ color: '#FFFFFF' }}>
        {busy ? (
          <Loader2 className="w-[18px] h-[18px] animate-spin" style={{ color: '#FFFFFF' }} />
        ) : (
          <span className="relative inline-flex items-center justify-center">
            <ShieldCheck
              className="w-[18px] h-[18px]"
              style={{ color: '#FFFFFF' }}
              strokeWidth={2.25}
              aria-hidden="true"
            />
            <KeyRound
              className="w-[10px] h-[10px] absolute -bottom-0.5 -right-1"
              style={{ color: '#FFFFFF' }}
              strokeWidth={2.5}
              aria-hidden="true"
            />
          </span>
        )}
        <span className="allow-white" style={{ color: '#FFFFFF' }}>
          Continue with Passkey
        </span>
      </span>
    </button>
  );
}

export default PasskeyButton;
