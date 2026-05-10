import { motion } from "framer-motion";
import { Database, Lock, ArrowLeft, RefreshCw, CheckCircle, AlertTriangle, Clock, FileText } from "lucide-react";
import { Link, Navigate } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { OPEN_DATA_SOURCES } from "@/config/open-data-config";

const DataOperations = () => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Generate audit log entries
  const auditLogs = [
    { timestamp: '2026-01-17 09:00:00', action: 'DATA_REFRESH', source: 'Dubai Pulse', status: 'success', records: 45000 },
    { timestamp: '2026-01-16 09:00:00', action: 'DATA_REFRESH', source: 'Dubai Statistics Center', status: 'success', records: 12000 },
    { timestamp: '2026-01-15 09:00:00', action: 'DATA_REFRESH', source: 'Dubai Land Department', status: 'success', records: 8500 },
    { timestamp: '2026-01-14 09:00:00', action: 'DATA_VALIDATION', source: 'All Sources', status: 'success', records: 0 },
    { timestamp: '2026-01-13 09:00:00', action: 'DATA_REFRESH', source: 'Dubai Pulse', status: 'warning', records: 44800 },
    { timestamp: '2026-01-12 09:00:00', action: 'INDEX_REBUILD', source: 'Market Intelligence', status: 'success', records: 0 },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Success</Badge>;
      case 'warning':
        return <Badge className="bg-amber-500/20 text-[#1A1A1A] border-amber-500/30">Warning</Badge>;
      case 'error':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Error</Badge>;
      default:
        return <Badge className="bg-[#B89555]/20 text-[#1A1A1A]/70 border-[#B89555]/30">Unknown</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(32,28%,13%)] via-[hsl(33,27%,15%)] to-[hsl(33,28%,11%)]">
      <SEOHead 
        title="Data Operations | JBJ Global Real Estate"
        description="Internal data operations and audit center for JBJ team members."
        canonicalPath="/internal/market-intelligence/data-ops"
      />

      {/* Internal Warning Banner */}
      <div className="bg-amber-500/10 border-b border-amber-500/30 py-3">
        <div className="container mx-auto px-4 flex items-center justify-center gap-3">
          <Lock className="w-4 h-4 text-[#1A1A1A]" />
          <span className="text-[#1A1A1A] text-sm font-medium">INTERNAL USE ONLY — Data Operations & Audit</span>
        </div>
      </div>

      {/* Header */}
      <section className="py-12 border-b border-[#1A1A1A]">
        <div className="container mx-auto px-4">
          <Link to="/internal/market-intelligence/dashboard" className="inline-flex items-center gap-2 text-[#1A1A1A] hover:text-[#1A1A1A]-light mb-6">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#EFE6D6]/10 border border-[#B89555]/30 flex items-center justify-center">
              <Database className="w-6 h-6 text-[#1A1A1A]" />
            </div>
            <div>
              <h1 className="text-white text-3xl font-bold">
                Data Operations & Audit
              </h1>
              <p className="text-white/90">Dataset management, refresh logs, and compliance audit</p>
            </div>
          </div>
        </div>
      </section>

      {/* Data Source Status */}
      <section className="py-12 border-b border-[#1A1A1A]">
        <div className="container mx-auto px-4">
          <h2 className="text-white text-xl font-bold mb-6">Data Source Status</h2>
          
          <div className="grid md:grid-cols-3 gap-4">
            {OPEN_DATA_SOURCES.map((source) => (
              <Card key={source.id} className="bg-[#FDFBF7]/50 border-[#1A1A1A]">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white text-lg">{source.name}</CardTitle>
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-white/90">Provider</span>
                      <span className="text-white/85">{source.provider}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-white/90">Update Frequency</span>
                      <span className="text-white/85 capitalize">{source.updateFrequency}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-white/90">Last Updated</span>
                      <span className="text-emerald-400">{source.lastUpdated}</span>
                    </div>
                    <div className="pt-2 border-t border-[#1A1A1A]">
                      <p className="text-[#1A1A1A]/70 text-xs">Data Types</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {source.dataTypes.map((type) => (
                          <span key={type} className="text-xs bg-[#F7F2EA] text-white/70 px-2 py-0.5 rounded">
                            {type}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Audit Log */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <h2 className="text-white text-xl font-bold mb-6">Recent Audit Log</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#1A1A1A]">
                  <th className="text-left text-white/90 text-sm py-3 px-4">Timestamp</th>
                  <th className="text-left text-white/90 text-sm py-3 px-4">Action</th>
                  <th className="text-left text-white/90 text-sm py-3 px-4">Source</th>
                  <th className="text-center text-white/90 text-sm py-3 px-4">Status</th>
                  <th className="text-right text-white/90 text-sm py-3 px-4">Records</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((log, index) => (
                  <tr key={index} className="border-b border-[#1A1A1A] hover:bg-[#1A1A1A]/50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-[#1A1A1A]/70" />
                        <span className="text-white/70 text-sm font-mono">{log.timestamp}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-white font-medium">{log.action}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-white/70">{log.source}</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {getStatusBadge(log.status)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="text-white/70">{log.records > 0 ? log.records.toLocaleString() : '-'}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Compliance Notes */}
      <section className="py-12 border-t border-[#1A1A1A]">
        <div className="container mx-auto px-4">
          <Card className="bg-[#FDFBF7]/50 border-[#1A1A1A] max-w-3xl mx-auto">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-3">
                <FileText className="w-5 h-5 text-[#1A1A1A]" />
                Compliance Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-white/70 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  All data sourced from official government Open Data portals
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  No scraping, no private platforms, no third-party proprietary data
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  All outputs are aggregated insights, not raw data republication
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  AI explanations are descriptive only, no price predictions
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  Clear disclaimers on all public-facing content
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default DataOperations;
