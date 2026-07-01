import { Link } from "react-router-dom";
import { JBJ_CRM_MODULES } from "./jbjCrmConfig";

export default function JbjCrmHome() {
  const tiles = JBJ_CRM_MODULES.filter((m) => m.id !== "home");
  return (
    <div className="p-6">
      <div className="mb-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#5A5346]">Workspace</p>
        <h1 className="text-[22px] font-semibold text-[#1A1A1A]">JBJ CRM Home</h1>
        <p className="text-[13px] text-[#5A5346] mt-1">Your unified command center — mirrored from Zoho, powered by JBJ.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {tiles.map((m) => {
          const Icon = m.icon;
          const to = m.path === "" ? "/owner/crm/jbj" : `/owner/crm/jbj/${m.path}`;
          return (
            <Link
              key={m.id}
              to={to}
              className="group rounded-2xl bg-white border border-[#E7DDC8] p-4 flex flex-col gap-2 hover:border-emerald-500/60 transition-colors shadow-[0_6px_18px_-18px_rgba(6,78,59,0.35)]"
            >
              <div
                className="h-9 w-9 rounded-lg inline-flex items-center justify-center text-white"
                style={{
                  background: "linear-gradient(180deg, #0B5F46 0%, #064E3B 55%, #043528 100%)",
                  border: "1px solid #10B981",
                  boxShadow: "inset 0 1px 0 rgba(110,231,183,0.55)",
                }}
              >
                <Icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[13px] font-semibold text-[#1A1A1A]">{m.label}</p>
                <p className="text-[10.5px] uppercase tracking-[0.18em] text-[#8A7F6A]">{m.group}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
