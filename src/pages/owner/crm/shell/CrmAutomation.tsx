import { useState } from "react";
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Clock,
  Copy,
  Filter,
  GitBranch,
  Layers,
  MoreHorizontal,
  Play,
  Plus,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserPlus2,
  Workflow,
  Zap,
} from "lucide-react";

/**
 * Phase 14 — Automation Studio.
 * Tabs: Workflow Rules · Blueprint · Approval Processes · Assignment Rules · Schedules · Actions Library.
 */

type TabId = "workflow" | "blueprint" | "approval" | "assignment" | "schedules" | "actions";

const TABS: Array<{ id: TabId; label: string; icon: any }> = [
  { id: "workflow", label: "Workflow Rules", icon: Workflow },
  { id: "blueprint", label: "Blueprint", icon: GitBranch },
  { id: "approval", label: "Approval Processes", icon: ShieldCheck },
  { id: "assignment", label: "Assignment Rules", icon: UserPlus2 },
  { id: "schedules", label: "Schedules", icon: Clock },
  { id: "actions", label: "Actions", icon: Zap },
];

export default function CrmAutomation() {
  const [tab, setTab] = useState<TabId>("workflow");

  return (
    <div className="jc-auto" data-no-contrast-guard>
      <header className="jc-auto-head">
        <div>
          <div className="jc-auto-eyebrow"><Sparkles size={12} /> Automation Studio</div>
          <h1>Automate your CRM</h1>
          <p>Design workflow rules, blueprints, approvals, and assignment logic without code.</p>
        </div>
        <div className="jc-auto-head-actions">
          <button type="button" className="jc-auto-secondary"><Copy size={13} /> Templates</button>
          <button type="button" className="jc-auto-primary"><Plus size={14} /> Create</button>
        </div>
      </header>

      <nav className="jc-auto-tabs" role="tablist" aria-label="Automation tabs">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={active}
              className={`jc-auto-tab${active ? " is-active" : ""}`}
              onClick={() => setTab(t.id)}
            >
              <Icon size={14} /> <span>{t.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="jc-auto-body">
        {tab === "workflow" && <WorkflowRulesView />}
        {tab === "blueprint" && <BlueprintView />}
        {tab === "approval" && <ApprovalView />}
        {tab === "assignment" && <AssignmentView />}
        {tab === "schedules" && <SchedulesView />}
        {tab === "actions" && <ActionsView />}
      </div>
    </div>
  );
}

/* ---------------- Workflow Rules ---------------- */
const RULES = [
  { name: "Auto-assign new Marina leads", module: "Leads", trigger: "On Create", actions: 3, runs: 148, status: "active" },
  { name: "Notify owner when Deal > AED 5M", module: "Deals", trigger: "On Field Update", actions: 2, runs: 63, status: "active" },
  { name: "Send welcome email to new Contacts", module: "Contacts", trigger: "On Create", actions: 1, runs: 412, status: "active" },
  { name: "Escalate SLA-breaching Cases", module: "Cases", trigger: "Time based", actions: 4, runs: 21, status: "paused" },
  { name: "Tag hot leads after 3 site visits", module: "Leads", trigger: "On Field Update", actions: 2, runs: 87, status: "active" },
  { name: "Follow-up task for stalled Deals", module: "Deals", trigger: "Time based", actions: 1, runs: 34, status: "draft" },
];

function WorkflowRulesView() {
  return (
    <section className="jc-auto-panel">
      <div className="jc-auto-toolbar">
        <div className="jc-auto-search">
          <Search size={13} />
          <input placeholder="Search rules" aria-label="Search rules" />
        </div>
        <button type="button" className="jc-auto-chip"><Filter size={12} /> Module</button>
        <button type="button" className="jc-auto-chip">Trigger</button>
        <button type="button" className="jc-auto-chip">Status</button>
        <div style={{ flex: 1 }} />
        <button type="button" className="jc-auto-secondary"><Play size={13} /> Test</button>
      </div>

      <div className="jc-auto-stats">
        <StatTile icon={Workflow} label="Active rules" value="5" hint="of 12 total" />
        <StatTile icon={Activity} label="Executions (30d)" value="1,284" hint="+18% vs last month" />
        <StatTile icon={CheckCircle2} label="Success rate" value="99.4%" hint="7 skipped" />
        <StatTile icon={Zap} label="Time saved" value="42h" hint="approx." />
      </div>

      <table className="jc-auto-table">
        <thead>
          <tr>
            <th>Rule name</th>
            <th>Module</th>
            <th>Trigger</th>
            <th>Actions</th>
            <th>Runs</th>
            <th>Status</th>
            <th aria-label="Row actions" />
          </tr>
        </thead>
        <tbody>
          {RULES.map((r) => (
            <tr key={r.name}>
              <td className="jc-auto-td-name">
                <div className="jc-auto-icon-tile"><Workflow size={13} /></div>
                <span>{r.name}</span>
              </td>
              <td>{r.module}</td>
              <td>{r.trigger}</td>
              <td>{r.actions}</td>
              <td>{r.runs}</td>
              <td><span className={`jc-auto-status jc-auto-status-${r.status}`}>{r.status}</span></td>
              <td><button type="button" className="jc-auto-row-btn" aria-label="More"><MoreHorizontal size={15} /></button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

/* ---------------- Blueprint ---------------- */
const STAGES = [
  { name: "Qualification", owner: "SDR", sla: "1 day", color: "emerald" },
  { name: "Needs Analysis", owner: "Advisor", sla: "2 days", color: "emerald" },
  { name: "Proposal", owner: "Advisor", sla: "3 days", color: "gold" },
  { name: "Negotiation", owner: "Advisor", sla: "5 days", color: "gold" },
  { name: "Closed Won", owner: "Ops", sla: "—", color: "success" },
];

function BlueprintView() {
  return (
    <section className="jc-auto-panel">
      <div className="jc-auto-toolbar">
        <div>
          <h2 className="jc-auto-h2">Deal Pipeline Blueprint</h2>
          <p className="jc-auto-p">Enforced transitions with mandatory fields, approvers, and SLA per stage.</p>
        </div>
        <div style={{ flex: 1 }} />
        <button type="button" className="jc-auto-secondary"><Layers size={13} /> Versions</button>
        <button type="button" className="jc-auto-primary"><Settings2 size={14} /> Edit blueprint</button>
      </div>

      <div className="jc-auto-blueprint">
        {STAGES.map((s, i) => (
          <div key={s.name} className="jc-auto-stage-wrap">
            <div className={`jc-auto-stage jc-auto-stage-${s.color}`}>
              <div className="jc-auto-stage-name">{s.name}</div>
              <div className="jc-auto-stage-meta">
                <span>Owner · {s.owner}</span>
                <span>SLA · {s.sla}</span>
              </div>
              <ul className="jc-auto-stage-rules">
                <li><CheckCircle2 size={11} /> Required: Amount, Close date</li>
                <li><CheckCircle2 size={11} /> Auto-task on entry</li>
                {i >= 2 && <li><ShieldCheck size={11} /> Approval required</li>}
              </ul>
            </div>
            {i < STAGES.length - 1 && (
              <div className="jc-auto-stage-arrow" aria-hidden><ChevronRight size={18} /></div>
            )}
          </div>
        ))}
      </div>

      <div className="jc-auto-stats">
        <StatTile icon={Activity} label="In pipeline" value="184" />
        <StatTile icon={Clock} label="Avg cycle" value="21d" />
        <StatTile icon={CheckCircle2} label="Compliance" value="96%" hint="stage transitions" />
        <StatTile icon={ShieldCheck} label="Awaiting approval" value="7" />
      </div>
    </section>
  );
}

/* ---------------- Approval Processes ---------------- */
const APPROVALS = [
  { name: "Discount > 5% on Deals", stage: "Proposal", approvers: "Advisor Lead, Owner", pending: 4 },
  { name: "New Vendor onboarding", stage: "Vendor create", approvers: "Ops Manager", pending: 1 },
  { name: "Refund > AED 20,000", stage: "Case close", approvers: "Owner", pending: 0 },
  { name: "External broker payout release", stage: "Deal won", approvers: "Finance, Owner", pending: 2 },
];

function ApprovalView() {
  return (
    <section className="jc-auto-panel">
      <div className="jc-auto-toolbar">
        <h2 className="jc-auto-h2">Approval Processes</h2>
        <div style={{ flex: 1 }} />
        <button type="button" className="jc-auto-primary"><Plus size={14} /> New process</button>
      </div>

      <div className="jc-auto-grid">
        {APPROVALS.map((a) => (
          <article key={a.name} className="jc-auto-card">
            <div className="jc-auto-card-icon"><ShieldCheck size={16} /></div>
            <h3>{a.name}</h3>
            <div className="jc-auto-card-meta">
              <span>Applies at · {a.stage}</span>
              <span>Approvers · {a.approvers}</span>
            </div>
            <div className="jc-auto-card-foot">
              <span className="jc-auto-badge">{a.pending} pending</span>
              <button type="button" className="jc-auto-link">Manage <ArrowRight size={12} /></button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

/* ---------------- Assignment Rules ---------------- */
const ASSIGN = [
  { name: "Round-robin — Marina & Palm", criteria: "Location ∈ {Marina, Palm}", pool: "Marina Pod (4)", mode: "Round Robin" },
  { name: "Language routing — French", criteria: "Preferred lang = FR", pool: "Sophie, Amir", mode: "First available" },
  { name: "High-value handoff", criteria: "Budget ≥ AED 10M", pool: "Advisor Lead", mode: "Direct" },
  { name: "Reassign inactive leads", criteria: "No activity 14d", pool: "SDR bench", mode: "Round Robin" },
];

function AssignmentView() {
  return (
    <section className="jc-auto-panel">
      <div className="jc-auto-toolbar">
        <h2 className="jc-auto-h2">Assignment Rules</h2>
        <div style={{ flex: 1 }} />
        <button type="button" className="jc-auto-secondary">Simulate</button>
        <button type="button" className="jc-auto-primary"><Plus size={14} /> New rule</button>
      </div>
      <table className="jc-auto-table">
        <thead>
          <tr>
            <th>Rule</th>
            <th>Criteria</th>
            <th>Pool</th>
            <th>Mode</th>
            <th aria-label="Actions" />
          </tr>
        </thead>
        <tbody>
          {ASSIGN.map((a) => (
            <tr key={a.name}>
              <td className="jc-auto-td-name">
                <div className="jc-auto-icon-tile"><UserPlus2 size={13} /></div>
                <span>{a.name}</span>
              </td>
              <td><code className="jc-auto-code">{a.criteria}</code></td>
              <td>{a.pool}</td>
              <td><span className="jc-auto-status jc-auto-status-active">{a.mode}</span></td>
              <td>
                <button type="button" className="jc-auto-row-btn" aria-label="Edit"><Settings2 size={14} /></button>
                <button type="button" className="jc-auto-row-btn" aria-label="Delete"><Trash2 size={14} /></button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

/* ---------------- Schedules ---------------- */
const SCHEDULES = [
  { name: "Weekly forecast digest", cadence: "Mondays · 08:00 GST", next: "in 3 days", target: "Owner, Sales leads" },
  { name: "Broker payout summary", cadence: "1st of month · 09:00", next: "in 12 days", target: "Finance" },
  { name: "Stale-lead cleanup", cadence: "Daily · 02:00", next: "tonight", target: "Automation" },
  { name: "KPI snapshot to Slack", cadence: "Hourly · business hrs", next: "in 42m", target: "#sales-ops" },
];

function SchedulesView() {
  return (
    <section className="jc-auto-panel">
      <div className="jc-auto-toolbar">
        <h2 className="jc-auto-h2">Scheduled Automations</h2>
        <div style={{ flex: 1 }} />
        <button type="button" className="jc-auto-primary"><Plus size={14} /> New schedule</button>
      </div>
      <div className="jc-auto-grid">
        {SCHEDULES.map((s) => (
          <article key={s.name} className="jc-auto-card">
            <div className="jc-auto-card-icon"><Clock size={16} /></div>
            <h3>{s.name}</h3>
            <div className="jc-auto-card-meta">
              <span>Cadence · {s.cadence}</span>
              <span>Target · {s.target}</span>
            </div>
            <div className="jc-auto-card-foot">
              <span className="jc-auto-badge">Next · {s.next}</span>
              <button type="button" className="jc-auto-link">Run now <Play size={12} /></button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

/* ---------------- Actions Library ---------------- */
const ACTIONS = [
  { name: "Send Email", type: "Email", usage: 34 },
  { name: "Create Task", type: "Task", usage: 22 },
  { name: "Update Field", type: "Field", usage: 41 },
  { name: "Webhook", type: "HTTP", usage: 9 },
  { name: "Push Notification", type: "Alert", usage: 15 },
  { name: "Assign Owner", type: "Assign", usage: 18 },
  { name: "Convert Lead", type: "Convert", usage: 7 },
  { name: "Tag Record", type: "Tag", usage: 12 },
];

function ActionsView() {
  return (
    <section className="jc-auto-panel">
      <div className="jc-auto-toolbar">
        <h2 className="jc-auto-h2">Actions Library</h2>
        <div style={{ flex: 1 }} />
        <button type="button" className="jc-auto-primary"><Plus size={14} /> Custom action</button>
      </div>
      <div className="jc-auto-actions-grid">
        {ACTIONS.map((a) => (
          <button key={a.name} type="button" className="jc-auto-action-card">
            <div className="jc-auto-card-icon"><Zap size={16} /></div>
            <div className="jc-auto-action-name">{a.name}</div>
            <div className="jc-auto-action-meta">{a.type} · used in {a.usage} rules</div>
          </button>
        ))}
      </div>
    </section>
  );
}

/* ---------------- Stat tile ---------------- */
function StatTile({ icon: Icon, label, value, hint }: { icon: any; label: string; value: string; hint?: string }) {
  return (
    <div className="jc-auto-stat">
      <div className="jc-auto-stat-icon"><Icon size={14} /></div>
      <div>
        <div className="jc-auto-stat-value">{value}</div>
        <div className="jc-auto-stat-label">{label}</div>
        {hint && <div className="jc-auto-stat-hint">{hint}</div>}
      </div>
    </div>
  );
}
