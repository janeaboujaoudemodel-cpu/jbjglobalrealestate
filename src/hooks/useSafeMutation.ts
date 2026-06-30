/**
 * Tiny hook that wraps `safeCall` for use inside React mutations.
 * Gives broker/owner pages a one-liner for permission-safe RPC calls.
 *
 *   const promote = useSafeMutation({
 *     lockKey: (id: string) => `lead:${id}`,
 *     run: (id: string) => supabase.rpc("broker_promote_lead_to_main", { _lead_id: id }),
 *     successMessage: "Lead added to your pipeline",
 *   });
 *   promote.mutate(leadId);
 */

import { useMutation, UseMutationOptions } from "@tanstack/react-query";
import { toast } from "sonner";
import { safeCall, describeError } from "@/utils/safeApi";

type Key = string | readonly (string | number | null | undefined)[];

interface SafeMutationOptions<TVars, TData>
  extends Omit<UseMutationOptions<{ data: TData }, unknown, TVars>, "mutationFn"> {
  run: (vars: TVars) => Promise<{ data: TData; error: any } | TData>;
  /** Optional dedup key (per-vars). */
  key?: (vars: TVars) => Key;
  /** Optional mutex key (per-vars) — prevents conflicting concurrent writes. */
  lockKey?: (vars: TVars) => Key;
  /** Toast on success. Pass false to disable. */
  successMessage?: string | false;
  /** Toast on error. Pass false to disable (caller will render banner). */
  errorToast?: boolean;
}

export function useSafeMutation<TVars = void, TData = unknown>(
  opts: SafeMutationOptions<TVars, TData>,
) {
  const { run, key, lockKey, successMessage, errorToast = true, onSuccess, onError, ...rest } = opts;

  return useMutation({
    ...rest,
    mutationFn: (vars: TVars) =>
      safeCall<TData>({
        key: key ? key(vars) : undefined,
        lockKey: lockKey ? lockKey(vars) : undefined,
        run: () => run(vars),
      }),
    onSuccess: (res, vars, ctx) => {
      if (successMessage !== false && successMessage) toast.success(successMessage);
      onSuccess?.(res, vars, ctx);
    },
    onError: (err, vars, ctx) => {
      if (errorToast) {
        const f = describeError(err);
        toast.error(f.title, { description: f.message });
      }
      onError?.(err, vars, ctx);
    },
  });
}
