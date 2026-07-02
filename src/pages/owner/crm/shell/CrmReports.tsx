import { useMemo, useRef, useState, useEffect } from "react";
import {
  BarChart3,
  Check,
  ChevronDown,
  FolderCog,
  HelpCircle,
  Search,
  Star,
} from "lucide-react";

/**
 * JBJ CRM — Reports (folder dropdown + report table).
 * Structural parity with Zoho's Reports; JBJ palette + tokens only.
 */

type Report = {
  id: string;
  name: string;
  description: string;
  folder: string;
  lastAccessed: string;
  createdBy: string;
  starred?: boolean;
};

const FOLDERS = [
  "All Reports",
  "My Reports",
  "Favorites",
  "Recently Viewed",
  "Shared Reports",
  "Scheduled Reports",
  "Recently Deleted",
  "Account and Contact Reports",
  "Email Reports",
  "Meeting Reports",
  "Sales Metrics Reports",
  "Marketing Reports",
];

const SEED: Report[] = [
  { id: "r1",  name: "Top 10 templates by open rate",       description: "Top 10 templates based on percentage of opens", folder: "Email Reports", lastAccessed: "—", createdBy: "—", starred: true },
  { id: "r2",  name: "Top 10 templates by click rate",       description: "Top 10 templates based on percentage of clicks", folder: "Email Reports", lastAccessed: "—", createdBy: "—" },
  { id: "r3",  name: "Rep activity summary",                 description: "No. of emails sent and replied, calls dialled…", folder: "Email Reports", lastAccessed: "—", createdBy: "—" },
  { id: "r4",  name: "Rep engagement summary",               description: "No. of mails sent and replied, calls attended…", folder: "Email Reports", lastAccessed: "—", createdBy: "—" },
  { id: "r5",  name: "Top 10 users by mail sent rate",       description: "Top 10 users based on Mails Sent Rate",         folder: "Email Reports", lastAccessed: "—", createdBy: "—" },
  { id: "r6",  name: "Email status summary",                 description: "Summary of the email status (sent, bounced…)",   folder: "Email Reports", lastAccessed: "—", createdBy: "—" },
  { id: "r7",  name: "Bounced emails summary",               description: "Summary of bounced emails, reason for the…",     folder: "Email Reports", lastAccessed: "—", createdBy: "—" },
  { id: "r8",  name: "Planned Vs Realized Meetings this Month", description: "Know how many planned check-ins have…",     folder: "Meeting Reports", lastAccessed: "—", createdBy: "—" },
  { id: "r9",  name: "Number of Check-Ins by Salesperson",    description: "Get number of monthly check-ins for cust…",     folder: "Meeting Reports", lastAccessed: "—", createdBy: "—" },
  { id: "r10", name: "Number of Check-Ins by Locality",       description: "Get total number of monthly check-ins fo…",    folder: "Meeting Reports", lastAccessed: "—", createdBy: "—" },
  { id: "r11", name: "Check-Ins by Locality",                  description: "Get check-in details categorized by locality", folder: "Meeting Reports", lastAccessed: "—", createdBy: "—" },
  { id: "r12", name: "Check-Ins for Leads",                    description: "Get check-in details for each Lead",           folder: "Meeting Reports", lastAccessed: "—", createdBy: "—" },
  { id: "r13", name: "Check-Ins for Accounts",                 description: "Get check-in details for each Account",        folder: "Meeting Reports", lastAccessed: "—", createdBy: "—" },
  { id: "r14", name: "Overall Sales Duration Across Deal Type", description: "Average time taken for Lead to be convert…",  folder: "Sales Metrics Reports", lastAccessed: "—", createdBy: "—" },
  { id: "r15", name: "Overall Sales Duration Across Lead Source", description: "Average number of days taken for the Lea…", folder: "Sales Metrics Reports", lastAccessed: "—", createdBy: "—" },
];

export default function CrmReports() {
  const [folder, setFolder] = useState("All Reports");
  const [folderOpen, setFolderOpen] = useState(false);
  const [folderSearch, setFolderSearch] = useState("");
  const [tableSearch, setTableSearch] = useState("");
  const [reports, setReports] = useState<Report[]>(SEED);
  const ddRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!ddRef.current?.contains(e.target as Node)) setFolderOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const filteredFolders = useMemo(
    () => FOLDERS.filter((f) => f.toLowerCase().includes(folderSearch.toLowerCase())),
    [folderSearch],
  );

  const visible = useMemo(() => {
    let list = reports;
    if (folder === "Favorites") list = list.filter((r) => r.starred);
    else if (folder !== "All Reports" && folder !== "My Reports" && folder !== "Recently Viewed" && folder !== "Shared Reports" && folder !== "Scheduled Reports" && folder !== "Recently Deleted") {
      list = list.filter((r) => r.folder === folder);
    }
    if (tableSearch.trim()) {
      const q = tableSearch.toLowerCase();
      list = list.filter((r) => r.name.toLowerCase().includes(q) || r.description.toLowerCase().includes(q));
    }
    return list;
  }, [reports, folder, tableSearch]);

  const toggleStar = (id: string) =>
    setReports((prev) => prev.map((r) => (r.id === id ? { ...r, starred: !r.starred } : r)));

  return (
    <div className="jc-rp" data-no-contrast-guard>
      <div className="jc-rp__title">
        <h1>Reports</h1>
      </div>

      <div className="jc-rp__toolbar">
        <div className="jc-rp__folder" ref={ddRef}>
          <button
            type="button"
            className="jc-rp__folder-btn"
            aria-haspopup="listbox"
            aria-expanded={folderOpen}
            onClick={() => setFolderOpen((v) => !v)}
          >
            <span>{folder}</span>
            <ChevronDown size={14} />
          </button>
          {folderOpen && (
            <div className="jc-rp__folder-menu" role="listbox">
              <div className="jc-rp__folder-search">
                <Search size={13} />
                <input
                  autoFocus
                  placeholder="Search Folder"
                  value={folderSearch}
                  onChange={(e) => setFolderSearch(e.target.value)}
                />
              </div>
              <ul>
                {filteredFolders.slice(0, 7).map((f) => (
                  <li key={f}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={f === folder}
                      data-active={f === folder}
                      onClick={() => { setFolder(f); setFolderOpen(false); }}
                    >
                      <span className="jc-rp__folder-check">{f === folder && <Check size={13} />}</span>
                      <span>{f}</span>
                    </button>
                  </li>
                ))}
                <li className="jc-rp__folder-sep" role="separator" />
                {filteredFolders.slice(7).map((f) => (
                  <li key={f}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={f === folder}
                      data-active={f === folder}
                      onClick={() => { setFolder(f); setFolderOpen(false); }}
                    >
                      <span className="jc-rp__folder-check">{f === folder && <Check size={13} />}</span>
                      <span>{f}</span>
                    </button>
                  </li>
                ))}
                <li className="jc-rp__folder-sep" role="separator" />
                <li>
                  <button type="button" className="jc-rp__folder-manage">
                    <FolderCog size={13} /> Manage Folders
                  </button>
                </li>
                <li className="jc-rp__folder-advanced">
                  <BarChart3 size={14} />
                  <div>
                    <strong>Advanced Analytics for JBJ CRM</strong>
                    <span>powered by JBJ Analytics</span>
                  </div>
                </li>
              </ul>
            </div>
          )}
        </div>

        <div className="jc-rp__toolbar-right">
          <div className="jc-rp__search">
            <Search size={13} />
            <input
              placeholder="Search All Reports"
              value={tableSearch}
              onChange={(e) => setTableSearch(e.target.value)}
            />
          </div>
          <button type="button" className="jc-rp__create">Create Report</button>
          <button type="button" className="jc-rp__help" aria-label="Help"><HelpCircle size={16} /></button>
        </div>
      </div>

      <div className="jc-rp__table" role="table" aria-label="Reports">
        <div className="jc-rp__thead" role="row">
          <div className="jc-rp__th jc-rp__th--check" role="columnheader">
            <input type="checkbox" aria-label="Select all reports" />
          </div>
          <div className="jc-rp__th jc-rp__th--star" role="columnheader" />
          <div className="jc-rp__th jc-rp__th--name" role="columnheader">Report Name</div>
          <div className="jc-rp__th jc-rp__th--desc" role="columnheader">Description</div>
          <div className="jc-rp__th jc-rp__th--folder" role="columnheader">Folder</div>
          <div className="jc-rp__th" role="columnheader">Last Accessed Date</div>
          <div className="jc-rp__th" role="columnheader">Created By</div>
        </div>
        {visible.map((r) => (
          <div key={r.id} className="jc-rp__row" role="row">
            <div className="jc-rp__td jc-rp__td--check" role="cell">
              <input type="checkbox" aria-label={`Select ${r.name}`} />
            </div>
            <div className="jc-rp__td jc-rp__td--star" role="cell">
              <button
                type="button"
                className="jc-rp__star"
                data-on={!!r.starred}
                onClick={() => toggleStar(r.id)}
                aria-label={r.starred ? "Unstar report" : "Star report"}
              >
                <Star size={14} fill={r.starred ? "currentColor" : "none"} />
              </button>
            </div>
            <div className="jc-rp__td jc-rp__td--name" role="cell">
              <button type="button" className="jc-rp__name-link">{r.name}</button>
            </div>
            <div className="jc-rp__td" role="cell">{r.description}</div>
            <div className="jc-rp__td" role="cell">{r.folder}</div>
            <div className="jc-rp__td" role="cell">{r.lastAccessed}</div>
            <div className="jc-rp__td" role="cell">{r.createdBy}</div>
          </div>
        ))}
        {visible.length === 0 && (
          <div className="jc-rp__empty">No reports match your filter.</div>
        )}
      </div>
    </div>
  );
}
