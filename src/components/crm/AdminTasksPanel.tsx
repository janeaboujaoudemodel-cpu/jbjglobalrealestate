import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Plus, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Trash2,
  ListTodo,
  Calendar,
  Circle
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface AdminTask {
  id: string;
  title: string;
  description: string | null;
  category: string;
  priority: string;
  status: string;
  due_date: string | null;
  created_at: string;
  completed_at: string | null;
}

const PRIORITY_COLORS: Record<string, string> = {
  low: "bg-slate-500/20 text-slate-400 border-slate-500/30",
  medium: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  high: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  urgent: "bg-red-500/20 text-red-400 border-red-500/30",
};

const CATEGORY_COLORS: Record<string, string> = {
  general: "bg-[#B89555]/20 text-[#1A1A1A]/70 border-[#B89555]/30/30",
  integration: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  security: "bg-red-500/20 text-red-400 border-red-500/30",
  marketing: "bg-green-500/20 text-green-400 border-green-500/30",
  development: "bg-blue-500/20 text-blue-400 border-blue-500/30",
};

export function AdminTasksPanel() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tasks, setTasks] = useState<AdminTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    category: "general",
    priority: "medium",
    due_date: "",
  });

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    fetchTasks();
  }, [user]);

  const fetchTasks = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    setLoadError(null);

    try {
      const { data, error } = await supabase
        .from("admin_tasks")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching tasks:", error);
        setLoadError(error.message);
        toast.error(`Failed to load tasks: ${error.message}`);
        return;
      }

      setTasks(data || []);
    } catch (error: any) {
      console.error("Error fetching tasks:", error);
      setLoadError(error?.message || "Unknown error");
      toast.error(`Failed to load tasks: ${error?.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const addTask = async () => {
    if (!newTask.title.trim()) {
      toast.error("Please enter a task title");
      return;
    }

    try {
      const { error } = await supabase.from("admin_tasks").insert({
        user_id: user?.id,
        title: newTask.title,
        description: newTask.description || null,
        category: newTask.category,
        priority: newTask.priority,
        due_date: newTask.due_date || null,
      });

      if (error) throw error;

      toast.success("Task added successfully");
      setNewTask({ title: "", description: "", category: "general", priority: "medium", due_date: "" });
      setIsAddingTask(false);
      fetchTasks();
    } catch (error: any) {
      console.error("Error adding task:", error);
      toast.error(`Failed to add task: ${error?.message || 'Unknown error'}`);
    }
  };

  const toggleTaskStatus = async (task: AdminTask) => {
    const newStatus = task.status === "completed" ? "pending" : "completed";
    
    try {
      const { error } = await supabase
        .from("admin_tasks")
        .update({ 
          status: newStatus,
          completed_at: newStatus === "completed" ? new Date().toISOString() : null
        })
        .eq("id", task.id);

      if (error) throw error;
      
      toast.success(newStatus === "completed" ? "Task completed!" : "Task reopened");
      fetchTasks();
    } catch (error: any) {
      console.error("Error updating task:", error);
      toast.error(`Failed to update task: ${error?.message || 'Unknown error'}`);
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from("admin_tasks")
        .delete()
        .eq("id", taskId);

      if (error) throw error;
      
      toast.success("Task deleted");
      fetchTasks();
    } catch (error: any) {
      console.error("Error deleting task:", error);
      toast.error(`Failed to delete task: ${error?.message || 'Unknown error'}`);
    }
  };

  const pendingTasks = tasks.filter(t => t.status !== "completed");
  const completedTasks = tasks.filter(t => t.status === "completed");

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border border-[#B89555]/30 rounded-2xl p-6">
        <div className="flex items-center justify-center py-8">
          <Clock className="w-6 h-6 animate-spin text-[#1A1A1A]" />
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border border-[#B89555]/30 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-5 h-5 text-red-500" />
          <h3 className="font-semibold text-[#1A1A1A]">My Tasks</h3>
        </div>
        <div className="rounded-lg border border-red-300 bg-red-50 p-3">
          <p className="text-sm text-red-700 font-semibold">Failed to load tasks</p>
          <p className="text-xs text-red-600 mt-1">{loadError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border border-[#B89555]/30 rounded-2xl shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-[#B89555]/20">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-[#EFE6D6]/20">
            <ListTodo className="w-5 h-5 text-[#1A1A1A]" />
          </div>
          <div>
            <h3 className="font-semibold text-[#1A1A1A]">My Tasks</h3>
            {pendingTasks.length > 0 && (
              <p className="text-xs text-[#1A1A1A]/70">{pendingTasks.length} pending</p>
            )}
          </div>
        </div>
        
        <Dialog open={isAddingTask} onOpenChange={setIsAddingTask}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-gradient-to-r from-gold to-gold-dark text-[#1A1A1A] font-semibold hover:brightness-110 shadow-md shadow-gold/20">
              <Plus className="w-4 h-4 mr-1" />
              Add
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#FDFBF7] border-[#B89555]/30">
            <DialogHeader>
              <DialogTitle className="text-[#1A1A1A]">Add New Task</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <Input
                placeholder="Task title..."
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                className="border-[#B89555]/30 focus:border-[#B89555]"
              />
              <Textarea
                placeholder="Description (optional)..."
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                className="border-[#B89555]/30 focus:border-[#B89555]"
              />
              <div className="grid grid-cols-2 gap-4">
                <select
                  value={newTask.category}
                  onChange={(e) => setNewTask({ ...newTask, category: e.target.value })}
                  className="h-10 px-3 rounded-md border border-[#B89555]/30 bg-[#FDFBF7] text-[#1A1A1A] font-medium focus:outline-none focus:ring-2 focus:ring-gold/50"
                >
                  <option value="general">General</option>
                  <option value="integration">Integration</option>
                  <option value="security">Security</option>
                  <option value="marketing">Marketing</option>
                  <option value="development">Development</option>
                </select>
                
                <select
                  value={newTask.priority}
                  onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                  className="h-10 px-3 rounded-md border border-[#B89555]/30 bg-[#FDFBF7] text-[#1A1A1A] font-medium focus:outline-none focus:ring-2 focus:ring-gold/50"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <Input
                type="date"
                value={newTask.due_date}
                onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                className="border-[#B89555]/30 focus:border-[#B89555]"
              />
              <Button onClick={addTask} className="w-full bg-gradient-to-r from-gold to-gold-dark text-[#1A1A1A] font-semibold hover:brightness-110">
                Add Task
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      
      {/* Task List */}
      <div className="p-4 space-y-3 max-h-[400px] overflow-y-auto">
        {pendingTasks.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-[#EFE6D6]/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-6 h-6 text-[#1A1A1A]" />
            </div>
            <p className="text-[#1A1A1A]/70 text-sm">No pending tasks</p>
          </div>
        ) : (
          pendingTasks.map((task) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#FDFBF7] border border-[#B89555]/30 rounded-xl p-3 hover:border-[#B89555]/50 hover:shadow-md transition-all"
            >
              <div className="flex items-start gap-3">
                <button
                  onClick={() => toggleTaskStatus(task)}
                  className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full border-2 border-[#B89555]/50 hover:border-[#B89555] hover:bg-[#EFE6D6]/10 transition-all"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-[#1A1A1A] text-sm">{task.title}</p>
                  {task.description && (
                    <p className="text-xs text-[#1A1A1A]/70 mt-0.5 line-clamp-1">{task.description}</p>
                  )}
                  <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${CATEGORY_COLORS[task.category] || CATEGORY_COLORS.general}`}>
                      {task.category}
                    </Badge>
                    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${PRIORITY_COLORS[task.priority]}`}>
                      {task.priority}
                    </Badge>
                    {task.due_date && (
                      <span className="text-[10px] text-[#1A1A1A]/70 flex items-center gap-0.5">
                        <Calendar className="w-2.5 h-2.5" />
                        {format(new Date(task.due_date), "MMM d")}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => deleteTask(task.id)}
                  className="text-[#1A1A1A]/70 hover:text-red-500 transition-colors p-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          ))
        )}

        {/* Completed Tasks */}
        {completedTasks.length > 0 && (
          <div className="pt-3 border-t border-[#B89555]/20">
            <p className="text-xs text-[#1A1A1A]/70 mb-2 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-green-500" />
              Completed ({completedTasks.length})
            </p>
            {completedTasks.slice(0, 3).map((task) => (
              <div
                key={task.id}
                className="flex items-center gap-3 p-2 rounded-lg bg-[#F7F2EA] opacity-60 mb-2"
              >
                <button
                  onClick={() => toggleTaskStatus(task)}
                  className="w-4 h-4 rounded-full bg-[#EFE6D6] flex items-center justify-center"
                >
                  <CheckCircle2 className="w-3 h-3 text-[#1A1A1A]" />
                </button>
                <span className="line-through text-[#1A1A1A]/70 text-xs flex-1">{task.title}</span>
                <button
                  onClick={() => deleteTask(task.id)}
                  className="text-[#1A1A1A]/70 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
