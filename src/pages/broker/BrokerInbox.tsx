import { Inbox } from "lucide-react";
import { Link } from "react-router-dom";

export default function BrokerInbox() {
  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">Inbox</h1>
        <p className="text-sm text-[#1A1A1A]/70 mt-1">
          Messages and communications addressed to you.
        </p>
      </header>

      <div className="rounded-xl bg-[#F7F2EA] border border-[#B89555]/20 p-12 text-center">
        <Inbox className="h-10 w-10 mx-auto text-[#1A1A1A]/40 mb-3" />
        <h2 className="text-sm font-semibold">Inbox coming online</h2>
        <p className="text-xs text-[#1A1A1A]/70 mt-2 max-w-md mx-auto">
          Your messages will appear here once your account is wired into the team chat
          and email channels. In the meantime, use{" "}
          <Link className="underline" to="/broker/crm/notes">Notes</Link> and{" "}
          <Link className="underline" to="/broker/crm/tasks">Tasks</Link> to capture follow-ups.
        </p>
      </div>
    </div>
  );
}
