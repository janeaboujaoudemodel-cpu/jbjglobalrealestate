import { Inbox } from "lucide-react";
import { Link } from "react-router-dom";
import BrokerEmptyState from "@/components/broker-portal/BrokerEmptyState";

export default function BrokerInbox() {
  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">Inbox</h1>
        <p className="text-sm text-[#1A1A1A]/70 mt-1">
          Messages and communications addressed to you.
        </p>
      </header>

      <BrokerEmptyState
        icon={<Inbox className="h-6 w-6" />}
        title="Inbox coming online"
        description="Your messages will appear here once your account is wired into the team chat and email channels."
        action={(
          <div className="text-xs text-[#1A1A1A]/70">
            Use <Link className="underline decoration-[#B89555]/70 underline-offset-4" to="/broker/crm?tab=notes">Notes</Link> and{" "}
            <Link className="underline decoration-[#B89555]/70 underline-offset-4" to="/broker/crm?tab=tasks">Tasks</Link> to capture follow-ups.
          </div>
        )}
      />
    </div>
  );
}
