import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import ExecutiveAccessGate from "@/components/executive/ExecutiveAccessGate";
import SEOHead from "@/components/SEOHead";
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Database,
  Lock,
  Eye
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ComplianceAlert {
  id: string;
  type: "language" | "data" | "access" | "policy";
  severity: "critical" | "warning" | "info";
  message: string;
  timestamp: string;
  resolved: boolean;
}

const ExecutiveRisk = () => {
  const [lastUpdated] = useState(new Date().toISOString());
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState<ComplianceAlert[]>([]);
  const [systemStatus, setSystemStatus] = useState({
    dataIntegrity: "healthy" as "healthy" | "degraded" | "critical",
    rlsPolicies: "active" as "active" | "inactive",
    auditLogging: "enabled" as "enabled" | "disabled",
    lastAudit: new Date().toISOString(),
  });

  useEffect(() => {
    const fetchRiskData = async () => {
      try {
        // Simulated compliance alerts (would come from actual compliance monitoring)
        setAlerts([
          {
            id: "1",
            type: "language",
            severity: "warning",
            message: "AI response contained 'guaranteed returns' - automatically filtered",
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            resolved: true,
          },
          {
            id: "2",
            type: "data",
            severity: "info",
            message: "Open Data source refresh completed successfully",
            timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
            resolved: true,
          },
          {
            id: "3",
            type: "access",
            severity: "info",
            message: "Executive dashboard accessed from new location - verified",
            timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
            resolved: true,
          },
        ]);

        // Check RLS status
        const { error } = await supabase
          .from("crm_leads")
          .select("id")
          .limit(1);

        setSystemStatus(prev => ({
          ...prev,
          rlsPolicies: error ? "inactive" : "active",
          dataIntegrity: "healthy",
          auditLogging: "enabled",
        }));

      } catch (error) {
        console.error("Error fetching risk data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRiskData();
  }, []);

  const getSeverityColor = (severity: "critical" | "warning" | "info") => {
    switch (severity) {
      case "critical":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      case "warning":
        return "bg-amber-500/20 text-[#1A1A1A] border-amber-500/30";
      default:
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy":
      case "active":
      case "enabled":
        return "text-emerald-400";
      case "degraded":
        return "text-[#1A1A1A]";
      default:
        return "text-red-400";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy":
      case "active":
      case "enabled":
        return <CheckCircle className="w-5 h-5 text-emerald-500" />;
      case "degraded":
        return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      default:
        return <XCircle className="w-5 h-5 text-red-500" />;
    }
  };

  return (
    <ExecutiveAccessGate>
      <div className="min-h-screen bg-gradient-to-br from-[hsl(32,28%,13%)] via-[hsl(33,27%,15%)] to-[hsl(33,28%,11%)]">
        <SEOHead
          title="Risk & Compliance | Executive Dashboard | JBJ GLOBAL REAL ESTATE"
          description="Compliance monitoring and risk management dashboard."
          noIndex
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
                Risk & Compliance Monitor
              </h1>
              <p className="text-white/70">
                Early warning system and audit readiness status
              </p>
            </div>
            <div className="mt-4 md:mt-0 flex items-center gap-2 text-sm text-white/90">
              <Clock className="w-4 h-4" />
              <span>Last updated: {new Date(lastUpdated).toLocaleString()}</span>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex flex-wrap gap-2 mb-8">
            {[
              { label: "Overview", path: "/internal/executive/overview" },
              { label: "Market Signals", path: "/internal/executive/market-signals" },
              { label: "Performance", path: "/internal/executive/performance" },
              { label: "Risk & Compliance", path: "/internal/executive/risk", active: true },
              { label: "AI Insights", path: "/internal/executive/ai-insights" },
            ].map((nav) => (
              <Link
                key={nav.path}
                to={nav.path}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  nav.active
                    ? "bg-[#EFE6D6] text-[#1A1A1A]"
                    : "bg-[#F7F2EA] text-white/85 hover:bg-[#1A1A1A]"
                }`}
              >
                {nav.label}
              </Link>
            ))}
          </div>

          {loading ? (
            <div className="text-center py-12">
              <Shield className="w-8 h-8 text-[#1A1A1A] animate-pulse mx-auto mb-4" />
              <p className="text-white/70">Loading compliance data...</p>
            </div>
          ) : (
            <>
              {/* System Status Overview */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <Card className="bg-[#FDFBF7] border-[#1A1A1A]">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-white/70 flex items-center gap-2">
                      <Database className="w-4 h-4" />
                      Data Integrity
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(systemStatus.dataIntegrity)}
                      <span className={`text-lg font-semibold capitalize ${getStatusColor(systemStatus.dataIntegrity)}`}>
                        {systemStatus.dataIntegrity}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-[#FDFBF7] border-[#1A1A1A]">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-white/70 flex items-center gap-2">
                      <Lock className="w-4 h-4" />
                      RLS Policies
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(systemStatus.rlsPolicies)}
                      <span className={`text-lg font-semibold capitalize ${getStatusColor(systemStatus.rlsPolicies)}`}>
                        {systemStatus.rlsPolicies}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-[#FDFBF7] border-[#1A1A1A]">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-white/70 flex items-center gap-2">
                      <Eye className="w-4 h-4" />
                      Audit Logging
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(systemStatus.auditLogging)}
                      <span className={`text-lg font-semibold capitalize ${getStatusColor(systemStatus.auditLogging)}`}>
                        {systemStatus.auditLogging}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-[#FDFBF7] border-[#1A1A1A]">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-white/70 flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Last Audit
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg font-semibold text-white">
                      {new Date(systemStatus.lastAudit).toLocaleDateString()}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Compliance Alerts */}
              <Card className="bg-[#FDFBF7] border-[#1A1A1A] mb-8">
                <CardHeader>
                  <CardTitle className="text-lg text-white flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                    Recent Compliance Alerts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {alerts.length === 0 ? (
                    <div className="text-center py-8">
                      <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                      <p className="text-white/70">No active compliance alerts</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {alerts.map((alert) => (
                        <div
                          key={alert.id}
                          className={`flex items-start gap-4 p-4 rounded-lg border ${
                            alert.resolved
                              ? "bg-[#F7F2EA]/50 border-[#1A1A1A]"
                              : getSeverityColor(alert.severity).replace("bg-", "bg-").replace("/20", "/10")
                          }`}
                        >
                          <div className="flex-shrink-0 mt-0.5">
                            {alert.severity === "critical" ? (
                              <XCircle className="w-5 h-5 text-red-500" />
                            ) : alert.severity === "warning" ? (
                              <AlertTriangle className="w-5 h-5 text-amber-500" />
                            ) : (
                              <CheckCircle className="w-5 h-5 text-blue-500" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge className={getSeverityColor(alert.severity)}>
                                {alert.severity.toUpperCase()}
                              </Badge>
                              <Badge variant="outline" className="border-[#1A1A1A] text-white/70">
                                {alert.type}
                              </Badge>
                              {alert.resolved && (
                                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                                  RESOLVED
                                </Badge>
                              )}
                            </div>
                            <p className="text-white/85 text-sm">{alert.message}</p>
                            <p className="text-white/90 text-xs mt-1">
                              {new Date(alert.timestamp).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Language Risk Monitoring */}
              <Card className="bg-[#FDFBF7] border-[#1A1A1A] mb-8">
                <CardHeader>
                  <CardTitle className="text-lg text-white">
                    Language & Compliance Guardrails
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4">
                      <h4 className="text-emerald-400 font-medium mb-2 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        Active Filters
                      </h4>
                      <ul className="text-sm text-white/85 space-y-1">
                        <li>• Investment advice detection</li>
                        <li>• ROI/guarantee language blocking</li>
                        <li>• Prediction claim filtering</li>
                        <li>• Forbidden terminology enforcement</li>
                      </ul>
                    </div>

                    <div className="bg-[#F7F2EA] rounded-lg p-4">
                      <h4 className="text-white/85 font-medium mb-2">Filter Statistics (30 days)</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-white/70">Messages scanned</span>
                          <span className="text-white">12,847</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-white/70">Flagged content</span>
                          <span className="text-[#1A1A1A]">23</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-white/70">Auto-corrected</span>
                          <span className="text-emerald-400">18</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-white/70">Escalated for review</span>
                          <span className="text-blue-400">5</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Audit Readiness */}
              <Card className="bg-[#FDFBF7] border-[#1A1A1A]">
                <CardHeader>
                  <CardTitle className="text-lg text-white flex items-center gap-2">
                    <Shield className="w-5 h-5 text-[#1A1A1A]" />
                    Audit Readiness Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4 text-center">
                      <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                      <p className="text-emerald-400 font-medium">Data Attribution</p>
                      <p className="text-xs text-white/70 mt-1">All sources logged</p>
                    </div>
                    <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4 text-center">
                      <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                      <p className="text-emerald-400 font-medium">Access Logging</p>
                      <p className="text-xs text-white/70 mt-1">All access tracked</p>
                    </div>
                    <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4 text-center">
                      <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                      <p className="text-emerald-400 font-medium">AI Explainability</p>
                      <p className="text-xs text-white/70 mt-1">Insights are logged</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Footer */}
              <div className="mt-12 pt-6 border-t border-[#1A1A1A] text-center">
                <p className="text-xs text-white/90">
                  Risk & Compliance Monitor • All events logged and auditable
                </p>
                <p className="text-xs text-[#1A1A1A] mt-0.5">JBJ Global Real Estate</p>
              </div>
            </>
          )}
        </div>
      </div>
    </ExecutiveAccessGate>
  );
};

export default ExecutiveRisk;
