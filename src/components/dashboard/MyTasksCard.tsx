import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ListChecks, Plus, Check, Clock, AlertCircle, ChevronRight, 
  Loader2, Trash2, RotateCcw, X, CheckCheck, Square, CheckSquare,
  Phone, Link2, Paperclip,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import TaskCreationModal from "./TaskCreationModal";

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string | null;
  priority: string | null;
  category: string | null;
  due_date: string | null;
  completed_at: string | null;
  created_at: string;
  client_contact?: string | null;
  reference_url?: string | null;
  attachments?: any[] | null;
}

const PRIORITY_STYLES: Record<string, string> = {
  high: "bg-red-500/15 text-red-600 border-red-500/30",
  medium: "bg-amber-500/15 text-amber-600 border-amber-500/30",
  low: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
};

export default function MyTasksCard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [showAddForm, setShowAddForm] = useState(false);
  const [showCreationModal, setShowCreationModal] = useState(false);
  const [filter, setFilter] = useState<"all" | "pending" | "completed">("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectionMode, setSelectionMode] = useState(false);

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["my-tasks", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("admin_tasks")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as Task[];
    },
    enabled: !!user,
  });

  const filtered = useMemo(() => tasks.filter((t) => {
    if (filter === "pending") return t.status !== "completed";
    if (filter === "completed") return t.status === "completed";
    return true;
  }), [tasks, filter]);

  const pendingCount = tasks.filter((t) => t.status !== "completed").length;
  const completedCount = tasks.filter((t) => t.status === "completed").length;

  // addTask mutation kept for potential quick-add but main flow uses modal now

  const toggleComplete = useMutation({
    mutationFn: async ({ id, completed }: { id: string; completed: boolean }) => {
      const { error } = await supabase
        .from("admin_tasks")
        .update({
          status: completed ? "completed" : "pending",
          completed_at: completed ? new Date().toISOString() : null,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["user-alert-counts"] });
    },
  });

  const bulkComplete = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase
        .from("admin_tasks")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
        })
        .in("id", ids);
      if (error) throw error;
    },
    onSuccess: (_, ids) => {
      queryClient.invalidateQueries({ queryKey: ["my-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["user-alert-counts"] });
      setSelectedIds(new Set());
      setSelectionMode(false);
      toast.success(`${ids.length} task${ids.length > 1 ? 's' : ''} completed`);
    },
    onError: () => toast.error("Failed to complete tasks"),
  });

  const bulkReopen = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase
        .from("admin_tasks")
        .update({
          status: "pending",
          completed_at: null,
        })
        .in("id", ids);
      if (error) throw error;
    },
    onSuccess: (_, ids) => {
      queryClient.invalidateQueries({ queryKey: ["my-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["user-alert-counts"] });
      setSelectedIds(new Set());
      setSelectionMode(false);
      toast.success(`${ids.length} task${ids.length > 1 ? 's' : ''} reopened`);
    },
    onError: () => toast.error("Failed to reopen tasks"),
  });

  const deleteTask = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("admin_tasks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["user-alert-counts"] });
      toast.success("Task deleted");
    },
  });

  const bulkDelete = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.from("admin_tasks").delete().in("id", ids);
      if (error) throw error;
    },
    onSuccess: (_, ids) => {
      queryClient.invalidateQueries({ queryKey: ["my-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["user-alert-counts"] });
      setSelectedIds(new Set());
      setSelectionMode(false);
      toast.success(`${ids.length} task${ids.length > 1 ? 's' : ''} deleted`);
    },
    onError: () => toast.error("Failed to delete tasks"),
  });

  const toggleSelect = (id: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map(t => t.id)));
    }
  };

  const exitSelection = () => {
    setSelectionMode(false);
    setSelectedIds(new Set());
  };
  const getTaskRoute = (task: Task): string | null => {
    const cat = (task.category || "").toLowerCase();
    const titleLower = (task.title || "").toLowerCase();
    if (cat === "cv" || cat === "career" || cat === "hr" || titleLower.includes("review cv") || titleLower.includes("cv ")) {
      return "/hr-dashboard?tab=cv-center";
    }
    if (cat === "support" || cat === "ticket") return "/my-tickets";
    if (cat === "listing" || cat === "listings") return "/listing-portal/my-listings";
    return null;
  };

  const handleTaskClick = (task: Task) => {
    if (selectionMode) return;
    const route = getTaskRoute(task);
    if (route) navigate(route);
  };


  return (
    <Card className="border border-border bg-[linear-gradient(135deg,hsl(var(--pearl-1)),hsl(var(--pearl-2)),hsl(var(--pearl-3)))]">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base text-foreground flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#EFE6D6]/10 border border-[#B89555]/30 flex items-center justify-center">
              <ListChecks className="w-4 h-4 text-[#1A1A1A]" />
            </div>
            My Tasks
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge className="bg-[#EFE6D6]/10 text-[#1A1A1A] border-[#B89555]/30 text-[10px]">
              {pendingCount} pending
            </Badge>
            {/* Toggle selection mode */}
            <Button
              size="sm"
              variant="outline"
              onClick={() => selectionMode ? exitSelection() : setSelectionMode(true)}
              className={cn(
                "h-7 px-2 text-[10px]",
                selectionMode
                  ? "border-[#B89555] bg-[#EFE6D6]/10 text-[#1A1A1A]"
                  : "border-[#B89555]/30 text-[#1A1A1A] hover:bg-[#EFE6D6]/10 hover:text-[#1A1A1A]"
              )}
              title={selectionMode ? "Exit selection" : "Select tasks"}
            >
              {selectionMode ? <X className="w-3.5 h-3.5" /> : <CheckSquare className="w-3.5 h-3.5" />}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowCreationModal(true)}
              className="h-7 px-2 border-[#B89555]/30 text-[#1A1A1A] hover:bg-[#EFE6D6]/10 hover:text-[#1A1A1A]"
            >
              <Plus className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 mt-2">
          {(["all", "pending", "completed"] as const).map((f) => (
            <button
              key={f}
              onClick={() => { setFilter(f); setSelectedIds(new Set()); }}
              className={cn(
                "px-3 py-1 rounded-lg text-[10px] font-semibold uppercase tracking-wider transition-colors",
                filter === f
                  ? "bg-gradient-to-br from-[#F7F1E6] via-[#ECE2D2] to-[#D8C7A6] text-[#1A1A1A] border border-[#B89555]/60"
                  : "text-[#1A1A1A]/50 hover:text-[#1A1A1A] hover:bg-[#EFE6D6]/5"
              )}
            >
              {f === "all" ? `All (${tasks.length})` : f === "pending" ? `Pending (${pendingCount})` : `Completed (${completedCount})`}
            </button>
          ))}
        </div>

        {/* Bulk action bar */}
        {selectionMode && (
          <div className="flex items-center gap-2 mt-2 px-2 py-2 rounded-xl bg-[#EFE6D6]/5 border border-[#B89555]/20">
            <button
              onClick={selectAll}
              className="flex items-center gap-1.5 text-[10px] font-semibold text-[#1A1A1A] hover:text-[#1A1A1A] transition-colors"
            >
              {selectedIds.size === filtered.length && filtered.length > 0
                ? <CheckSquare className="w-3.5 h-3.5" />
                : <Square className="w-3.5 h-3.5" />
              }
              {selectedIds.size === filtered.length && filtered.length > 0 ? "Deselect All" : "Select All"}
            </button>
            
            {selectedIds.size > 0 && (
              <>
                <div className="w-[1px] h-4 bg-[#EFE6D6]/30" />
                <span className="text-[10px] text-[#1A1A1A] font-medium">{selectedIds.size} selected</span>
                <div className="w-[1px] h-4 bg-[#EFE6D6]/30" />
                
                {/* Show Mark Complete only if any selected task is pending */}
                {[...selectedIds].some(id => tasks.find(t => t.id === id)?.status !== "completed") && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const ids = [...selectedIds].filter(id => tasks.find(t => t.id === id)?.status !== "completed");
                      if (ids.length) bulkComplete.mutate(ids);
                    }}
                    disabled={bulkComplete.isPending}
                    className="h-6 px-2 text-[10px] border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10"
                  >
                    {bulkComplete.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCheck className="w-3 h-3 mr-1" />}
                    Mark Complete
                  </Button>
                )}
                
                {/* Show Bulk Restore if any selected task is completed */}
                {[...selectedIds].some(id => tasks.find(t => t.id === id)?.status === "completed") && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const ids = [...selectedIds].filter(id => tasks.find(t => t.id === id)?.status === "completed");
                      if (ids.length) bulkReopen.mutate(ids);
                    }}
                    disabled={bulkReopen.isPending}
                    className="h-6 px-2 text-[10px] border-[#B89555]/30 text-[#1A1A1A] hover:bg-[#EFE6D6]/10"
                  >
                    {bulkReopen.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <RotateCcw className="w-3 h-3 mr-1" />}
                    Bulk Restore
                  </Button>
                )}
                
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => bulkDelete.mutate([...selectedIds])}
                  disabled={bulkDelete.isPending}
                  className="h-6 px-2 text-[10px] border-red-500/30 text-red-500 hover:bg-red-500/10 ml-auto"
                >
                  {bulkDelete.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3 mr-1" />}
                  Delete
                </Button>
              </>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent className="pt-0">
        {/* Task Creation Modal */}
        <TaskCreationModal open={showCreationModal} onOpenChange={setShowCreationModal} />

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-5 h-5 text-[#1A1A1A] animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-8">
            <ListChecks className="w-8 h-8 text-[#1A1A1A]/70 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">
              {filter === "all" ? "No tasks yet. Click + to add one." : filter === "completed" ? "No completed tasks yet." : "No pending tasks."}
            </p>
          </div>
        ) : (
          <div className="space-y-1.5 max-h-[320px] overflow-y-auto pr-1">
            {filtered.map((task) => {
              const isCompleted = task.status === "completed";
              const isSelected = selectedIds.has(task.id);
              return (
                <div
                  key={task.id}
                  onClick={(e) => { 
                    if (selectionMode) { toggleSelect(task.id, e); }
                    else { handleTaskClick(task); }
                  }}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all group",
                    (selectionMode || getTaskRoute(task)) && "cursor-pointer",
                    isSelected && "bg-[#EFE6D6]/10 ring-1 ring-gold/40",
                    isCompleted && !isSelected ? "opacity-60" : "hover:bg-[#EFE6D6]/5"
                  )}
                >
                  {/* Selection checkbox OR completion checkbox */}
                  {selectionMode ? (
                    <button
                      type="button"
                      onClick={(e) => toggleSelect(task.id, e)}
                      className={cn(
                        "w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors",
                        isSelected
                          ? "bg-[#EFE6D6] border-[#B89555]"
                          : "border-[#B89555]/40 hover:border-[#B89555]"
                      )}
                    >
                      {isSelected && <Check className="w-3 h-3 text-white" />}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); toggleComplete.mutate({ id: task.id, completed: !isCompleted }); }}
                      className={cn(
                        "w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors",
                        isCompleted
                          ? "bg-emerald-500 border-emerald-500"
                          : "border-[#B89555]/40 hover:border-[#B89555]"
                      )}
                    >
                      {isCompleted && <Check className="w-3 h-3 text-white" />}
                    </button>
                  )}

                  {/* Task info */}
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "text-sm font-medium truncate",
                      isCompleted ? "line-through text-muted-foreground" : "text-foreground"
                    )}>
                      {task.title}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {task.priority && (
                        <Badge className={cn("text-[9px] px-1.5 py-0", PRIORITY_STYLES[task.priority] || "bg-muted text-muted-foreground")}>
                          {task.priority}
                        </Badge>
                      )}
                      {task.due_date && (
                        <span className="text-[10px] text-muted-foreground">
                          Due {new Date(task.due_date).toLocaleDateString()}
                        </span>
                      )}
                      {isCompleted && task.completed_at && (
                        <span className="text-[10px] text-emerald-500/70">
                          ✓ {new Date(task.completed_at).toLocaleDateString()}
                        </span>
                      )}
                      {/* Indicator icons for contact/url/attachments */}
                      {task.client_contact && <Phone className="w-3 h-3 text-[#1A1A1A]/70" />}
                      {task.reference_url && <Link2 className="w-3 h-3 text-[#1A1A1A]/70" />}
                      {task.attachments && Array.isArray(task.attachments) && task.attachments.length > 0 && <Paperclip className="w-3 h-3 text-[#1A1A1A]/70" />}
                    </div>
                  </div>

                  {/* Actions - only show outside selection mode */}
                  {!selectionMode && (
                    <div className="flex items-center gap-1.5 shrink-0">
                      {getTaskRoute(task) && (
                        <ChevronRight className="w-4 h-4 text-[#1A1A1A]/70 group-hover:text-[#1A1A1A] transition-colors" />
                      )}
                      <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      {isCompleted && (
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleComplete.mutate({ id: task.id, completed: false }); }}
                          className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#EFE6D6]/10 hover:bg-[#EFE6D6]/20 text-[#1A1A1A] border border-[#B89555]/30 transition-colors"
                          title="Reopen task"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteTask.mutate(task.id); }}
                        className="w-8 h-8 rounded-lg flex items-center justify-center bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/30 transition-colors"
                        title="Delete task"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
