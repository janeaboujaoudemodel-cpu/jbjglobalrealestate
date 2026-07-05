import { useEffect, useState } from 'react';
import { KeyRound, Loader2, Trash2, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { isPasskeySupported, registerPasskey, listPasskeys, revokePasskey } from '@/lib/passkeys';

type Row = { id: string; device_label: string | null; created_at: string; last_used_at: string | null };

export function PasskeyManager() {
  const [supported, setSupported] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);

  const load = async () => {
    try { setRows((await listPasskeys()) as Row[]); }
    catch (e) { toast.error((e as Error).message); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    setSupported(isPasskeySupported());
    load();
  }, []);

  const enroll = async () => {
    setEnrolling(true);
    try {
      const label = typeof navigator !== 'undefined' && /iPhone|iPad/.test(navigator.userAgent)
        ? 'iPhone / iPad (Face ID)'
        : /Mac/.test(navigator.userAgent) ? 'Mac (Touch ID)'
        : /Windows/.test(navigator.userAgent) ? 'Windows Hello'
        : /Android/.test(navigator.userAgent) ? 'Android biometrics'
        : 'This device';
      await registerPasskey(label);
      toast.success('Passkey enrolled — you can now sign in with biometrics.');
      await load();
    } catch (e) {
      const msg = (e as Error).message || 'Enrollment failed';
      if (!/NotAllowedError|abort/i.test(msg)) toast.error(msg);
    } finally { setEnrolling(false); }
  };

  const remove = async (id: string) => {
    try { await revokePasskey(id); setRows((r) => r.filter((x) => x.id !== id)); toast.success('Passkey removed'); }
    catch (e) { toast.error((e as Error).message); }
  };

  if (!supported) {
    return (
      <div className="rounded-xl border p-4 text-sm text-muted-foreground">
        This browser does not support passkeys.
      </div>
    );
  }

  return (
    <div className="rounded-xl border p-5 space-y-4" data-no-contrast-guard>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" /> Passkeys (Face ID / Fingerprint)
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Sign in with the biometrics on your device. Faster than a password, and phishing-resistant.
          </p>
        </div>
        <Button onClick={enroll} disabled={enrolling} size="sm">
          {enrolling ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <KeyRound className="w-4 h-4 mr-2" />}
          Add this device
        </Button>
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : rows.length === 0 ? (
        <div className="text-sm text-muted-foreground">No passkeys yet.</div>
      ) : (
        <ul className="divide-y">
          {rows.map((r) => (
            <li key={r.id} className="flex items-center justify-between py-3">
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">{r.device_label || 'Passkey'}</div>
                <div className="text-xs text-muted-foreground">
                  Added {new Date(r.created_at).toLocaleDateString()}
                  {r.last_used_at ? ` · Last used ${new Date(r.last_used_at).toLocaleDateString()}` : ' · Never used'}
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => remove(r.id)} aria-label="Remove passkey">
                <Trash2 className="w-4 h-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default PasskeyManager;
