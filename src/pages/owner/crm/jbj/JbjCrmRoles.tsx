const EMERALD_PILL: React.CSSProperties = {
  background: "linear-gradient(180deg, #0B5F46 0%, #064E3B 55%, #043528 100%)",
  border: "1px solid #10B981",
  boxShadow: "inset 0 1px 0 rgba(110,231,183,0.55), inset 0 -1px 0 rgba(0,0,0,0.35), 0 1px 2px rgba(0,0,0,0.35)",
  color: "#FFFFFF",
};

const ROLES = [
  { role: "Owner",         members: 1, scope: "Full access to every module and setting." },
  { role: "Sales Manager", members: 0, scope: "Leads, Contacts, Accounts, Deals, Forecast, Reports." },
  { role: "Agent",         members: 0, scope: "Own Leads/Contacts/Deals + shared Accounts." },
  { role: "Marketing",     members: 0, scope: "Campaigns, Contacts (read), Reports." },
  { role: "Support",       members: 0, scope: "Cases, Contacts (read), Solutions." },
];

export default function JbjCrmRoles() {
  return (
    <div className="p-6">
      <div className="mb-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#5A5346]">Configure</p>
        <h1 className="text-[22px] font-semibold text-[#1A1A1A]">Roles & Permissions</h1>
        <p className="text-[13px] text-[#5A5346] mt-1">Who can see and touch what across JBJ CRM.</p>
      </div>

      <div className="rounded-2xl bg-white border border-[#E7DDC8] overflow-hidden">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="bg-[#F7F2EA] text-[11px] uppercase tracking-wider text-[#5A5346]">
              <th className="text-left font-semibold px-4 py-2.5">Role</th>
              <th className="text-left font-semibold px-4 py-2.5">Members</th>
              <th className="text-left font-semibold px-4 py-2.5">Scope</th>
              <th className="text-right font-semibold px-4 py-2.5">Actions</th>
            </tr>
          </thead>
          <tbody className="text-[#1A1A1A]">
            {ROLES.map((r) => (
              <tr key={r.role} className="border-t border-[#EFE6D6]">
                <td className="px-4 py-2.5 font-semibold">{r.role}</td>
                <td className="px-4 py-2.5">{r.members}</td>
                <td className="px-4 py-2.5 text-[#5A5346]">{r.scope}</td>
                <td className="px-4 py-2.5 text-right">
                  <button className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-semibold" style={EMERALD_PILL}>
                    Manage
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-[11px] text-[#5A5346] mt-3">
        Role assignment writes to the existing <code>user_roles</code> table via the security-definer helper — full assignment UI lands in Phase 2.
      </p>
    </div>
  );
}
