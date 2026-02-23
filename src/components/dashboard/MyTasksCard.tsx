import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  ListChecks, Plus, Check, Clock, AlertCircle, ChevronRight, 
  Loader2, Trash2, RotateCcw, X 
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

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
}

const PRIORITY_STYLES: Record<string, string> = {
  high: "bg-red-500/15 text-red-600 border-red-500/30",
  medium: "bg-amber-500/15 text-amber-600 border-amber-500/30",
  low: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
};

const STATUS_ICON: Record<string, React.ReactNode> = {
  completed: <Check className="w-3.5 h-3.5 text-emerald-500" />,
  in_progress: <Clock className="w-3.5 h-3.5 text-amber-500" />,
  pending: <AlertCircle className="w-3.5 h-3.5 text-gold" />,
};

export default function MyTasksCard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [filter, setFilter] = useState<"all" | "pending" | "completed">("all");

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

  const addTask = useMutation({
    mutationFn: async (title: string) => {
      if (!user) throw new Error("Not logged in");
      const { error } = await supabase.from("admin_tasks").insert({
        user_id: user.id,
        title,
        status: "pending",
        priority: "medium",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-tasks"] });
      setNewTitle("");
      setShowAddForm(false);
      toast.success("Task added");
    },
    onError: () => toast.error("Failed to add task"),
  });

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
    },
  });

  const deleteTask = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("admin_tasks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-tasks"] });
      toast.success("Task deleted");
    },
  });

  const filtered = tasks.filter((t) => {
    if (filter === "pending") return t.status !== "completed";
    if (filter === "completed") return t.status === "completed";
    return true;
  });

  const pendingCount = tasks.filter((t) => t.status !== "completed").length;
  const completedCount = tasks.filter((t) => t.status === "completed").length;

  return (
    <Card className="border border-border bg-[linear-gradient(135deg,hsl(var(--pearl-1)),hsl(var(--pearl-2)),hsl(var(--pearl-3)))]">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base text-foreground flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/30 flex items-center justify-center">
              <ListChecks className="w-4 h-4 text-gold" />
            </div>
            My Tasks
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge className="bg-gold/10 text-gold border-gold/30 text-[10px]">
              {pendingCount} pending
            </Badge>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowAddForm(!showAddForm)}
              className="h-7 px-2 border-gold/30 text-gold hover:bg-gold/10 hover:text-gold"
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
              onClick={() => setFilter(f)}
              className={cn(
                "px-3 py-1 rounded-lg text-[10px] font-semibold uppercase tracking-wider transition-colors",
                filter === f
                  ? "bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] text-black border border-[#C8A766]/60"
                  : "text-black/50 hover:text-gold hover:bg-gold/5"
              )}
            >
              {f === "all" ? `All (${tasks.length})` : f === "pending" ? `Pending (${pendingCount})` : `Done (${completedCount})`}
            </button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Add task form */}
        {showAddForm && (
          <div className="flex gap-2 mb-3">
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="What needs to be done?"
              className="h-8 text-xs border-gold/30 bg-white/60 focus:border-gold"
              onKeyDown={(e) => {
                if (e.key === "Enter" && newTitle.trim()) addTask.mutate(newTitle.trim());
                if (e.key === "Escape") setShowAddForm(false);
              }}
              autoFocus
            />
            <Button
              size="sm"
              onClick={() => newTitle.trim() && addTask.mutate(newTitle.trim())}
              disabled={!newTitle.trim() || addTask.isPending}
              className="h-8 px-3 bg-gold hover:bg-gold/90 text-black text-xs"
            >
              {addTask.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : "Add"}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowAddForm(false)}
              className="h-8 px-2 text-black/50 hover:text-black"
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-5 h-5 text-gold animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-8">
            <ListChecks className="w-8 h-8 text-gold/30 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">
              {filter === "all" ? "No tasks yet. Click + to add one." : `No ${filter} tasks.`}
            </p>
          </div>
        ) : (
          <div className="space-y-1.5 max-h-[320px] overflow-y-auto pr-1">
            {filtered.map((task) => {
              const isCompleted = task.status === "completed";
              return (
                <div
                  key={task.id}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all group",
                    isCompleted ? "opacity-60" : "hover:bg-gold/5"
                  )}
                >
                  {/* Checkbox */}
                  <button
                    onClick={() => toggleComplete.mutate({ id: task.id, completed: !isCompleted })}
                    className={cn(
                      "w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors",
                      isCompleted
                        ? "bg-emerald-500 border-emerald-500"
                        : "border-gold/40 hover:border-gold"
                    )}
                  >
                    {isCompleted && <Check className="w-3 h-3 text-white" />}
                  </button>

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
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {isCompleted && (
                      <button
                        onClick={() => toggleComplete.mutate({ id: task.id, completed: false })}
                        className="w-6 h-6 rounded flex items-center justify-center hover:bg-gold/10 text-gold"
                        title="Reopen"
                      >
                        <RotateCcw className="w-3 h-3" />
                      </button>
                    )}
                    <button
                      onClick={() => deleteTask.mutate(task.id)}
                      className="w-6 h-6 rounded flex items-center justify-center hover:bg-red-500/10 text-red-500/60 hover:text-red-500"
                      title="Delete"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
