import { useState, useEffect } from "react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Filter,
  Ticket,
  AlertCircle,
  Clock,
  CheckCircle,
  RefreshCw,
  ArrowLeft,
  Trash2,
  CheckSquare,
  Square,
  ArrowUpDown,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  critical: { label: "Critical", className: "bg-red-500/20 text-red-400 border-red-500/30", dotColor: "bg-red-500" },
  high: { label: "High", className: "bg-orange-500/20 text-orange-400 border-orange-500/30", dotColor: "bg-orange-500" },
  normal: { label: "Normal", className: "bg-blue-500/20 text-blue-400 border-blue-500/30", dotColor: "bg-blue-500" },
  low: { label: "Low", className: "bg-green-500/20 text-green-400 border-green-500/30", dotColor: "bg-green-500" },
};

const statusConfig: Record<string, { label: string; className: string; icon: typeof CheckCircle }> = {
  open: { label: "Open", className: "bg-yellow-500/20 text-yellow-400", icon: AlertCircle },
  in_progress: { label: "In Progress", className: "bg-blue-500/20 text-blue-400", icon: Clock },
  resolved: { label: "Resolved", className: "bg-green-500/20 text-green-400", icon: CheckCircle },
};

const SupportTicketHub = () => {
  const navigate = useNavigate();
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

  // Debug logging for ticket synchronization
  useEffect(() => {
    if (tickets) {
      console.log(`[SupportTicketHub] Loaded ${tickets.length} tickets`);
    }
    if (error) {
      console.error("[SupportTicketHub] Error loading tickets:", error);
    }
  }, [tickets, error]);

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
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-gold/20 bg-gradient-to-b from-zinc-900 to-black">
        <div className="max-w-[1600px] mx-auto px-6 py-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Button
                onClick={() => navigate(-1)}
                className="bg-gold/20 border border-gold/50 text-gold hover:bg-gold/30"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gold flex items-center gap-3">
                  <Ticket className="w-7 h-7" />
                  Ticket Support Hub
                </h1>
                <p className="text-zinc-400 text-sm mt-1">
                  Manage and respond to customer support tickets
                </p>
              </div>
            </div>
            <Button
              onClick={() => refetch()}
              disabled={isRefetching}
              className="bg-gold/20 border border-gold/50 text-gold hover:bg-gold/30"
            >
              <RefreshCw className={cn("w-4 h-4 mr-2", isRefetching && "animate-spin")} />
              Refresh
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 lg:grid-cols-5 gap-4 mb-6">
            <div className="bg-gradient-to-br from-zinc-800/80 to-zinc-900/80 rounded-xl p-4 border border-gold/30 shadow-[0_0_20px_rgba(200,167,102,0.1)]">
              <p className="text-zinc-300 text-sm font-medium">Total Tickets</p>
              <p className="text-3xl font-bold text-white">{ticketCounts.total}</p>
            </div>
            <div className="bg-gradient-to-br from-yellow-900/30 to-yellow-950/50 rounded-xl p-4 border border-yellow-500/30 shadow-[0_0_20px_rgba(234,179,8,0.1)]">
              <p className="text-yellow-300 text-sm font-medium">Open</p>
              <p className="text-3xl font-bold text-yellow-400">{ticketCounts.open}</p>
            </div>
            <div className="bg-gradient-to-br from-blue-900/30 to-blue-950/50 rounded-xl p-4 border border-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.1)]">
              <p className="text-blue-300 text-sm font-medium">In Progress</p>
              <p className="text-3xl font-bold text-blue-400">{ticketCounts.inProgress}</p>
            </div>
            <div className="bg-gradient-to-br from-green-900/30 to-green-950/50 rounded-xl p-4 border border-green-500/30 shadow-[0_0_20px_rgba(34,197,94,0.1)]">
              <p className="text-green-300 text-sm font-medium">Resolved</p>
              <p className="text-3xl font-bold text-green-400">{ticketCounts.resolved}</p>
            </div>
            {/* Reopened Tickets Card */}
            {ticketCounts.reopened > 0 && (
              <div className="bg-gradient-to-br from-orange-900/30 to-orange-950/50 rounded-xl p-4 border border-orange-500/30 shadow-[0_0_20px_rgba(249,115,22,0.1)]">
                <div className="flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 text-orange-400" />
                  <p className="text-orange-300 text-sm font-medium">Reopened</p>
                </div>
                <p className="text-3xl font-bold text-orange-400">{ticketCounts.reopened}</p>
              </div>
            )}
          </div>

          {/* Filters */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gold/70" />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search by ticket #, email, name, or subject..."
                className="w-full h-10 pl-10 pr-4 rounded-lg bg-zinc-800 border border-gold/30 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold transition-all"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gold/70" />
              <Select
                value={filters.status}
                onValueChange={(value) => setFilters((prev) => ({ ...prev, status: value }))}
              >
                <SelectTrigger className="w-[180px] h-10">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="open">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-yellow-500" />
                      Open
                    </span>
                  </SelectItem>
                  <SelectItem value="in_progress">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                      In Progress
                    </span>
                  </SelectItem>
                  <SelectItem value="resolved">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-green-500" />
                      Resolved
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filters.priority}
                onValueChange={(value) => setFilters((prev) => ({ ...prev, priority: value }))}
              >
                <SelectTrigger className="w-[180px] h-10">
                  <SelectValue placeholder="All Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="critical">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-red-500" />
                      <span className="text-red-400">Critical</span>
                    </span>
                  </SelectItem>
                  <SelectItem value="high">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-orange-500" />
                      <span className="text-orange-400">High</span>
                    </span>
                  </SelectItem>
                  <SelectItem value="normal">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                      <span className="text-blue-400">Normal</span>
                    </span>
                  </SelectItem>
                  <SelectItem value="low">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-zinc-500" />
                      <span className="text-zinc-400">Low</span>
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Bulk Actions Bar */}
          {isSomeSelected && (
            <div className="mt-4 flex items-center gap-3 p-3 bg-gold/10 border border-gold/30 rounded-lg">
              <span className="text-gold font-medium">{selectedTicketIds.size} selected</span>
              <div className="h-4 w-px bg-gold/30" />
              <Button
                size="sm"
                onClick={() => handleBulkStatusChange("in_progress")}
                disabled={bulkUpdate.isPending}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Clock className="w-3 h-3 mr-1" />
                Mark In Progress
              </Button>
              <Button
                size="sm"
                onClick={() => handleBulkStatusChange("resolved")}
                disabled={bulkUpdate.isPending}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <CheckCircle className="w-3 h-3 mr-1" />
                Mark Resolved
              </Button>
              <Button
                size="sm"
                onClick={() => setShowDeleteDialog(true)}
                disabled={bulkDelete.isPending}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                <Trash2 className="w-3 h-3 mr-1" />
                Delete
              </Button>
              <Button
                size="sm"
                onClick={() => setSelectedTicketIds(new Set())}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Clear Selection
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1600px] mx-auto px-6 py-6">
        <div className="flex gap-6 min-h-[calc(100vh-380px)]">
          {/* Ticket List */}
          <div className="flex-1 min-w-0 flex flex-col">
            <div className="bg-gradient-to-b from-zinc-900/80 to-zinc-950/80 rounded-xl border border-gold/20 overflow-hidden shadow-[0_0_30px_rgba(200,167,102,0.05)] flex-1 flex flex-col">
              {isLoading ? (
                <div className="p-6 space-y-4 flex-1">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full bg-zinc-800" />
                  ))}
                </div>
              ) : error ? (
                <div className="p-12 text-center flex-1 flex flex-col items-center justify-center min-h-[400px]">
                  <AlertCircle className="w-12 h-12 text-red-400/50 mx-auto mb-3" />
                  <p className="text-red-400 font-medium">Failed to load tickets</p>
                  <p className="text-zinc-500 text-sm mt-1">
                    {error instanceof Error ? error.message : "Please try again"}
                  </p>
                  <Button
                    onClick={() => refetch()}
                    className="mt-4 bg-gold/20 border border-gold/50 text-gold hover:bg-gold/30"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Retry
                  </Button>
                </div>
              ) : sortedTickets && sortedTickets.length > 0 ? (
                <div className="flex-1 overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gold/20 hover:bg-transparent">
                        <TableHead className="w-12">
                          <Checkbox
                            checked={isAllSelected}
                            onCheckedChange={handleSelectAll}
                            className="border-gold/50 data-[state=checked]:bg-gold data-[state=checked]:border-gold"
                          />
                        </TableHead>
                        <TableHead className="text-gold font-semibold">Ticket #</TableHead>
                        <TableHead className="text-gold font-semibold">Customer</TableHead>
                        <TableHead className="text-gold font-semibold">Subject</TableHead>
                        <TableHead className="text-gold font-semibold">Category</TableHead>
                        <TableHead className="text-gold font-semibold">Priority</TableHead>
                        <TableHead className="text-gold font-semibold">Status</TableHead>
                        <TableHead className="text-gold font-semibold">
                          <button
                            onClick={() => setSortAscending(!sortAscending)}
                            className="flex items-center gap-1 hover:text-white transition-colors"
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
                                : "hover:bg-zinc-800/50"
                            )}
                          >
                            <TableCell onClick={(e) => e.stopPropagation()}>
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={() => {
                                  setSelectedTicketIds(prev => {
                                    const newSet = new Set(prev);
                                    if (newSet.has(ticket.id)) {
                                      newSet.delete(ticket.id);
                                    } else {
                                      newSet.add(ticket.id);
                                    }
                                    return newSet;
                                  });
                                }}
                                className="border-gold/50 data-[state=checked]:bg-gold data-[state=checked]:border-gold"
                              />
                            </TableCell>
                            <TableCell className="font-mono text-gold font-bold">
                              {ticket.ticket_number}
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="text-white font-medium truncate max-w-[150px]">
                                  {ticket.full_name}
                                </p>
                                <p className="text-xs text-zinc-400 truncate max-w-[150px]">
                                  {ticket.email}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell className="max-w-[200px]">
                              <p className="text-white truncate">{ticket.subject}</p>
                            </TableCell>
                            <TableCell>
                              <span className="text-zinc-300 text-sm truncate block max-w-[120px]">
                                {ticket.service_category}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1.5">
                                <Badge className={cn("border text-xs", priority.className)}>
                                  {priority.label}
                                </Badge>
                                {ticket.is_reopened && (
                                  <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 text-xs">
                                    🔄 Reopened
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={cn("flex items-center gap-1 w-fit text-xs", status.className)}>
                                <StatusIcon className="w-3 h-3" />
                                {status.label}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-zinc-300 text-sm">
                              {format(new Date(ticket.created_at), "MMM d, h:mm a")}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="p-12 text-center flex-1 flex flex-col items-center justify-center min-h-[400px]">
                  <Ticket className="w-12 h-12 text-gold/30 mx-auto mb-3" />
                  <p className="text-zinc-400 font-medium">No tickets found</p>
                  <p className="text-zinc-500 text-sm mt-1">
                    Try adjusting your filters or check back later
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Detail Panel */}
          <div className="w-[500px] flex-shrink-0 flex">
            <TicketDetailPanel
              ticketId={selectedTicketId}
              onClose={() => setSelectedTicketId(null)}
            />
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-zinc-900 border-gold/30">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete {selectedTicketIds.size} Ticket{selectedTicketIds.size > 1 ? 's' : ''}?</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              This action cannot be undone. All selected tickets and their messages will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={bulkDelete.isPending}
            >
              {bulkDelete.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SupportTicketHub;
