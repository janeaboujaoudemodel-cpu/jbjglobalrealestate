import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { 
  CheckCircle2, Plus, ArrowLeft, Calendar, Clock, 
  AlertCircle, Circle, Search, Filter, ListTodo, Trash2
} from "lucide-react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Task {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'todo' | 'in_progress' | 'done';
  created_at: string;
  category: string | null;
}

const PRIORITY_COLORS: Record<string, string> = {
  low: "bg-slate-500/20 text-slate-400 border-slate-500/30",
  medium: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  high: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  urgent: "bg-red-500/20 text-red-400 border-red-500/30",
};

const CATEGORY_COLORS: Record<string, string> = {
  general: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
  integration: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  security: "bg-red-500/20 text-red-400 border-red-500/30",
  marketing: "bg-green-500/20 text-green-400 border-green-500/30",
  development: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  other: "bg-amber-500/20 text-amber-400 border-amber-500/30",
};

// Map legacy statuses to valid ones
const normalizeStatus = (status: string | null): 'todo' | 'in_progress' | 'done' => {
  if (!status) return 'todo';
  const s = status.toLowerCase();
  if (s === 'done' || s === 'completed') return 'done';
  if (s === 'in_progress' || s === 'in-progress' || s === 'active') return 'in_progress';
  // pending, todo, new, or anything else → todo
  return 'todo';
};

const CRMTasks = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    category: "general",
    priority: "medium",
    due_date: "",
  });

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      navigate("/auth");
      return;
    }

    fetchTasks();
  }, [authLoading, user, navigate]);

  const fetchTasks = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("admin_tasks")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      // Normalize statuses from DB (handles 'pending', etc.)
      const normalizedTasks = (data || []).map((t: any) => ({
        ...t,
        status: normalizeStatus(t.status),
      })) as Task[];
      setTasks(normalizedTasks);
    } catch (err) {
      console.error("Failed to fetch tasks:", err);
      toast.error("Failed to load tasks");
    } finally {
      setLoading(false);
    }
  };

  const addTask = async () => {
    if (!newTask.title.trim() || !user) return;

    try {
      const { data, error } = await supabase
        .from("admin_tasks")
        .insert({
          user_id: user.id,
          title: newTask.title.trim(),
          description: newTask.description || null,
          category: newTask.category,
          priority: newTask.priority,
          due_date: newTask.due_date || null,
          status: 'todo'
        })
        .select()
        .single();

      if (error) throw error;
      setTasks(prev => [data as Task, ...prev]);
      setNewTask({ title: "", description: "", category: "general", priority: "medium", due_date: "" });
      setIsAddingTask(false);
      toast.success("Task added");
    } catch (err) {
      console.error("Failed to add task:", err);
      toast.error("Failed to add task");
    }
  };

  const toggleTaskStatus = async (taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'done' ? 'todo' : 'done';

    try {
      const { error } = await supabase
        .from("admin_tasks")
        .update({ 
          status: newStatus,
          completed_at: newStatus === 'done' ? new Date().toISOString() : null
        })
        .eq("id", taskId);

      if (error) throw error;
      setTasks(prev => prev.map(t => 
        t.id === taskId ? { ...t, status: newStatus as Task['status'] } : t
      ));
      toast.success(newStatus === 'done' ? "Task completed!" : "Task reopened");
    } catch (err) {
      console.error("Failed to update task:", err);
      toast.error("Failed to update task");
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from("admin_tasks")
        .delete()
        .eq("id", taskId);

      if (error) throw error;
      setTasks(prev => prev.filter(t => t.id !== taskId));
      toast.success("Task deleted");
    } catch (err) {
      console.error("Failed to delete task:", err);
      toast.error("Failed to delete task");
    }
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || task.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const todoTasks = filteredTasks.filter(t => t.status === 'todo');
  const inProgressTasks = filteredTasks.filter(t => t.status === 'in_progress');
  const doneTasks = filteredTasks.filter(t => t.status === 'done');

  const todoCount = tasks.filter(t => t.status === 'todo').length;
  const inProgressCount = tasks.filter(t => t.status === 'in_progress').length;
  const doneCount = tasks.filter(t => t.status === 'done').length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] p-6">
        <div className="max-w-5xl mx-auto space-y-6">
          <Skeleton className="h-12 w-64" />
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const TaskCard = ({ task }: { task: Task }) => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border border-gold/30 rounded-xl p-4 shadow-sm hover:shadow-lg hover:border-gold/50 transition-all duration-300 ${
        task.status === 'done' ? 'opacity-60' : ''
      }`}
    >
      <div className="flex items-start gap-4">
        <button
          onClick={() => toggleTaskStatus(task.id, task.status)}
          className={`mt-1 flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
            task.status === 'done' 
              ? 'bg-gold border-gold' 
              : 'border-gold/50 hover:border-gold hover:bg-gold/10'
          }`}
        >
          {task.status === 'done' && (
            <CheckCircle2 className="w-4 h-4 text-black" />
          )}
        </button>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={`font-medium text-black ${
              task.status === 'done' ? 'line-through text-zinc-500' : ''
            }`}>
              {task.title}
            </span>
          </div>
          
          {task.description && (
            <p className="text-sm text-zinc-500 mb-2">{task.description}</p>
          )}
          
          <div className="flex items-center gap-2 flex-wrap">
            {task.category && (
              <Badge variant="outline" className={`text-xs ${CATEGORY_COLORS[task.category] || CATEGORY_COLORS.general}`}>
                {task.category}
              </Badge>
            )}
            <Badge variant="outline" className={`text-xs ${PRIORITY_COLORS[task.priority]}`}>
              {task.priority}
            </Badge>
            {task.due_date && (
              <span className="text-xs text-zinc-500 flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {format(new Date(task.due_date), 'MMM d, yyyy')}
              </span>
            )}
          </div>
        </div>
        
        <button
          onClick={() => deleteTask(task.id)}
          className="text-zinc-400 hover:text-red-500 transition-colors p-1"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3]">
      {/* Header */}
      <header className="border-b border-gold/20 bg-white/80 backdrop-blur-md sticky top-0 lg:top-[48px] z-50">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/crm">
              <Button variant="ghost" size="sm" className="text-zinc-600 hover:text-black">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to CRM
              </Button>
            </Link>
            <div className="h-6 w-px bg-gold/30" />
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-gold/20 to-gold/10 border border-gold/30">
                <ListTodo className="h-5 w-5 text-gold" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-black">My Tasks</h1>
                <p className="text-xs text-zinc-500">{todoCount} pending · {inProgressCount} in progress · {doneCount} done</p>
              </div>
            </div>
          </div>
          
          <Dialog open={isAddingTask} onOpenChange={setIsAddingTask}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-gold to-gold-dark text-black font-semibold hover:brightness-110 shadow-lg shadow-gold/20">
                <Plus className="w-4 h-4 mr-2" />
                Add Task
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-gold/30">
              <DialogHeader>
                <DialogTitle className="text-black">Add New Task</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <Input
                  placeholder="Task title..."
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  className="border-zinc-300 focus:border-gold"
                />
                <Textarea
                  placeholder="Description (optional)..."
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  className="border-zinc-300 focus:border-gold"
                />
                <div className="grid grid-cols-2 gap-4">
                  <select
                    value={newTask.category}
                    onChange={(e) => setNewTask({ ...newTask, category: e.target.value })}
                    className="h-10 px-3 rounded-md border border-zinc-300 bg-white text-black font-medium focus:outline-none focus:ring-2 focus:ring-gold/50"
                  >
                    <option value="general">General</option>
                    <option value="integration">Integration</option>
                    <option value="security">Security</option>
                    <option value="marketing">Marketing</option>
                    <option value="development">Development</option>
                    <option value="other">Other</option>
                  </select>
                  
                  <select
                    value={newTask.priority}
                    onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                    className="h-10 px-3 rounded-md border border-zinc-300 bg-white text-black font-medium focus:outline-none focus:ring-2 focus:ring-gold/50"
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
                  className="border-zinc-300 focus:border-gold"
                />
                <Button onClick={addTask} className="w-full bg-gradient-to-r from-gold to-gold-dark text-black font-semibold hover:brightness-110">
                  Add Task
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        {/* Filters */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <Input
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-gold/30"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {[
              { key: 'all', label: 'All' },
              { key: 'todo', label: 'To Do' },
              { key: 'in_progress', label: 'In Progress' },
              { key: 'done', label: 'Done' }
            ].map(status => (
              <Button
                key={status.key}
                variant={filterStatus === status.key ? "primary" : "secondary"}
                size="sm"
                onClick={() => setFilterStatus(status.key)}
                className={filterStatus === status.key 
                  ? "bg-gold text-black" 
                  : "bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-gold/30 text-zinc-700 hover:border-gold"
                }
              >
                {status.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Task Sections */}
        {filteredTasks.length === 0 ? (
          <div className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border border-gold/30 rounded-2xl p-12 text-center">
            <div className="w-16 h-16 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="h-8 w-8 text-gold" />
            </div>
            <p className="text-black font-medium text-lg">No tasks found</p>
            <p className="text-zinc-500 mt-1">
              {searchQuery || filterStatus !== 'all' 
                ? "Try adjusting your filters" 
                : "Add your first task to get started"}
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* To Do */}
            {todoTasks.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Circle className="w-4 h-4 text-zinc-400" />
                  <h2 className="text-lg font-semibold text-black">To Do</h2>
                  <Badge className="bg-zinc-100 text-zinc-600">{todoTasks.length}</Badge>
                </div>
                <div className="space-y-3">
                  {todoTasks.map(task => (
                    <TaskCard key={task.id} task={task} />
                  ))}
                </div>
              </div>
            )}

            {/* In Progress */}
            {inProgressTasks.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="w-4 h-4 text-blue-500" />
                  <h2 className="text-lg font-semibold text-black">In Progress</h2>
                  <Badge className="bg-blue-100 text-blue-600">{inProgressTasks.length}</Badge>
                </div>
                <div className="space-y-3">
                  {inProgressTasks.map(task => (
                    <TaskCard key={task.id} task={task} />
                  ))}
                </div>
              </div>
            )}

            {/* Done */}
            {doneTasks.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <h2 className="text-lg font-semibold text-black">Done</h2>
                  <Badge className="bg-green-100 text-green-600">{doneTasks.length}</Badge>
                </div>
                <div className="space-y-3">
                  {doneTasks.map(task => (
                    <TaskCard key={task.id} task={task} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default CRMTasks;
