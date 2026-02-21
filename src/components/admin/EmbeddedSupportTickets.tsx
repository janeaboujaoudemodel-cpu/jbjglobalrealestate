import { useState, useEffect } from "react";
import { format } from "date-fns";
import {
  Search,
  Filter,
  Ticket,
  AlertCircle,
  Clock,
  CheckCircle,
  RefreshCw,
  Trash2,
  ArrowUpDown,
  X,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useSupportTickets, type TicketFilters } from "@/hooks/useSupportTickets";
import { useBulkUpdateTicketStatus, useBulkDeleteTickets } from "@/hooks/useBulkTicketActions";
import TicketDetailPanel from "@/components/support/TicketDetailPanel";
import { cn } from "@/lib/utils";

const priorityConfig: Record<string, { label: string; className: string; dotColor: string }> = {
  critical: { label: "Critical", className: "bg-red-500/20 text-red-600 border-red-500/30", dotColor: "bg-red-500" },
  high: { label: "High", className: "bg-orange-500/20 text-orange-600 border-orange-500/30", dotColor: "bg-orange-500" },
  normal: { label: "Normal", className: "bg-blue-500/20 text-blue-600 border-blue-500/30", dotColor: "bg-blue-500" },
  low: { label: "Low", className: "bg-green-500/20 text-green-600 border-green-500/30", dotColor: "bg-green-500" },
};

const statusConfig: Record<string, { label: string; className: string; icon: typeof CheckCircle }> = {
  open: { label: "Open", className: "bg-yellow-500/20 text-yellow-600", icon: AlertCircle },
  in_progress: { label: "In Progress", className: "bg-blue-500/20 text-blue-600", icon: Clock },
  resolved: { label: "Resolved", className: "bg-green-500/20 text-green-600", icon: CheckCircle },
};

export function EmbeddedSupportTickets() {
  const [filters, setFilters] = useState<TicketFilters>({
    status: "all",
    priority: "all",
    search: "",
  });
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [selectedTicketIds, setSelectedTicketIds] = useState<Set<string>>(new Set());
  const [sortAscending, setSortAscending] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const { data: tickets, isLoading, refetch, isRefetching, error } = useSupportTickets(filters);
  const bulkUpdate = useBulkUpdateTicketStatus();
  const bulkDelete = useBulkDeleteTickets();

  // Sort tickets by date
  const sortedTickets = tickets?.slice().sort((a, b) => {
    const dateA = new Date(a.created_at).getTime();
    const dateB = new Date(b.created_at).getTime();
    return sortAscending ? dateA - dateB : dateB - dateA;
  });

  // Clear selection when filters change
  useEffect(() => {
    setSelectedTicketIds(new Set());
  }, [filters]);

  const handleSearchChange = (value: string) => {
    setFilters((prev) => ({ ...prev, search: value }));
  };

  const handleSelectAll = () => {
    if (!sortedTickets) return;
    if (selectedTicketIds.size === sortedTickets.length) {
      setSelectedTicketIds(new Set());
    } else {
      setSelectedTicketIds(new Set(sortedTickets.map(t => t.id)));
    }
  };

  const handleSelectTicket = (ticketId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setSelectedTicketIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(ticketId)) {
        newSet.delete(ticketId);
      } else {
        newSet.add(ticketId);
      }
      return newSet;
    });
  };

  const handleBulkStatusChange = (status: string) => {
    bulkUpdate.mutate(
      { ticketIds: Array.from(selectedTicketIds), status },
      { onSuccess: () => setSelectedTicketIds(new Set()) }
    );
  };

  const handleBulkDelete = () => {
    bulkDelete.mutate(
      Array.from(selectedTicketIds),
      { 
        onSuccess: () => {
          setSelectedTicketIds(new Set());
          setShowDeleteDialog(false);
          if (selectedTicketIds.has(selectedTicketId || '')) {
            setSelectedTicketId(null);
          }
        }
      }
    );
  };

  const ticketCounts = {
    total: tickets?.length || 0,
    open: tickets?.filter((t) => t.status === "open").length || 0,
    inProgress: tickets?.filter((t) => t.status === "in_progress").length || 0,
    resolved: tickets?.filter((t) => t.status === "resolved").length || 0,
    reopened: tickets?.filter((t) => t.is_reopened).length || 0,
  };

  const isAllSelected = sortedTickets && sortedTickets.length > 0 && selectedTicketIds.size === sortedTickets.length;
  const isSomeSelected = selectedTicketIds.size > 0;

  return (
    <div className="space-y-6">
      {/* Stats - Make all cards clickable */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card 
          className="bg-white border-2 border-gold/30 cursor-pointer hover:border-gold/60 active:scale-95 transition-all"
          onClick={() => setFilters(prev => ({ ...prev, status: "all" }))}
        >
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-500 text-xs">Total Tickets</p>
                <p className="text-2xl font-bold text-black">{ticketCounts.total}</p>
              </div>
              <div className="w-10 h-10 bg-gold/10 rounded-lg flex items-center justify-center">
                <Ticket className="w-5 h-5 text-gold" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card 
          className="bg-white border-2 border-yellow-500/30 cursor-pointer hover:border-yellow-500/60 active:scale-95 transition-all"
          onClick={() => setFilters(prev => ({ ...prev, status: "open" }))}
        >
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-500 text-xs">Open</p>
                <p className="text-2xl font-bold text-yellow-600">{ticketCounts.open}</p>
              </div>
              <div className="w-10 h-10 bg-yellow-500/10 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-yellow-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card 
          className="bg-white border-2 border-blue-500/30 cursor-pointer hover:border-blue-500/60 active:scale-95 transition-all"
          onClick={() => setFilters(prev => ({ ...prev, status: "in_progress" }))}
        >
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-500 text-xs">In Progress</p>
                <p className="text-2xl font-bold text-blue-600">{ticketCounts.inProgress}</p>
              </div>
              <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card 
          className="bg-white border-2 border-green-500/30 cursor-pointer hover:border-green-500/60 active:scale-95 transition-all"
          onClick={() => setFilters(prev => ({ ...prev, status: "resolved" }))}
        >
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-500 text-xs">Resolved</p>
                <p className="text-2xl font-bold text-green-600">{ticketCounts.resolved}</p>
              </div>
              <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        {/* Reopened Tickets Card - Always visible */}
        <Card 
          className="bg-white border-2 border-orange-500/30 cursor-pointer hover:border-orange-500/60 active:scale-95 transition-all"
          onClick={() => setFilters(prev => ({ ...prev, status: "reopened" }))}
        >
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-500 text-xs">Reopened</p>
                <p className="text-2xl font-bold text-orange-600">{ticketCounts.reopened}</p>
              </div>
              <div className="w-10 h-10 bg-orange-500/10 rounded-lg flex items-center justify-center">
                <RotateCcw className="w-5 h-5 text-orange-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-white border-2 border-gold/30">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gold/70" />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search by ticket #, email, name, or subject..."
                className="w-full h-10 pl-10 pr-4 rounded-lg bg-white border-2 border-gold/30 text-black placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold transition-all"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gold/70" />
              <Select
                value={filters.status}
                onValueChange={(value) => setFilters((prev) => ({ ...prev, status: value }))}
              >
                <SelectTrigger className="w-[140px] h-10 border-2 border-gold/30">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="reopened">Reopened</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filters.priority}
                onValueChange={(value) => setFilters((prev) => ({ ...prev, priority: value }))}
              >
                <SelectTrigger className="w-[140px] h-10 border-2 border-gold/30">
                  <SelectValue placeholder="All Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>

              <Button
                onClick={() => refetch()}
                disabled={isRefetching}
                size="sm"
                variant="secondary"
              >
                <RefreshCw className={cn("w-4 h-4", isRefetching && "animate-spin")} />
              </Button>
            </div>
          </div>

          {/* Bulk Actions Bar */}
          {isSomeSelected && (
            <div className="mt-4 flex items-center gap-3 p-3 bg-gold/10 border border-gold/30 rounded-lg">
              <span className="text-gold font-medium text-sm">{selectedTicketIds.size} selected</span>
              <div className="h-4 w-px bg-gold/30" />
              <Button
                size="sm"
                onClick={() => handleBulkStatusChange("in_progress")}
                disabled={bulkUpdate.isPending}
                className="bg-blue-600 hover:bg-blue-700 text-white h-7 text-xs"
              >
                <Clock className="w-3 h-3 mr-1" />
                In Progress
              </Button>
              <Button
                size="sm"
                onClick={() => handleBulkStatusChange("resolved")}
                disabled={bulkUpdate.isPending}
                className="bg-green-600 hover:bg-green-700 text-white h-7 text-xs"
              >
                <CheckCircle className="w-3 h-3 mr-1" />
                Resolved
              </Button>
              <Button
                size="sm"
                onClick={() => setShowDeleteDialog(true)}
                disabled={bulkDelete.isPending}
                className="bg-red-600 hover:bg-red-700 text-white h-7 text-xs"
              >
                <Trash2 className="w-3 h-3 mr-1" />
                Delete
              </Button>
              <Button
                size="sm"
                onClick={() => setSelectedTicketIds(new Set())}
                className="bg-red-600 hover:bg-red-700 text-white h-7 text-xs"
              >
                <X className="w-3 h-3 mr-1" />
                Clear Selection
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main Content */}
      <div className="flex gap-6 min-h-[500px]">
        {/* Ticket List */}
        <div className="flex-1 min-w-0">
          <Card className="bg-white border-2 border-gold/30 h-full">
            {isLoading ? (
              <CardContent className="p-6 space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full bg-zinc-200" />
                ))}
              </CardContent>
            ) : error ? (
              <CardContent className="p-12 text-center">
                <AlertCircle className="w-12 h-12 text-red-400/50 mx-auto mb-3" />
                <p className="text-red-600 font-medium">Failed to load tickets</p>
                <Button
                  onClick={() => refetch()}
                  className="mt-4 bg-gold text-black hover:bg-gold/90"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Retry
                </Button>
              </CardContent>
            ) : sortedTickets && sortedTickets.length > 0 ? (
              <div className="overflow-auto max-h-[600px]">
                <Table>
                  <TableHeader>
                    <TableRow className="border-gold/20 hover:bg-transparent">
                      <TableHead className="w-12">
                        <Checkbox
                          checked={isAllSelected}
                          onCheckedChange={handleSelectAll}
                          className="border-gold/50"
                        />
                      </TableHead>
                      <TableHead className="text-gold font-semibold text-xs">Ticket #</TableHead>
                      <TableHead className="text-gold font-semibold text-xs">Customer</TableHead>
                      <TableHead className="text-gold font-semibold text-xs">Subject</TableHead>
                      <TableHead className="text-gold font-semibold text-xs">Priority</TableHead>
                      <TableHead className="text-gold font-semibold text-xs">Status</TableHead>
                      <TableHead className="text-gold font-semibold text-xs">
                        <button
                          onClick={() => setSortAscending(!sortAscending)}
                          className="flex items-center gap-1 hover:text-black transition-colors"
                        >
                          Created
                          <ArrowUpDown className="w-3 h-3" />
                        </button>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedTickets.map((ticket) => {
                      const priority = priorityConfig[ticket.priority] || priorityConfig.normal;
                      const status = statusConfig[ticket.status] || statusConfig.open;
                      const StatusIcon = status.icon;
                      const isSelected = selectedTicketIds.has(ticket.id);

                      return (
                        <TableRow
                          key={ticket.id}
                          onClick={() => setSelectedTicketId(ticket.id)}
                          className={cn(
                            "border-gold/10 cursor-pointer transition-all duration-200",
                            selectedTicketId === ticket.id
                              ? "bg-gold/15 border-l-4 border-l-gold"
                              : isSelected
                              ? "bg-gold/10"
                              : "hover:bg-gold/5"
                          )}
                        >
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => {}}
                              onClick={(e) => handleSelectTicket(ticket.id, e as any)}
                              className="border-gold/50"
                            />
                          </TableCell>
                          <TableCell className="font-mono text-xs font-semibold text-black">
                            {ticket.ticket_number}
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium text-black text-xs truncate max-w-[150px]">
                                {ticket.full_name}
                              </p>
                              <p className="text-zinc-500 text-[10px] truncate max-w-[150px]">
                                {ticket.email}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="max-w-[200px]">
                            <p className="truncate text-black text-xs">
                              {ticket.subject}
                            </p>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              <Badge className={cn("text-[10px] px-1.5", priority.className)}>
                                <span className={cn("w-1.5 h-1.5 rounded-full mr-1", priority.dotColor)} />
                                {priority.label}
                              </Badge>
                              {ticket.is_reopened && (
                                <Badge className="bg-orange-500/20 text-orange-600 border-orange-500/30 text-[10px] px-1.5">
                                  🔄 Reopened
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={cn("text-[10px] px-1.5", status.className)}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {status.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-zinc-500 text-xs">
                            {format(new Date(ticket.created_at), "MMM d, HH:mm")}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <CardContent className="p-12 text-center">
                <Ticket className="w-12 h-12 text-zinc-300 mx-auto mb-3" />
                <p className="text-zinc-500 font-medium">No tickets found</p>
                <p className="text-zinc-400 text-sm mt-1">
                  Try adjusting your filters
                </p>
              </CardContent>
            )}
          </Card>
        </div>

        {/* Detail Panel */}
        {selectedTicketId && (
          <div className="w-[450px] flex-shrink-0">
            <TicketDetailPanel
              ticketId={selectedTicketId}
              onClose={() => setSelectedTicketId(null)}
            />
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedTicketIds.size} ticket(s)?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The selected tickets and all their messages will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
