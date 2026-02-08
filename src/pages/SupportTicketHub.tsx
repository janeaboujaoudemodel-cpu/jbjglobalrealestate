import { useState } from "react";
import { format } from "date-fns";
import {
  Search,
  Filter,
  Ticket,
  AlertCircle,
  Clock,
  CheckCircle,
  RefreshCw,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
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
  const [filters, setFilters] = useState<TicketFilters>({
    status: "all",
    priority: "all",
    search: "",
  });
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  const { data: tickets, isLoading, refetch, isRefetching } = useSupportTickets(filters);

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
      <div className="border-b border-zinc-800 bg-zinc-900/50">
        <div className="max-w-[1600px] mx-auto px-6 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gold flex items-center gap-3">
                <Ticket className="w-7 h-7" />
                Support Ticket Hub
              </h1>
              <p className="text-zinc-400 text-sm mt-1">
                Manage and respond to customer support tickets
              </p>
            </div>
            <Button
              onClick={() => refetch()}
              disabled={isRefetching}
              variant="outline"
              className="border-gold/50 text-gold hover:bg-gold/10"
            >
              <RefreshCw className={cn("w-4 h-4 mr-2", isRefetching && "animate-spin")} />
              Refresh
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700">
              <p className="text-zinc-400 text-sm">Total Tickets</p>
              <p className="text-2xl font-bold text-white">{ticketCounts.total}</p>
            </div>
            <div className="bg-yellow-500/10 rounded-lg p-4 border border-yellow-500/20">
              <p className="text-yellow-400 text-sm">Open</p>
              <p className="text-2xl font-bold text-yellow-400">{ticketCounts.open}</p>
            </div>
            <div className="bg-blue-500/10 rounded-lg p-4 border border-blue-500/20">
              <p className="text-blue-400 text-sm">In Progress</p>
              <p className="text-2xl font-bold text-blue-400">{ticketCounts.inProgress}</p>
            </div>
            <div className="bg-green-500/10 rounded-lg p-4 border border-green-500/20">
              <p className="text-green-400 text-sm">Resolved</p>
              <p className="text-2xl font-bold text-green-400">{ticketCounts.resolved}</p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <Input
                value={filters.search}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search by ticket #, email, name, or subject..."
                className="pl-10 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-zinc-400" />
              <Select
                value={filters.status}
                onValueChange={(value) => setFilters((prev) => ({ ...prev, status: value }))}
              >
                <SelectTrigger className="w-[140px] bg-zinc-800 border-zinc-700 text-white">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filters.priority}
                onValueChange={(value) => setFilters((prev) => ({ ...prev, priority: value }))}
              >
                <SelectTrigger className="w-[140px] bg-zinc-800 border-zinc-700 text-white">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1600px] mx-auto px-6 py-6">
        <div className="flex gap-6">
          {/* Ticket List */}
          <div className="flex-1 min-w-0">
            <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 overflow-hidden">
              {isLoading ? (
                <div className="p-6 space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full bg-zinc-800" />
                  ))}
                </div>
              ) : tickets && tickets.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow className="border-zinc-800 hover:bg-transparent">
                      <TableHead className="text-gold">Ticket #</TableHead>
                      <TableHead className="text-gold">Customer</TableHead>
                      <TableHead className="text-gold">Subject</TableHead>
                      <TableHead className="text-gold">Category</TableHead>
                      <TableHead className="text-gold">Priority</TableHead>
                      <TableHead className="text-gold">Status</TableHead>
                      <TableHead className="text-gold">Created</TableHead>
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
                            "border-zinc-800 cursor-pointer transition-colors",
                            selectedTicketId === ticket.id
                              ? "bg-gold/10"
                              : "hover:bg-zinc-800/50"
                          )}
                        >
                          <TableCell className="font-mono text-gold font-semibold">
                            {ticket.ticket_number}
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="text-white font-medium truncate max-w-[150px]">
                                {ticket.full_name}
                              </p>
                              <p className="text-xs text-zinc-500 truncate max-w-[150px]">
                                {ticket.email}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="max-w-[200px]">
                            <p className="text-zinc-300 truncate">{ticket.subject}</p>
                          </TableCell>
                          <TableCell>
                            <span className="text-zinc-400 text-sm truncate block max-w-[120px]">
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
                          <TableCell className="text-zinc-400 text-sm">
                            {format(new Date(ticket.created_at), "MMM d, h:mm a")}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                <div className="p-12 text-center">
                  <Ticket className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
                  <p className="text-zinc-500">No tickets found</p>
                  <p className="text-zinc-600 text-sm mt-1">
                    Try adjusting your filters
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Detail Panel */}
          <div className="w-[500px] flex-shrink-0">
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
