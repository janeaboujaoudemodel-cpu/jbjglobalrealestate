import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Shield, Download, Search, FileText, Users, Calendar, Filter, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import SEOHead from '@/components/SEOHead';
import { format } from 'date-fns';

interface AgreementRecord {
  id: string;
  user_id: string;
  agreement_type: string;
  agreement_version: string;
  agreement_snapshot: any;
  consent_details: any;
  user_agent: string | null;
  accepted_at: string;
  created_at: string;
}

const AGREEMENT_TYPES = ['all', 'cookies', 'privacy_policy', 'terms_of_service', 'content_license', 'data_processing'];

export default function LegalComplianceCenter() {
  const [records, setRecords] = useState<AgreementRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchEmail, setSearchEmail] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [stats, setStats] = useState({ total: 0, uniqueUsers: 0, today: 0 });

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('user_agreements')
        .select('*')
        .order('accepted_at', { ascending: false })
        .limit(500);

      if (filterType !== 'all') {
        query = query.eq('agreement_type', filterType);
      }

      const { data, error } = await query;
      if (error) throw error;

      const agreements = (data || []) as AgreementRecord[];
      setRecords(agreements);

      // Compute stats
      const uniqueUsers = new Set(agreements.map(r => r.user_id)).size;
      const todayStr = new Date().toISOString().split('T')[0];
      const todayCount = agreements.filter(r => r.accepted_at?.startsWith(todayStr)).length;
      setStats({ total: agreements.length, uniqueUsers, today: todayCount });
    } catch (err) {
      console.error('Failed to fetch agreements:', err);
      toast.error('Failed to load legal records');
    } finally {
      setLoading(false);
    }
  }, [filterType]);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  const filteredRecords = useMemo(() => {
    if (!searchEmail.trim()) return records;
    const term = searchEmail.toLowerCase();
    return records.filter(r => 
      r.user_id?.toLowerCase().includes(term) || 
      r.agreement_type?.toLowerCase().includes(term)
    );
  }, [records, searchEmail]);

  const exportCSV = useCallback(() => {
    const headers = ['ID', 'User ID', 'Agreement Type', 'Version', 'Accepted At', 'User Agent'];
    const rows = filteredRecords.map(r => [
      r.id, r.user_id, r.agreement_type, r.agreement_version,
      r.accepted_at, (r.user_agent || '').replace(/,/g, ';')
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `legal-agreements-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${filteredRecords.length} records`);
  }, [filteredRecords]);

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title="Legal Compliance Center | JBJ Admin" description="View and manage all user agreements and consents" />
      
      {/* Hero */}
      <div className="bg-gradient-to-br from-card via-background to-card border-b border-border py-8 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-8 h-8 text-gold" />
            <h1 className="text-2xl font-bold text-foreground">Legal Compliance Center</h1>
          </div>
          <p className="text-muted-foreground">All user agreements, consents, and legal acceptances — audit-ready.</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-card border border-border rounded-xl p-5 flex items-center gap-4">
            <FileText className="w-10 h-10 text-gold" />
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.total}</p>
              <p className="text-sm text-muted-foreground">Total Agreements</p>
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl p-5 flex items-center gap-4">
            <Users className="w-10 h-10 text-gold" />
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.uniqueUsers}</p>
              <p className="text-sm text-muted-foreground">Unique Users</p>
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl p-5 flex items-center gap-4">
            <Calendar className="w-10 h-10 text-gold" />
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.today}</p>
              <p className="text-sm text-muted-foreground">Today's Consents</p>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchEmail}
              onChange={e => setSearchEmail(e.target.value)}
              placeholder="Search by user ID or type..."
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <select
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
              className="bg-card border border-border rounded-lg px-3 py-2 text-sm text-foreground"
            >
              {AGREEMENT_TYPES.map(t => (
                <option key={t} value={t}>{t === 'all' ? 'All Types' : t.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>
              ))}
            </select>
          </div>
          <Button onClick={fetchRecords} variant="outline" size="sm" className="border-gold/30">
            <RefreshCw className="w-4 h-4 mr-1" /> Refresh
          </Button>
          <Button onClick={exportCSV} size="sm" className="bg-gold hover:bg-gold/90 text-black">
            <Download className="w-4 h-4 mr-1" /> Export CSV
          </Button>
        </div>

        {/* Table */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <ScrollArea className="max-h-[60vh]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User ID</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Version</TableHead>
                  <TableHead>Accepted At</TableHead>
                  <TableHead>User Agent</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-12 text-muted-foreground">Loading...</TableCell></TableRow>
                ) : filteredRecords.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-12 text-muted-foreground">No records found</TableCell></TableRow>
                ) : (
                  filteredRecords.map(r => (
                    <>
                      <TableRow key={r.id} className="cursor-pointer" onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}>
                        <TableCell className="font-mono text-xs max-w-[120px] truncate">{r.user_id}</TableCell>
                        <TableCell>
                          <span className="px-2 py-1 bg-gold/10 text-gold rounded-md text-xs font-medium">
                            {r.agreement_type?.replace(/_/g, ' ')}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm">{r.agreement_version}</TableCell>
                        <TableCell className="text-sm">{r.accepted_at ? format(new Date(r.accepted_at), 'MMM dd, yyyy HH:mm') : '—'}</TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">{r.user_agent || '—'}</TableCell>
                        <TableCell>
                          {expandedId === r.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </TableCell>
                      </TableRow>
                      {expandedId === r.id && (
                        <TableRow key={`${r.id}-detail`}>
                          <TableCell colSpan={6} className="bg-muted/30 p-4">
                            <div className="space-y-3">
                              <div>
                                <p className="text-sm font-semibold text-foreground mb-1">Agreement Snapshot (Exact Text Agreed To)</p>
                                <pre className="bg-background border border-border rounded-lg p-3 text-xs max-h-60 overflow-auto whitespace-pre-wrap">
                                  {JSON.stringify(r.agreement_snapshot, null, 2)}
                                </pre>
                              </div>
                              {r.consent_details && (
                                <div>
                                  <p className="text-sm font-semibold text-foreground mb-1">Consent Details</p>
                                  <pre className="bg-background border border-border rounded-lg p-3 text-xs max-h-40 overflow-auto whitespace-pre-wrap">
                                    {JSON.stringify(r.consent_details, null, 2)}
                                  </pre>
                                </div>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </div>
        <p className="text-xs text-muted-foreground">Showing {filteredRecords.length} of {records.length} records</p>
      </div>
    </div>
  );
}
