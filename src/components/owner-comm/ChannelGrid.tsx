/**
 * ChannelGrid — Auto-discovery grid for Comm Hub v2.
 * Replaces the old "Add Channel → pick type → enter identifier" dialog.
 */
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useCommChannels, ProviderState } from "@/hooks/useCommChannels";
import ChannelTile from "./ChannelTile";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function ChannelGrid() {
  const { data: states, isLoading } = useCommChannels();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const qc = useQueryClient();

  async function handleConnect(state: ProviderState) {
    setPendingId(state.provider.id);
    try {
      // Hostinger: open dedicated credential dialog (handled by OwnerCommSettings).
      if (state.provider.customFlow === "hostinger") {
        window.dispatchEvent(new CustomEvent("comm:open-hostinger-dialog"));
        return;
      }

      const { data, error } = await supabase.functions.invoke("comm-channel-autowire", {
        body: {
          channel_type: state.provider.id,
          connector_id: state.provider.connectorId,
          action: state.status === "connected" ? "resync" : "connect",
        },
      });
      if (error) throw error;

      if (data?.requires_connector_link) {
        toast.error(`${state.provider.label} needs to be linked first. Please ask the team to enable it on this project.`, {
          description: "Workspace connection is missing — one-click link not available without a Lovable agent action.",
        });
      } else if (data?.success) {
        toast.success(`${state.provider.label} connected`);
      } else if (data?.error) {
        toast.error(data.error);
      }
      qc.invalidateQueries({ queryKey: ["comm-channel-states"] });
      qc.invalidateQueries({ queryKey: ["owner-channels"] });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Connection failed";
      toast.error(msg);
    } finally {
      setPendingId(null);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-[#B89555]" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {(states ?? []).map((state) => (
        <ChannelTile
          key={state.provider.id}
          state={state}
          onConnect={() => handleConnect(state)}
          onAddAnother={state.status === "connected" ? () => handleConnect(state) : undefined}
          isConnecting={pendingId === state.provider.id}
        />
      ))}
    </div>
  );
}
