import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { 
  CheckSquare, Plus, ArrowLeft, Calendar, Clock, 
  AlertCircle, CheckCircle, Circle, Search, Filter
} from "lucide-react";
import { format } from "date-fns";

interface Task {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  priority: 'low' | 'medium' | 'high';
  status: 'todo' | 'in_progress' | 'done';
  created_at: string;
  category: string | null;
}

const CRMTasks = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [newTaskTitle, setNewTaskTitle] = useState("");

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
      setTasks((data || []) as Task[]);
    } catch (err) {
      console.error("Failed to fetch tasks:", err);
      toast.error("Failed to load tasks");
    } finally {
      setLoading(false);
    }
  };

  const addTask = async () => {
    if (!newTaskTitle.trim() || !user) return;

    try {
      const { data, error } = await supabase
        .from("admin_tasks")
        .insert({
          user_id: user.id,
          title: newTaskTitle.trim(),
          status: 'todo',
          priority: 'medium'
        })
        .select()
        .single();

      if (error) throw error;
      setTasks(prev => [data as Task, ...prev]);
      setNewTaskTitle("");
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
    } catch (err) {
      console.error("Failed to update task:", err);
      toast.error("Failed to update task");
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500/20 text-red-600 border-red-500/30';
      case 'medium': return 'bg-amber-500/20 text-amber-600 border-amber-500/30';
      case 'low': return 'bg-green-500/20 text-green-600 border-green-500/30';
      default: return 'bg-zinc-500/20 text-zinc-600 border-zinc-500/30';
    }
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || task.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const todoCount = tasks.filter(t => t.status === 'todo').length;
  const doneCount = tasks.filter(t => t.status === 'done').length;

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-12 w-64" />
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-zinc-200 bg-white sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/crm">
              <Button variant="ghost" size="sm" className="text-zinc-600 hover:text-zinc-900">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to CRM
              </Button>
            </Link>
            <div className="h-6 w-px bg-zinc-200" />
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <CheckSquare className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-zinc-900">My Tasks</h1>
                <p className="text-xs text-zinc-500">{todoCount} pending, {doneCount} completed</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {/* Quick Add */}
        <Card className="border-zinc-200 bg-white">
          <CardContent className="p-4">
            <div className="flex gap-3">
              <Input
                placeholder="Add a new task..."
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addTask()}
                className="flex-1"
              />
              <Button onClick={addTask} variant="primary">
                <Plus className="h-4 w-4 mr-2" />
                Add Task
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <Input
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            {['all', 'todo', 'in_progress', 'done'].map(status => (
              <Button
                key={status}
                variant={filterStatus === status ? "primary" : "secondary"}
                size="sm"
                onClick={() => setFilterStatus(status)}
              >
                {status === 'all' ? 'All' : status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </Button>
            ))}
          </div>
        </div>

        {/* Tasks List */}
        <div className="space-y-2">
          {filteredTasks.length === 0 ? (
            <Card className="border-zinc-200 bg-white">
              <CardContent className="py-12 text-center">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 text-zinc-300" />
                <p className="text-zinc-600 font-medium">No tasks found</p>
                <p className="text-sm text-zinc-400 mt-1">
                  {searchQuery || filterStatus !== 'all' 
                    ? "Try adjusting your filters" 
                    : "Add your first task to get started"}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredTasks.map(task => (
              <Card 
                key={task.id} 
                className={`border-zinc-200 bg-white transition-all ${
                  task.status === 'done' ? 'opacity-60' : ''
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <Checkbox
                      checked={task.status === 'done'}
                      onCheckedChange={() => toggleTaskStatus(task.id, task.status)}
                      className="h-5 w-5"
                    />
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium text-zinc-900 ${
                        task.status === 'done' ? 'line-through text-zinc-500' : ''
                      }`}>
                        {task.title}
                      </p>
                      {task.description && (
                        <p className="text-sm text-zinc-500 truncate">{task.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={getPriorityColor(task.priority)}>
                        {task.priority}
                      </Badge>
                      {task.due_date && (
                        <span className="text-xs text-zinc-500 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(task.due_date), 'MMM d')}
                        </span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  );
};

export default CRMTasks;
