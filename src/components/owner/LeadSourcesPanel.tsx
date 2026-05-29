import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { TrendingUp, Loader2, Users, ChevronRight } from 'lucide-react';

interface SourceRow {
  signup_source: string;
  signup_source_label: string;
  total_picks: number;
  unique_users: number;
  picks_last_7d: number;
  picks_last_30d: number;
  last_picked_at: string | null;
}

interface SourceEventRow {
  id: string;
  user_id: string | null;
  email: string | null;
  signup_source: string;
  signup_source_label: string;
  picked_role: string | null;
  page_path: string | null;
  created_at: string;
}

interface LeadRow {
  id: string;
  owner_user_id: string | null;
  full_name: string | null;
  email_lower: string | null;
  phone_e164: string | null;
  contact_type: string | null;
  source: string | null;
  lead_source_type: string | null;
  account_status: string | null;
  pipeline_stage: string | null;
  created_at: string;
}

const maskEmail = (value: string | null) => {
  if (!value || !value.includes('@')) return 'No email on record';
  return 'Email on record';
};

const maskPhone = (value: string | null) => {
  if (!value) return 'No phone on record';
  return 'Phone on record';
};

const formatValue = (value: string | null) =>
  value ? value.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : 'Not set';

export default function LeadSourcesPanel() {
  const [rows, setRows] = useState<SourceRow[]>([]);
  const [events, setEvents] = useState<SourceEventRow[]>([]);
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [selectedSource, setSelectedSource] = useState<SourceRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const fetchRows = async () => {
      const [countsRes, eventsRes, leadsRes] = await Promise.all([
        supabase.from('vw_signup_source_counts' as any).select('*'),
        supabase
          .from('signup_source_events' as any)
          .select('id, user_id, email, signup_source, signup_source_label, picked_role, page_path, created_at')
          .order('created_at', { ascending: false })
          .limit(200),
        supabase
          .from('crm_leads')
          .select('id, owner_user_id, full_name, email_lower, phone_e164, contact_type, source, lead_source_type, account_status, pipeline_stage, created_at')
          .is('deleted_at', null)
          .or('source.eq.self_registration,lead_source_type.eq.mode_selection')
          .order('created_at', { ascending: false })
          .limit(200),
      ]);
      if (!cancelled && !countsRes.error && countsRes.data) setRows(countsRes.data as unknown as SourceRow[]);
      if (!cancelled && !eventsRes.error && eventsRes.data) setEvents(eventsRes.data as unknown as SourceEventRow[]);
      if (!cancelled && !leadsRes.error && leadsRes.data) setLeads(leadsRes.data as unknown as LeadRow[]);
      if (!cancelled) setLoading(false);
    };
    fetchRows();
    const id = setInterval(fetchRows, 1000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  const selectedDetails = useMemo(() => {
    if (!selectedSource) return [];
    const sourceEvents = events.filter((event) => event.signup_source === selectedSource.signup_source);
    return sourceEvents.map((event) => {
      const match = leads.find((lead) =>
        (event.user_id && lead.owner_user_id === event.user_id) ||
        (event.email && lead.email_lower === event.email.toLowerCase())
      );
      return { event, lead: match || null };
    });
  }, [events, leads, selectedSource]);

  return (
    <Card className="bg-[#F7F2EA] border-2 border-[#B89555]/40">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-[#1A1A1A] flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-[hsl(var(--gold))]" strokeWidth={2.5} />
          Lead Sources
          <span className="ml-auto inline-flex items-center gap-1.5 text-[10px] font-medium text-[#1A1A1A]/60 uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="py-6 flex items-center justify-center text-[#1A1A1A]/60">
            <Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading…
          </div>
        ) : rows.length === 0 ? (
          <p className="text-sm text-[#1A1A1A]/60 py-6 text-center">
            No leads yet — picks will appear here as soon as users select a role anywhere on the site.
          </p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-[#B89555]/30">
            <table className="w-full text-sm">
              <thead className="bg-[#EFE6D6] text-[#1A1A1A] text-xs uppercase tracking-wider">
                <tr>
                  <th className="text-left px-4 py-2 font-semibold">Source</th>
                  <th className="text-right px-3 py-2 font-semibold">Total Unique</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr
                    key={r.signup_source}
                    onClick={() => setSelectedSource(r)}
                    className="border-t border-[#B89555]/20 hover:bg-[#FDFBF7] transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-3 text-[#1A1A1A] font-medium">
                      <span className="inline-flex items-center gap-2">
                        {r.signup_source_label}
                        <ChevronRight className="w-3.5 h-3.5 text-[#B89555]" />
                      </span>
                      <div className="text-[10px] text-[#1A1A1A]/50 font-mono mt-0.5">
                        {r.signup_source}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums font-semibold text-[#1A1A1A]">
                      {r.unique_users}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
      <Sheet open={!!selectedSource} onOpenChange={(open) => !open && setSelectedSource(null)}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto bg-[#FDFBF7] border-l border-[#B89555]/30">
          {selectedSource && (
            <>
              <SheetHeader>
                <SheetTitle className="text-[#1A1A1A] flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#B89555]" />
                  {selectedSource.signup_source_label}
                </SheetTitle>
              </SheetHeader>
              <div className="mt-4 space-y-3">
                <div className="rounded-lg border border-[#B89555]/30 bg-[#F7F2EA] p-3 text-sm text-[#1A1A1A]">
                  <div className="font-semibold">{selectedSource.unique_users} unique registered user{Number(selectedSource.unique_users) === 1 ? '' : 's'}</div>
                  <div className="text-xs text-[#1A1A1A]/65 mt-1">Click records show the actual CRM lead/profile link when available. Contact values are masked for privacy.</div>
                </div>
                {selectedDetails.length === 0 ? (
                  <div className="rounded-lg border border-[#B89555]/25 bg-[#F7F2EA] p-6 text-center text-sm text-[#1A1A1A]/65">
                    No user records found for this source yet.
                  </div>
                ) : selectedDetails.map(({ event, lead }) => (
                  <div key={event.id} className="rounded-lg border border-[#B89555]/25 bg-[#FDFBF7] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold text-[#1A1A1A]">{lead?.full_name || (event.user_id ? 'Registered user' : 'Anonymous visitor')}</div>
                        <div className="text-xs text-[#1A1A1A]/60 mt-0.5">{new Date(event.created_at).toLocaleString()}</div>
                      </div>
                      <span className="shrink-0 rounded-md border border-[#B89555]/40 bg-[#EFE6D6] px-2 py-1 text-[11px] font-semibold text-[#1A1A1A]">
                        {formatValue(lead?.contact_type || event.picked_role)}
                      </span>
                    </div>
                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#1A1A1A]/75">
                      <div><span className="font-semibold text-[#1A1A1A]">Email:</span> {maskEmail(lead?.email_lower || event.email)}</div>
                      <div><span className="font-semibold text-[#1A1A1A]">Phone:</span> {maskPhone(lead?.phone_e164 || null)}</div>
                      <div><span className="font-semibold text-[#1A1A1A]">Account:</span> {formatValue(lead?.account_status || (lead ? 'registered' : null))}</div>
                      <div><span className="font-semibold text-[#1A1A1A]">Stage:</span> {formatValue(lead?.pipeline_stage || null)}</div>
                      <div className="sm:col-span-2"><span className="font-semibold text-[#1A1A1A]">Page:</span> {event.page_path || 'Not captured'}</div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </Card>
  );
}
