import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, AlertTriangle, X, Eye, ExternalLink, Filter } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DELIVERY_REQUIREMENTS, type DeliveryStatus, type DeliveryScope } from '@/config/delivery-checklist';

const STATUS_CONFIG: Record<DeliveryStatus, { label: string; icon: typeof Check; color: string; badgeClass: string }> = {
  done: { label: 'Done', icon: Check, color: 'text-green-600', badgeClass: 'bg-green-100 text-green-700 border-green-200' },
  partial: { label: 'Partial', icon: AlertTriangle, color: 'text-amber-600', badgeClass: 'bg-amber-100 text-amber-700 border-amber-200' },
  missing: { label: 'Missing', icon: X, color: 'text-red-600', badgeClass: 'bg-red-100 text-red-700 border-red-200' },
  needs_verification: { label: 'Needs Verification', icon: Eye, color: 'text-blue-600', badgeClass: 'bg-blue-100 text-blue-700 border-blue-200' },
};

export default function DeliveryChecklistTab() {
  const [scopeFilter, setScopeFilter] = useState<DeliveryScope | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<DeliveryStatus | 'all'>('all');

  const stats = useMemo(() => {
    const done = DELIVERY_REQUIREMENTS.filter(r => r.status === 'done').length;
    const partial = DELIVERY_REQUIREMENTS.filter(r => r.status === 'partial').length;
    const missing = DELIVERY_REQUIREMENTS.filter(r => r.status === 'missing').length;
    const needsVerification = DELIVERY_REQUIREMENTS.filter(r => r.status === 'needs_verification').length;
    return { done, partial, missing, needsVerification, total: DELIVERY_REQUIREMENTS.length };
  }, []);

  const filtered = useMemo(() => {
    return DELIVERY_REQUIREMENTS.filter(r => {
      if (scopeFilter !== 'all' && r.scope !== scopeFilter) return false;
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      return true;
    });
  }, [scopeFilter, statusFilter]);

  const scopes = [...new Set(DELIVERY_REQUIREMENTS.map(r => r.scope))];

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-[#FDFBF7]/70 border-[#B89555]/20">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-[#1A1A1A]">{stats.total}</div>
            <div className="text-xs text-[#5A4A2E]">Total Items</div>
          </CardContent>
        </Card>
        <Card className="bg-[#FDFBF7]/70 border-green-200">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.done}</div>
            <div className="text-xs text-[#5A4A2E]">Done</div>
          </CardContent>
        </Card>
        <Card className="bg-[#FDFBF7]/70 border-amber-200">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-amber-600">{stats.partial}</div>
            <div className="text-xs text-[#5A4A2E]">Partial</div>
          </CardContent>
        </Card>
        <Card className="bg-[#FDFBF7]/70 border-red-200">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{stats.missing}</div>
            <div className="text-xs text-[#5A4A2E]">Missing</div>
          </CardContent>
        </Card>
        <Card className="bg-[#FDFBF7]/70 border-blue-200">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.needsVerification}</div>
            <div className="text-xs text-[#5A4A2E]">Needs Verification</div>
          </CardContent>
        </Card>
      </div>

      {/* Completion bar */}
      <div className="bg-[#FDFBF7]/70 border border-[#B89555]/20 rounded-lg p-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-[#5A4A2E]">Overall Completion</span>
          <span className="text-[#B89555] font-semibold">{Math.round((stats.done / stats.total) * 100)}%</span>
        </div>
        <div className="w-full h-3 bg-[#B89555]/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-green-500 to-[#B89555] rounded-full transition-all"
            style={{ width: `${(stats.done / stats.total) * 100}%` }}
          />
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <Select value={scopeFilter} onValueChange={(v) => setScopeFilter(v as any)}>
          <SelectTrigger className="w-48 bg-[#FDFBF7]/70 border-[#B89555]/30 text-[#1A1A1A]">
            <Filter className="w-4 h-4 mr-2 text-[#B89555]" />
            <SelectValue placeholder="Filter by scope" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Scopes</SelectItem>
            {scopes.map(s => (
              <SelectItem key={s} value={s}>{s.replace('_', ' ').toUpperCase()}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
          <SelectTrigger className="w-48 bg-[#FDFBF7]/70 border-[#B89555]/30 text-[#1A1A1A]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="done">Done</SelectItem>
            <SelectItem value="partial">Partial</SelectItem>
            <SelectItem value="missing">Missing</SelectItem>
            <SelectItem value="needs_verification">Needs Verification</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Items */}
      <div className="space-y-3">
        {filtered.map((item) => {
          const cfg = STATUS_CONFIG[item.status];
          const Icon = cfg.icon;
          return (
            <Card key={item.id} className="bg-[#FDFBF7]/70 border-[#B89555]/10 hover:border-[#B89555]/30 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 ${cfg.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-[#1A1A1A] font-medium">{item.title}</span>
                      <Badge className={cfg.badgeClass}>{cfg.label}</Badge>
                      <Badge className="bg-[#B89555]/10 text-[#5A4A2E] border-[#B89555]/20 text-[10px]">
                        {item.scope.replace('_', ' ')}
                      </Badge>
                    </div>
                    <p className="text-sm text-[#5A4A2E] mb-2">{item.requirement}</p>
                    {item.notes && (
                      <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1 mb-2">
                        Note: {item.notes}
                      </p>
                    )}
                    {item.evidence && item.evidence.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {item.evidence.map((e, i) => (
                          <span key={i} className="text-[10px] text-[#5A4A2E] bg-[#B89555]/5 border border-[#B89555]/10 px-2 py-0.5 rounded font-mono">
                            {e}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-[#5A4A2E]">
          No items match the current filters.
        </div>
      )}
    </div>
  );
}
