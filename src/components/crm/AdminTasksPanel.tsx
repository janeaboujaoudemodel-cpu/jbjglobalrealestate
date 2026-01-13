import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Calendar
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
  low: "bg-slate-500/20 text-slate-400",
  medium: "bg-blue-500/20 text-blue-400",
  high: "bg-orange-500/20 text-orange-400",
  urgent: "bg-red-500/20 text-red-400",
};

const CATEGORY_COLORS: Record<string, string> = {
  general: "bg-gray-500/20 text-gray-400",
  integration: "bg-purple-500/20 text-purple-400",
  security: "bg-red-500/20 text-red-400",
  marketing: "bg-green-500/20 text-green-400",
  development: "bg-blue-500/20 text-blue-400",
};

export function AdminTasksPanel() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<AdminTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    category: "general",
    priority: "medium",
    due_date: "",
  });

  useEffect(() => {
    if (user) {
      fetchTasks();
    }
  }, [user]);

  const fetchTasks = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    
    try {
      // Fetch ALL tasks for current user (both pending and completed)
      const { data, error } = await supabase
        .from("admin_tasks")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching tasks:", error);
        toast.error(`Failed to load tasks: ${error.message}`);
        // Still try to show any data we have
        setTasks([]);
      } else {
        setTasks(data || []);
      }
    } catch (error: any) {
      console.error("Error fetching tasks:", error);
      toast.error(`Failed to load tasks: ${error.message || 'Unknown error'}`);
      setTasks([]);
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
      <Card className="bg-black/40 border-white/10">
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <Clock className="w-6 h-6 animate-spin text-gold" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-black/40 border-white/10">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-white">
          <ListTodo className="w-5 h-5 text-gold" />
          My Tasks
          {pendingTasks.length > 0 && (
            <Badge className="bg-gold/20 text-gold ml-2">
              {pendingTasks.length} pending
            </Badge>
          )}
        </CardTitle>
        
        <Dialog open={isAddingTask} onOpenChange={setIsAddingTask}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-gold hover:bg-gold/90 text-black">
              <Plus className="w-4 h-4 mr-1" />
              Add Task
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-black/95 border-white/10">
            <DialogHeader>
              <DialogTitle className="text-white">Add New Task</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <Input
                placeholder="Task title..."
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                className="bg-white/5 border-white/10 text-white"
              />
              <Textarea
                placeholder="Description (optional)..."
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                className="bg-white/5 border-white/10 text-white"
              />
              <div className="grid grid-cols-2 gap-4">
                {/* Native select for Category */}
                <select
                  value={newTask.category}
                  onChange={(e) => setNewTask({ ...newTask, category: e.target.value })}
                  className="h-10 px-3 rounded-md border border-zinc-700 bg-zinc-950 text-white font-medium focus:outline-none focus:ring-2 focus:ring-gold/50"
                  style={{ backgroundColor: '#09090b', color: '#ffffff' }}
                >
                  <option value="general" style={{ backgroundColor: '#09090b', color: '#ffffff' }}>General</option>
                  <option value="integration" style={{ backgroundColor: '#09090b', color: '#ffffff' }}>Integration</option>
                  <option value="security" style={{ backgroundColor: '#09090b', color: '#ffffff' }}>Security</option>
                  <option value="marketing" style={{ backgroundColor: '#09090b', color: '#ffffff' }}>Marketing</option>
                  <option value="development" style={{ backgroundColor: '#09090b', color: '#ffffff' }}>Development</option>
                </select>
                
                {/* Native select for Priority */}
                <select
                  value={newTask.priority}
                  onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                  className="h-10 px-3 rounded-md border border-zinc-700 bg-zinc-950 text-white font-medium focus:outline-none focus:ring-2 focus:ring-gold/50"
                  style={{ backgroundColor: '#09090b', color: '#ffffff' }}
                >
                  <option value="low" style={{ backgroundColor: '#09090b', color: '#ffffff' }}>Low</option>
                  <option value="medium" style={{ backgroundColor: '#09090b', color: '#ffffff' }}>Medium</option>
                  <option value="high" style={{ backgroundColor: '#09090b', color: '#ffffff' }}>High</option>
                  <option value="urgent" style={{ backgroundColor: '#09090b', color: '#ffffff' }}>Urgent</option>
                </select>
              </div>
              <Input
                type="date"
                value={newTask.due_date}
                onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                className="bg-white/5 border-white/10 text-white"
              />
              <Button onClick={addTask} className="w-full bg-gold hover:bg-gold/90 text-black">
                Add Task
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Pending Tasks */}
        {pendingTasks.length === 0 ? (
          <div className="text-center py-8 text-white/40">
            <CheckCircle2 className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No pending tasks</p>
          </div>
        ) : (
          <div className="space-y-2">
            {pendingTasks.map((task) => (
              <div
                key={task.id}
                className="flex items-start gap-3 p-3 rounded-lg bg-white/5 border border-white/10 hover:border-gold/30 transition-colors"
              >
                <Checkbox
                  checked={task.status === "completed"}
                  onCheckedChange={() => toggleTaskStatus(task)}
                  className="mt-1 border-gold data-[state=checked]:bg-gold"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-white">{task.title}</span>
                    <Badge className={CATEGORY_COLORS[task.category] || CATEGORY_COLORS.general}>
                      {task.category}
                    </Badge>
                    <Badge className={PRIORITY_COLORS[task.priority]}>
                      {task.priority}
                    </Badge>
                  </div>
                  {task.description && (
                    <p className="text-sm text-white/60 mt-1">{task.description}</p>
                  )}
                  {task.due_date && (
                    <div className="flex items-center gap-1 mt-2 text-xs text-white/40">
                      <Calendar className="w-3 h-3" />
                      Due: {format(new Date(task.due_date), "MMM d, yyyy")}
                    </div>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteTask(task.id)}
                  className="text-white/40 hover:text-red-400 hover:bg-red-500/10"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Completed Tasks */}
        {completedTasks.length > 0 && (
          <div className="pt-4 border-t border-white/10">
            <p className="text-sm text-white/40 mb-2">Completed ({completedTasks.length})</p>
            <div className="space-y-2">
              {completedTasks.slice(0, 5).map((task) => (
                <div
                  key={task.id}
                  className="flex items-center gap-3 p-2 rounded-lg bg-white/5 opacity-60"
                >
                  <Checkbox
                    checked={true}
                    onCheckedChange={() => toggleTaskStatus(task)}
                    className="border-gold data-[state=checked]:bg-gold"
                  />
                  <span className="line-through text-white/60 flex-1">{task.title}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteTask(task.id)}
                    className="text-white/40 hover:text-red-400 hover:bg-red-500/10 h-6 w-6"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
