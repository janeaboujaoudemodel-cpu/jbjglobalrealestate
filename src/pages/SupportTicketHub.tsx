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
  ChevronDown,
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
import { useSupportTickets, type TicketFilters } from "@/hooks/useSupportTickets";
import TicketDetailPanel from "@/components/support/TicketDetailPanel";
import { cn } from "@/lib/utils";

const priorityConfig: Record<string, { label: string; className: string }> = {
  critical: { label: "Critical", className: "bg-red-500/20 text-red-400 border-red-500/30" },
  high: { label: "High", className: "bg-orange-500/20 text-orange-400 border-orange-500/30" },
  normal: { label: "Normal", className: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  low: { label: "Low", className: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30" },
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

  const { data: tickets, isLoading, refetch, isRefetching, error } = useSupportTickets(filters);

  // Debug logging for ticket synchronization
  useEffect(() => {
    if (tickets) {
      console.log(`[SupportTicketHub] Loaded ${tickets.length} tickets`);
    }
    if (error) {
      console.error("[SupportTicketHub] Error loading tickets:", error);
    }
  }, [tickets, error]);

  const handleSearchChange = (value: string) => {
    setFilters((prev) => ({ ...prev, search: value }));
  };

  const ticketCounts = {
    total: tickets?.length || 0,
    open: tickets?.filter((t) => t.status === "open").length || 0,
    inProgress: tickets?.filter((t) => t.status === "in_progress").length || 0,
    resolved: tickets?.filter((t) => t.status === "resolved").length || 0,
  };

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
                  Support Ticket Hub
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
          <div className="grid grid-cols-4 gap-4 mb-6">
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
          </div>

          {/* Filters - Using inline styles for proper dark theme */}
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
                <SelectTrigger className="w-[160px] h-10 bg-zinc-800 border-gold/30 text-white hover:bg-zinc-700 focus:ring-gold/50">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-gold/40 text-white">
                  <SelectItem value="all" className="text-white hover:bg-gold/20 hover:text-gold focus:bg-gold/20 focus:text-gold">All Status</SelectItem>
                  <SelectItem value="open" className="text-white hover:bg-gold/20 hover:text-gold focus:bg-gold/20 focus:text-gold">Open</SelectItem>
                  <SelectItem value="in_progress" className="text-white hover:bg-gold/20 hover:text-gold focus:bg-gold/20 focus:text-gold">In Progress</SelectItem>
                  <SelectItem value="resolved" className="text-white hover:bg-gold/20 hover:text-gold focus:bg-gold/20 focus:text-gold">Resolved</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filters.priority}
                onValueChange={(value) => setFilters((prev) => ({ ...prev, priority: value }))}
              >
                <SelectTrigger className="w-[160px] h-10 bg-zinc-800 border-gold/30 text-white hover:bg-zinc-700 focus:ring-gold/50">
                  <SelectValue placeholder="All Priority" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-gold/40 text-white">
                  <SelectItem value="all" className="text-white hover:bg-gold/20 hover:text-gold focus:bg-gold/20 focus:text-gold">All Priority</SelectItem>
                  <SelectItem value="critical" className="text-white hover:bg-gold/20 hover:text-gold focus:bg-gold/20 focus:text-gold">Critical</SelectItem>
                  <SelectItem value="high" className="text-white hover:bg-gold/20 hover:text-gold focus:bg-gold/20 focus:text-gold">High</SelectItem>
                  <SelectItem value="normal" className="text-white hover:bg-gold/20 hover:text-gold focus:bg-gold/20 focus:text-gold">Normal</SelectItem>
                  <SelectItem value="low" className="text-white hover:bg-gold/20 hover:text-gold focus:bg-gold/20 focus:text-gold">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
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
              ) : tickets && tickets.length > 0 ? (
                <div className="flex-1 overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gold/20 hover:bg-transparent">
                        <TableHead className="text-gold font-semibold">Ticket #</TableHead>
                        <TableHead className="text-gold font-semibold">Customer</TableHead>
                        <TableHead className="text-gold font-semibold">Subject</TableHead>
                        <TableHead className="text-gold font-semibold">Category</TableHead>
                        <TableHead className="text-gold font-semibold">Priority</TableHead>
                        <TableHead className="text-gold font-semibold">Status</TableHead>
                        <TableHead className="text-gold font-semibold">Created</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tickets.map((ticket) => {
                        const priority = priorityConfig[ticket.priority] || priorityConfig.normal;
                        const status = statusConfig[ticket.status] || statusConfig.open;
                        const StatusIcon = status.icon;

                        return (
                          <TableRow
                            key={ticket.id}
                            onClick={() => setSelectedTicketId(ticket.id)}
                            className={cn(
                              "border-gold/10 cursor-pointer transition-all duration-200",
                              selectedTicketId === ticket.id
                                ? "bg-gold/15 border-l-4 border-l-gold"
                                : "hover:bg-zinc-800/50"
                            )}
                          >
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
                              <Badge className={cn("border text-xs", priority.className)}>
                                {priority.label}
                              </Badge>
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
    </div>
  );
};

export default SupportTicketHub;
