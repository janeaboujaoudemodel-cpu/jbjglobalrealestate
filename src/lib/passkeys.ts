// Thin wrapper around @simplewebauthn/browser + our edge functions.
import {
  startRegistration,
  startAuthentication,
  browserSupportsWebAuthn,
  browserSupportsWebAuthnAutofill,
} from '@simplewebauthn/browser';
import { supabase } from '@/integrations/supabase/client';

export const isPasskeySupported = (): boolean => browserSupportsWebAuthn();
export const hasConditionalUI = async (): Promise<boolean> => {
  try { return await browserSupportsWebAuthnAutofill(); } catch { return false; }
};

/** Registers a new passkey for the currently signed-in user. */
export async function registerPasskey(deviceLabel?: string): Promise<void> {
  const { data: opts, error: e1 } = await supabase.functions.invoke('webauthn-register-options');
  if (e1 || !opts) throw new Error(e1?.message || 'Could not start passkey enrollment');

  const attResp = await startRegistration({ optionsJSON: opts });

  const { error: e2 } = await supabase.functions.invoke('webauthn-register-verify', {
    body: { response: attResp, deviceLabel },
  });
  if (e2) throw new Error(e2.message || 'Passkey enrollment failed');
}

/** Signs in using a passkey. Sets the Supabase session on success. */
export async function signInWithPasskey(useAutofill = false): Promise<void> {
  const { data: opts, error: e1 } = await supabase.functions.invoke('webauthn-auth-options');
  if (e1 || !opts) throw new Error(e1?.message || 'Could not start passkey sign-in');

  const assertion = await startAuthentication({ optionsJSON: opts, useBrowserAutofill: useAutofill });

  const { data: sess, error: e2 } = await supabase.functions.invoke('webauthn-auth-verify', {
    body: { response: assertion },
  });
  if (e2 || !sess?.access_token) throw new Error(e2?.message || 'Passkey sign-in failed');

  const { error: sErr } = await supabase.auth.setSession({
    access_token: sess.access_token,
    refresh_token: sess.refresh_token,
  });
  if (sErr) throw sErr;
}

export async function listPasskeys() {
  const { data, error } = await supabase
    .from('user_passkeys')
    .select('id, device_label, created_at, last_used_at')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function revokePasskey(id: string): Promise<void> {
  const { error } = await supabase.from('user_passkeys').delete().eq('id', id);
  if (error) throw error;
}
