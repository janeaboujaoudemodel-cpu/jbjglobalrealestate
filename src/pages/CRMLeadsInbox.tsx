import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Search, ChevronLeft, ChevronRight, Phone, Mail, Plus, Filter, X,
  ExternalLink, MessageSquare, RefreshCw, Download, Calendar, StickyNote,
  Trash2, RotateCcw, ArchiveRestore,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { PIPELINE_STATUSES } from "@/components/crm/LeadStatusBadge";
import InlineStatusSelect from "@/components/crm/InlineStatusSelect";
import AddNoteDialog from "@/components/crm/AddNoteDialog";
import DeleteLeadDialog from "@/components/crm/DeleteLeadDialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import useCRMLeadsInbox, { SOURCE_OPTIONS } from "./useCRMLeadsInbox";

export default function CRMLeadsInbox() {
  const cx = useCRMLeadsInbox();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8]">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-black">Leads Inbox</h1>
            <p className="text-black/60 text-sm">
              {cx.totalLeads} lead{cx.totalLeads !== 1 ? "s" : ""} total
              {cx.hasActiveFilters && " (filtered)"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={cx.handleRefresh} disabled={cx.isFetching} className="text-black/60 hover:text-black hover:bg-gold/10">
              <RefreshCw className={`h-4 w-4 ${cx.isFetching ? "animate-spin" : ""}`} />
            </Button>
            <Button variant="secondary" size="sm" onClick={cx.handleExport}>
              <Download className="h-4 w-4 mr-2" />Export
            </Button>
            <Button variant="primary" onClick={() => cx.navigate("/crm?action=new-lead")}>
              <Plus className="h-4 w-4 mr-2" />New Lead
            </Button>
          </div>
        </div>

        {/* Active / Deleted Tabs */}
        <Tabs value={cx.activeView} onValueChange={(v) => { cx.setActiveView(v as "active" | "deleted"); cx.setPage(1); }} className="mb-6">
          <TabsList className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/30 p-1">
            <TabsTrigger value="active" className="tab-trigger-champagne text-black data-[state=active]:text-black px-6 py-2">All Leads</TabsTrigger>
            <TabsTrigger value="deleted" className="tab-trigger-champagne text-black data-[state=active]:text-black px-6 py-2">
              <Trash2 className="h-4 w-4 mr-2" />Recently Deleted
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Filters */}
        <Card className="border-2 border-gold/30 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col gap-3">
              <div className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-black/40" />
                  <Input placeholder="Search by name, email, or phone..." value={cx.search}
                    onChange={(e) => { cx.setSearch(e.target.value); cx.setPage(1); }}
                    className="pl-10 bg-white/80 border-2 border-gold/30 text-black placeholder:text-black/40 focus:border-gold" />
                </div>

                <Select value={cx.statusFilter} onValueChange={(v) => { cx.setStatusFilter(v); cx.setPage(1); }}>
                  <SelectTrigger className="w-full md:w-[200px] bg-white/80 border-2 border-gold/30 text-black">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/30 max-h-[400px]">
                    <SelectItem value="all" className="text-black hover:bg-gold/10 font-medium focus:bg-gold/15 focus:text-black">All Statuses</SelectItem>
                    {(["positive", "neutral", "negative"] as const).map((cat) => {
                      const colors = { positive: "emerald", neutral: "blue", negative: "red" };
                      const c = colors[cat];
                      return (
                        <div key={cat}>
                          <div className={`px-2 py-1.5 text-xs font-bold text-${c}-700 uppercase tracking-wide border-t border-gold/20 mt-1 flex items-center gap-2`}>
                            <span className={`w-2 h-2 rounded-full bg-${c}-500`} />{cat}
                          </div>
                          {PIPELINE_STATUSES.filter((s) => s.category === cat).map((opt) => (
                            <SelectItem key={opt.value} value={opt.value} className="text-black hover:bg-gold/10 pl-4 focus:bg-gold/15 focus:text-black">
                              <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full bg-${c}-500`} />{opt.label}
                              </div>
                            </SelectItem>
                          ))}
                        </div>
                      );
                    })}
                  </SelectContent>
                </Select>

                <Select value={cx.sourceFilter} onValueChange={(v) => { cx.setSourceFilter(v); cx.setPage(1); }}>
                  <SelectTrigger className="w-full md:w-[180px] bg-white/80 border-2 border-gold/30 text-black">
                    <SelectValue placeholder="Source" />
                  </SelectTrigger>
                  <SelectContent className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/30">
                    {SOURCE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value} className="text-black hover:bg-gold/10 focus:bg-gold/15 focus:text-black">{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col md:flex-row gap-3 items-center">
                <div className="flex items-center gap-2 text-sm text-black/60">
                  <Calendar className="h-4 w-4" /><span>Date range:</span>
                </div>
                <Input type="date" value={cx.dateStart} onChange={(e) => { cx.setDateStart(e.target.value); cx.setPage(1); }}
                  className="w-full md:w-[160px] bg-white/80 border-2 border-gold/30 text-black" />
                <span className="text-black/40">to</span>
                <Input type="date" value={cx.dateEnd} onChange={(e) => { cx.setDateEnd(e.target.value); cx.setPage(1); }}
                  className="w-full md:w-[160px] bg-white/80 border-2 border-gold/30 text-black" />
                {cx.hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={cx.clearFilters} className="text-black/60 hover:text-black hover:bg-gold/10 ml-auto">
                    <X className="h-4 w-4 mr-1" />Clear
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {cx.activeView === "deleted" && (
          <div className="mb-4 p-3 rounded-xl bg-amber-50 border-2 border-amber-200 text-amber-800 text-sm flex items-center gap-2">
            <ArchiveRestore className="h-4 w-4 shrink-0" />
            <span>Leads in this section will be permanently deleted after 30 days. You can restore them anytime before that.</span>
          </div>
        )}

        {/* Leads Table */}
        <Card className="border-2 border-gold/30 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3]">
          <CardContent className="p-0">
            {cx.isLoading ? (
              <div className="p-6 space-y-3">
                {Array.from({ length: 10 }).map((_, i) => (<Skeleton key={i} className="h-14 bg-gold/10" />))}
              </div>
            ) : cx.leads.length === 0 ? (
              <div className="text-center py-16">
                <Filter className="h-12 w-12 text-black/30 mx-auto mb-4" />
                <p className="text-black/60 mb-2">
                  {cx.activeView === "deleted" ? "No deleted leads" : cx.hasActiveFilters ? "No leads match your filters" : "No leads yet"}
                </p>
                {cx.hasActiveFilters && cx.activeView === "active" ? (
                  <Button variant="secondary" size="sm" onClick={cx.clearFilters}>Clear Filters</Button>
                ) : cx.activeView === "active" ? (
                  <Button variant="primary" onClick={() => cx.navigate("/crm?action=new-lead")} className="mt-2">Add First Lead</Button>
                ) : null}
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gold/20 hover:bg-transparent">
                        <TableHead className="text-black/70 font-bold">Name</TableHead>
                        <TableHead className="text-black/70 font-bold">Phone</TableHead>
                        <TableHead className="text-black/70 font-bold">Email</TableHead>
                        <TableHead className="text-black/70 font-bold">Source</TableHead>
                        <TableHead className="text-black/70 font-bold">Status</TableHead>
                        <TableHead className="text-black/70 font-bold">Created</TableHead>
                        <TableHead className="text-black/70 font-bold">{cx.activeView === "deleted" ? "Deleted" : "Last Activity"}</TableHead>
                        <TableHead className="text-black/70 font-bold text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cx.leads.map((lead) => (
                        <TableRow key={lead.id} className="border-gold/20 hover:bg-gold/5 cursor-pointer"
                          onClick={() => cx.activeView === "active" && cx.navigate(`/crm/leads/${lead.id}`)}>
                          <TableCell className="font-semibold text-black">
                            <div>
                              <p className="font-semibold">{lead.full_name}</p>
                              {lead.tags && lead.tags.length > 0 && (
                                <div className="flex gap-1 mt-1">
                                  {lead.tags.slice(0, 2).map((tag, i) => (
                                    <Badge key={i} variant="secondary" className="text-xs bg-gold/10 text-black/70 border-gold/20">{tag}</Badge>
                                  ))}
                                  {lead.tags.length > 2 && <span className="text-xs text-black/40">+{lead.tags.length - 2}</span>}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-black/70 text-sm font-mono">{lead.phone_e164 || "—"}</TableCell>
                          <TableCell className="text-black/70 text-sm truncate max-w-[180px]">{lead.email_lower || "—"}</TableCell>
                          <TableCell>
                            {lead.source ? (
                              <Badge variant="secondary" className="bg-gold/10 text-black/80 border-gold/20">{lead.source}</Badge>
                            ) : <span className="text-black/40">—</span>}
                          </TableCell>
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <InlineStatusSelect leadId={lead.id} currentStatus={lead.pipeline_stage || "new"} />
                          </TableCell>
                          <TableCell className="text-black/60 text-sm">{formatDistanceToNow(new Date(lead.created_at), { addSuffix: true })}</TableCell>
                          <TableCell className="text-black/60 text-sm">
                            {cx.activeView === "deleted" && lead.deleted_at
                              ? formatDistanceToNow(new Date(lead.deleted_at), { addSuffix: true })
                              : cx.getLastActivity(lead)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              {cx.activeView === "deleted" ? (
                                <>
                                  <Button variant="ghost" size="sm" className="h-8 px-3 text-emerald-700 hover:text-emerald-800 hover:bg-emerald-100"
                                    onClick={(e) => cx.handleRestore(lead.id, e)} title="Restore">
                                    <RotateCcw className="h-4 w-4 mr-1" />Restore
                                  </Button>
                                  <Button variant="ghost" size="sm" className="h-8 px-3 text-red-600 hover:text-red-700 hover:bg-red-100"
                                    onClick={(e) => cx.handlePermanentDelete(lead.id, e)} title="Delete Forever">
                                    <Trash2 className="h-4 w-4 mr-1" />Delete Forever
                                  </Button>
                                </>
                              ) : (
                                <>
                                  {lead.phone_e164 && (
                                    <>
                                      <Button variant="ghost" size="icon" className="h-8 w-8 text-green-700 hover:text-green-800 hover:bg-green-100"
                                        onClick={(e) => cx.openWhatsApp(lead.phone_e164!, e)} title="WhatsApp">
                                        <MessageSquare className="h-4 w-4" />
                                      </Button>
                                      <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-700 hover:text-blue-800 hover:bg-blue-100"
                                        onClick={(e) => cx.openCall(lead.phone_e164!, e)} title="Call">
                                        <Phone className="h-4 w-4" />
                                      </Button>
                                    </>
                                  )}
                                  {lead.email_lower && (
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-purple-700 hover:text-purple-800 hover:bg-purple-100"
                                      onClick={(e) => cx.openEmail(lead.email_lower!, e)} title="Email">
                                      <Mail className="h-4 w-4" />
                                    </Button>
                                  )}
                                  <AddNoteDialog leadId={lead.id} leadName={lead.full_name}
                                    trigger={
                                      <Button variant="ghost" size="icon" className="h-8 w-8 text-amber-700 hover:text-amber-800 hover:bg-amber-100" title="Add Note">
                                        <StickyNote className="h-4 w-4" />
                                      </Button>
                                    } />
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-100"
                                    onClick={(e) => { e.stopPropagation(); cx.setLeadToDelete(lead); cx.setDeleteDialogOpen(true); }} title="Delete">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="sm" className="h-8 px-2 text-gold hover:text-black hover:bg-gold/10"
                                    onClick={(e) => { e.stopPropagation(); cx.navigate(`/crm/leads/${lead.id}`); }} title="Open">
                                    Open<ExternalLink className="h-3 w-3 ml-1" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {cx.totalPages > 1 && (
                  <div className="flex items-center justify-between px-6 py-4 border-t border-gold/20">
                    <p className="text-sm text-black/60">Page {cx.page} of {cx.totalPages}</p>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => cx.setPage((p) => Math.max(1, p - 1))} disabled={cx.page === 1}
                        className="text-black/60 hover:text-black hover:bg-gold/10 disabled:opacity-50">
                        <ChevronLeft className="h-4 w-4 mr-1" />Previous
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => cx.setPage((p) => Math.min(cx.totalPages, p + 1))} disabled={cx.page === cx.totalPages}
                        className="text-black/60 hover:text-black hover:bg-gold/10 disabled:opacity-50">
                        Next<ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <DeleteLeadDialog open={cx.deleteDialogOpen} onOpenChange={cx.setDeleteDialogOpen}
        leadName={cx.leadToDelete?.full_name || "this lead"} onConfirm={cx.handleSoftDelete} />
    </div>
  );
}
