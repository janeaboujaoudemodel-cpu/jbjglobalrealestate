/**
 * Developer Moderation Queue — Owner-only dashboard
 * Aggregates pending submissions, activity feed, and risk flags.
 */

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Shield, AlertTriangle, FileCheck, Activity, Search,
  Clock, CheckCircle, XCircle, File, Upload, Copy,
  RefreshCw, Filter,
} from "lucide-react";
import { format } from "date-fns";

const DeveloperModerationQueue = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("pending");
  const [activityFilter, setActivityFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Pending project uploads
  const { data: pendingUploads } = useQuery({
    queryKey: ["mod-pending-uploads"],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from('developer_launch_uploads')
        .select('*')
        .eq('status', 'pending_review')
        .order('created_at', { ascending: false });
      return data || [];
    },
  });

  // Pending change requests
  const { data: pendingChanges } = useQuery({
    queryKey: ["mod-pending-changes"],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from('project_change_requests')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      return data || [];
    },
  });

  // Pending event/launch submissions
  const { data: pendingSubmissions } = useQuery({
    queryKey: ["mod-pending-submissions"],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from('developer_submissions')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      return data || [];
    },
  });

  // Activity log
  const { data: activityLogs } = useQuery({
    queryKey: ["mod-activity-log", activityFilter],
    queryFn: async () => {
      let query = (supabase as any)
        .from('developer_activity_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);
      if (activityFilter !== 'all') {
        query = query.eq('activity_type', activityFilter);
      }
      const { data } = await query;
      return data || [];
    },
  });

  // File validations with rejections
  const { data: fileRejections } = useQuery({
    queryKey: ["mod-file-rejections"],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from('developer_file_validations')
        .select('*')
        .eq('is_valid', false)
        .order('created_at', { ascending: false })
        .limit(100);
      return data || [];
    },
  });

  const totalPending = (pendingUploads?.length || 0) + (pendingChanges?.length || 0) + (pendingSubmissions?.length || 0);
  const riskItems = (activityLogs || []).filter((l: any) => l.risk_flags && l.risk_flags.length > 0);

  const critBadge = (type: string) => {
    const map: Record<string, string> = {
      upload: 'bg-blue-500/20 text-blue-400',
      edit: 'bg-amber-500/20 text-[#1A1A1A]',
      duplicate_attempt: 'bg-red-500/20 text-red-400',
      failed_upload: 'bg-red-500/20 text-red-400',
      file_rejected: 'bg-red-500/20 text-red-400',
      protected_field_attempt: 'bg-red-500/20 text-red-400',
      session_end: 'bg-muted text-muted-foreground',
      approval: 'bg-emerald-500/20 text-emerald-400',
    };
    return map[type] || 'bg-muted text-muted-foreground';
  };

  const filterActivity = (items: any[]) => {
    if (!searchQuery) return items;
    const q = searchQuery.toLowerCase();
    return items.filter((i: any) =>
      i.developer_name?.toLowerCase().includes(q) ||
      i.entity_name?.toLowerCase().includes(q) ||
      i.developer_email?.toLowerCase().includes(q)
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            Developer Moderation Queue
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Review submissions, monitor activity, and flag risks
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            queryClient.invalidateQueries({ queryKey: ["mod-pending-uploads"] });
            queryClient.invalidateQueries({ queryKey: ["mod-pending-changes"] });
            queryClient.invalidateQueries({ queryKey: ["mod-pending-submissions"] });
            queryClient.invalidateQueries({ queryKey: ["mod-activity-log"] });
            queryClient.invalidateQueries({ queryKey: ["mod-file-rejections"] });
          }}
        >
          <RefreshCw className="w-4 h-4 mr-1" /> Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-primary/20">
          <CardContent className="pt-4 pb-3 text-center">
            <Clock className="w-5 h-5 mx-auto mb-1 text-amber-500" />
            <p className="text-2xl font-bold text-foreground">{totalPending}</p>
            <p className="text-xs text-muted-foreground">Pending Review</p>
          </CardContent>
        </Card>
        <Card className="border-primary/20">
          <CardContent className="pt-4 pb-3 text-center">
            <Activity className="w-5 h-5 mx-auto mb-1 text-blue-500" />
            <p className="text-2xl font-bold text-foreground">{activityLogs?.length || 0}</p>
            <p className="text-xs text-muted-foreground">Activity Events</p>
          </CardContent>
        </Card>
        <Card className="border-primary/20">
          <CardContent className="pt-4 pb-3 text-center">
            <AlertTriangle className="w-5 h-5 mx-auto mb-1 text-red-500" />
            <p className="text-2xl font-bold text-foreground">{riskItems.length}</p>
            <p className="text-xs text-muted-foreground">Risk Flags</p>
          </CardContent>
        </Card>
        <Card className="border-primary/20">
          <CardContent className="pt-4 pb-3 text-center">
            <XCircle className="w-5 h-5 mx-auto mb-1 text-red-400" />
            <p className="text-2xl font-bold text-foreground">{fileRejections?.length || 0}</p>
            <p className="text-xs text-muted-foreground">Files Rejected</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pending" className="gap-1">
            <FileCheck className="w-4 h-4" /> Pending ({totalPending})
          </TabsTrigger>
          <TabsTrigger value="activity" className="gap-1">
            <Activity className="w-4 h-4" /> Activity Feed
          </TabsTrigger>
          <TabsTrigger value="risks" className="gap-1">
            <AlertTriangle className="w-4 h-4" /> Risk Flags ({riskItems.length})
          </TabsTrigger>
        </TabsList>

        {/* ── Pending Submissions ── */}
        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Pending Submissions</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="max-h-[600px]">
                {totalPending === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
                    <p>All submissions reviewed</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Developer</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Files</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(pendingUploads || []).map((item: any) => (
                        <TableRow key={`upload-${item.id}`}>
                          <TableCell><Badge variant="outline"><Upload className="w-3 h-3 mr-1" />Project</Badge></TableCell>
                          <TableCell className="text-sm">{item.developer_name}</TableCell>
                          <TableCell className="font-medium">{item.project_name}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              <File className="w-3 h-3 mr-1" />
                              {Array.isArray(item.uploaded_files) ? item.uploaded_files.length : 0}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {item.created_at ? format(new Date(item.created_at), 'MMM d, HH:mm') : '-'}
                          </TableCell>
                          <TableCell><Badge className="bg-amber-500/20 text-[#1A1A1A]">Pending</Badge></TableCell>
                        </TableRow>
                      ))}
                      {(pendingChanges || []).map((item: any) => (
                        <TableRow key={`change-${item.id}`}>
                          <TableCell><Badge variant="outline"><RefreshCw className="w-3 h-3 mr-1" />Change</Badge></TableCell>
                          <TableCell className="text-sm">{item.submitted_by_name || '-'}</TableCell>
                          <TableCell className="font-medium">{item.project_name || item.entity_name || '-'}</TableCell>
                          <TableCell>-</TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {item.created_at ? format(new Date(item.created_at), 'MMM d, HH:mm') : '-'}
                          </TableCell>
                          <TableCell><Badge className="bg-amber-500/20 text-[#1A1A1A]">Pending</Badge></TableCell>
                        </TableRow>
                      ))}
                      {(pendingSubmissions || []).map((item: any) => (
                        <TableRow key={`sub-${item.id}`}>
                          <TableCell>
                            <Badge variant="outline">
                              {item.submission_type === 'event_invitation' ? 'Event' : 'Launch'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">{item.developer_name}</TableCell>
                          <TableCell className="font-medium">{item.event_title || '-'}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              <File className="w-3 h-3 mr-1" />
                              {Array.isArray(item.event_files) ? item.event_files.length : 0}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {item.created_at ? format(new Date(item.created_at), 'MMM d, HH:mm') : '-'}
                          </TableCell>
                          <TableCell><Badge className="bg-amber-500/20 text-[#1A1A1A]">Pending</Badge></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Activity Feed ── */}
        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3 flex-wrap">
                <CardTitle className="text-lg">Developer Activity</CardTitle>
                <div className="flex items-center gap-2 ml-auto">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-2 top-2.5 text-muted-foreground" />
                    <Input
                      placeholder="Search developer..."
                      className="pl-8 h-9 w-48"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <Select value={activityFilter} onValueChange={setActivityFilter}>
                    <SelectTrigger className="w-40 h-9">
                      <Filter className="w-3 h-3 mr-1" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="upload">Uploads</SelectItem>
                      <SelectItem value="edit">Edits</SelectItem>
                      <SelectItem value="duplicate_attempt">Duplicates</SelectItem>
                      <SelectItem value="failed_upload">Failed Uploads</SelectItem>
                      <SelectItem value="file_rejected">File Rejected</SelectItem>
                      <SelectItem value="protected_field_attempt">Field Tampering</SelectItem>
                      <SelectItem value="session_end">Sessions</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="max-h-[600px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Developer</TableHead>
                      <TableHead>Entity</TableHead>
                      <TableHead>Flags</TableHead>
                      <TableHead>Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filterActivity(activityLogs || []).map((log: any) => (
                      <TableRow key={log.id}>
                        <TableCell>
                          <Badge className={critBadge(log.activity_type)}>
                            {log.activity_type?.replace(/_/g, ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          <div>{log.developer_name || '-'}</div>
                          <div className="text-xs text-muted-foreground">{log.developer_email}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{log.entity_name || '-'}</div>
                          <div className="text-xs text-muted-foreground">{log.entity_type}</div>
                        </TableCell>
                        <TableCell>
                          {log.risk_flags?.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {log.risk_flags.map((f: string, i: number) => (
                                <Badge key={i} variant="destructive" className="text-xs">
                                  {f.replace(/_/g, ' ')}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-xs">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {log.created_at ? format(new Date(log.created_at), 'MMM d, HH:mm') : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!activityLogs || activityLogs.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                          No activity recorded yet
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Risk Flags ── */}
        <TabsContent value="risks">
          <div className="space-y-4">
            {/* Flagged Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  Flagged Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="max-h-[300px]">
                  {riskItems.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground">
                      <CheckCircle className="w-6 h-6 mx-auto mb-2 text-emerald-500" />
                      No risk flags detected
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {riskItems.map((item: any) => (
                        <div key={item.id} className="flex items-center justify-between p-3 rounded-lg border border-destructive/20 bg-destructive/5">
                          <div>
                            <p className="text-sm font-medium">{item.developer_name || item.developer_email}</p>
                            <p className="text-xs text-muted-foreground">{item.activity_type} — {item.entity_name || item.entity_type}</p>
                          </div>
                          <div className="flex gap-1">
                            {item.risk_flags.map((f: string, i: number) => (
                              <Badge key={i} variant="destructive" className="text-xs">{f.replace(/_/g, ' ')}</Badge>
                            ))}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {item.created_at ? format(new Date(item.created_at), 'MMM d, HH:mm') : '-'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Rejected Files */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-red-400" />
                  Rejected File Uploads
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="max-h-[300px]">
                  {(!fileRejections || fileRejections.length === 0) ? (
                    <div className="text-center py-6 text-muted-foreground">No rejected files</div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>File</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Size</TableHead>
                          <TableHead>Reason</TableHead>
                          <TableHead>Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {fileRejections.map((r: any) => (
                          <TableRow key={r.id}>
                            <TableCell className="text-sm font-medium">{r.file_name}</TableCell>
                            <TableCell className="text-xs">{r.file_type || '-'}</TableCell>
                            <TableCell className="text-xs">{r.file_size_bytes ? `${(r.file_size_bytes / 1024 / 1024).toFixed(1)}MB` : '-'}</TableCell>
                            <TableCell className="text-xs text-red-400">{r.rejection_reason}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {r.created_at ? format(new Date(r.created_at), 'MMM d, HH:mm') : '-'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DeveloperModerationQueue;
