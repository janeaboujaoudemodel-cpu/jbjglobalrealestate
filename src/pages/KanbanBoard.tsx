import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, Trash2, MoreVertical, Calendar, 
  GripVertical, LayoutGrid, ArrowLeft, Clock,
  CheckCircle2, Circle, AlertCircle, Columns3
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface Task {
  id: string;
  title: string;
  description: string;
  priority: "low" | "medium" | "high";
  dueDate?: string;
  tags: string[];
  assignee?: string;
  createdAt: string;
}

interface Column {
  id: string;
  title: string;
  color: string;
  tasks: Task[];
}

const KanbanBoard = () => {
  const navigate = useNavigate();
  const [boardName, setBoardName] = useState("Project Board");
  const [columns, setColumns] = useState<Column[]>([
    { id: "todo", title: "To Do", color: "#C9A84C", tasks: [] },
    { id: "in-progress", title: "In Progress", color: "#D4A843", tasks: [] },
    { id: "review", title: "Review", color: "#B89A3E", tasks: [] },
    { id: "done", title: "Done", color: "#8B7D3A", tasks: [] }
  ]);
  const [draggedTask, setDraggedTask] = useState<{ task: Task; columnId: string } | null>(null);
  const [newTaskColumn, setNewTaskColumn] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState("");

  const addTask = (columnId: string) => {
    if (!newTaskTitle.trim()) return;
    const newTask: Task = {
      id: Date.now().toString(),
      title: newTaskTitle,
      description: "",
      priority: "medium",
      tags: [],
      createdAt: new Date().toISOString(),
    };
    setColumns(columns.map(col => 
      col.id === columnId ? { ...col, tasks: [...col.tasks, newTask] } : col
    ));
    setNewTaskTitle("");
    setNewTaskColumn(null);
    toast.success("Task added successfully");
  };

  const updateTask = (columnId: string, taskId: string, updates: Partial<Task>) => {
    setColumns(columns.map(col => 
      col.id === columnId 
        ? { ...col, tasks: col.tasks.map(task => task.id === taskId ? { ...task, ...updates } : task) }
        : col
    ));
  };

  const deleteTask = (columnId: string, taskId: string) => {
    setColumns(columns.map(col => 
      col.id === columnId ? { ...col, tasks: col.tasks.filter(task => task.id !== taskId) } : col
    ));
    toast.success("Task removed");
  };

  const handleDragStart = (task: Task, columnId: string) => {
    setDraggedTask({ task, columnId });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (targetColumnId: string) => {
    if (!draggedTask) return;
    if (draggedTask.columnId !== targetColumnId) {
      setColumns(columns.map(col => {
        if (col.id === draggedTask.columnId) return { ...col, tasks: col.tasks.filter(t => t.id !== draggedTask.task.id) };
        if (col.id === targetColumnId) return { ...col, tasks: [...col.tasks, draggedTask.task] };
        return col;
      }));
      toast.success(`Moved to ${columns.find(c => c.id === targetColumnId)?.title}`);
    }
    setDraggedTask(null);
  };

  const addColumn = () => {
    const newColumn: Column = {
      id: Date.now().toString(),
      title: "New Column",
      color: "#C9A84C",
      tasks: []
    };
    setColumns([...columns, newColumn]);
  };

  const deleteColumn = (columnId: string) => {
    if (columns.length <= 1) {
      toast.error("Cannot remove the last column");
      return;
    }
    setColumns(columns.filter(col => col.id !== columnId));
  };

  const priorityConfig = {
    low: { label: "Low", className: "bg-[#C9A84C]/10 text-[#8B7D3A] border border-[#C9A84C]/20", icon: Circle },
    medium: { label: "Medium", className: "bg-amber-100 text-amber-700 border border-amber-200", icon: Clock },
    high: { label: "High", className: "bg-red-50 text-red-700 border border-red-200", icon: AlertCircle },
  };

  const totalTasks = columns.reduce((acc, col) => acc + col.tasks.length, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3]">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b-2 border-[#C9A84C]/30 bg-gradient-to-r from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] shadow-[0_4px_20px_rgba(200,167,102,0.1)]">
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="text-black hover:bg-[#C9A84C]/10">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#C9A84C] to-amber-600 flex items-center justify-center shadow-lg shadow-[#C9A84C]/20">
                <Columns3 className="h-5 w-5 text-black" />
              </div>
              <div>
                <Input
                  value={boardName}
                  onChange={(e) => setBoardName(e.target.value)}
                  className="bg-transparent border-none text-xl font-bold w-64 focus-visible:ring-0 text-black p-0 h-auto"
                />
                <p className="text-xs text-black/60">{totalTasks} tasks across {columns.length} columns</p>
              </div>
            </div>
          </div>
          <Button onClick={addColumn} className="bg-gradient-to-r from-[#C9A84C] to-amber-600 hover:from-[#C9A84C]/90 hover:to-amber-600/90 text-black font-semibold shadow-lg shadow-[#C9A84C]/20">
            <Plus className="w-4 h-4 mr-2" />
            Add Column
          </Button>
        </div>
      </header>

      {/* Board */}
      <div className="p-6 overflow-x-auto">
        <div className="flex gap-6 min-w-max">
          {columns.map((column) => (
            <div
              key={column.id}
              className="w-80 flex-shrink-0"
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(column.id)}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between mb-4 pb-3 border-b-2 border-[#C9A84C]/30">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#C9A84C]" />
                  <Input
                    value={column.title}
                    onChange={(e) => setColumns(columns.map(col => col.id === column.id ? { ...col, title: e.target.value } : col))}
                    className="bg-transparent border-none font-semibold text-lg p-0 h-auto focus-visible:ring-0 text-black"
                  />
                  <Badge className="ml-2 bg-[#C9A84C]/10 text-[#8B7D3A] border border-[#C9A84C]/20">{column.tasks.length}</Badge>
                </div>
                <Button 
                  variant="ghost" size="icon" 
                  className="h-7 w-7 text-black/40 hover:text-red-600 hover:bg-red-50"
                  onClick={() => deleteColumn(column.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              {/* Tasks */}
              <div className="space-y-3 min-h-[200px]">
                {column.tasks.map((task) => {
                  const pConfig = priorityConfig[task.priority];
                  const PriorityIcon = pConfig.icon;
                  return (
                    <Card
                      key={task.id}
                      className="border-2 border-[#C9A84C]/20 bg-white/80 cursor-grab active:cursor-grabbing hover:border-[#C9A84C]/40 hover:shadow-lg transition-all"
                      draggable
                      onDragStart={() => handleDragStart(task, column.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium text-black text-sm">{task.title}</h4>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-[#C9A84C]/10">
                                <MoreVertical className="w-4 h-4 text-black/50" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-white border-2 border-[#C9A84C]/30">
                              <DialogHeader>
                                <DialogTitle className="text-black">Edit Task</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <Input
                                  value={task.title}
                                  onChange={(e) => updateTask(column.id, task.id, { title: e.target.value })}
                                  placeholder="Task title"
                                  className="border-[#C9A84C]/30"
                                />
                                <Textarea
                                  value={task.description}
                                  onChange={(e) => updateTask(column.id, task.id, { description: e.target.value })}
                                  placeholder="Description"
                                  className="border-[#C9A84C]/30"
                                />
                                <div>
                                  <p className="text-xs font-medium text-black/60 mb-2">Priority</p>
                                  <div className="flex gap-2">
                                    {(["low", "medium", "high"] as const).map((p) => (
                                      <Button
                                        key={p}
                                        size="sm"
                                        variant={task.priority === p ? "default" : "outline"}
                                        onClick={() => updateTask(column.id, task.id, { priority: p })}
                                        className={task.priority === p 
                                          ? "bg-gradient-to-r from-[#C9A84C] to-amber-600 text-black capitalize" 
                                          : "border-[#C9A84C]/30 text-black capitalize hover:bg-[#C9A84C]/10"}
                                      >
                                        {p}
                                      </Button>
                                    ))}
                                  </div>
                                </div>
                                <div>
                                  <p className="text-xs font-medium text-black/60 mb-2">Due Date</p>
                                  <Input
                                    type="date"
                                    value={task.dueDate || ""}
                                    onChange={(e) => updateTask(column.id, task.id, { dueDate: e.target.value })}
                                    className="border-[#C9A84C]/30"
                                  />
                                </div>
                                <Button 
                                  variant="destructive" 
                                  onClick={() => deleteTask(column.id, task.id)}
                                  className="w-full"
                                >
                                  Delete Task
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                        
                        {task.description && (
                          <p className="text-xs text-black/50 mb-3 line-clamp-2">{task.description}</p>
                        )}
                        
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge className={pConfig.className}>
                            <PriorityIcon className="w-3 h-3 mr-1" />
                            {pConfig.label}
                          </Badge>
                          {task.dueDate && (
                            <Badge className="bg-white border border-[#C9A84C]/20 text-black/60">
                              <Calendar className="w-3 h-3 mr-1" />
                              {new Date(task.dueDate).toLocaleDateString()}
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}

                {/* Add Task */}
                {newTaskColumn === column.id ? (
                  <Card className="border-2 border-[#C9A84C]/30 bg-white/60">
                    <CardContent className="p-3">
                      <Input
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        placeholder="Enter task title..."
                        className="mb-2 border-[#C9A84C]/30"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") addTask(column.id);
                          if (e.key === "Escape") setNewTaskColumn(null);
                        }}
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => addTask(column.id)} className="bg-gradient-to-r from-[#C9A84C] to-amber-600 text-black font-semibold">Add</Button>
                        <Button size="sm" variant="ghost" onClick={() => setNewTaskColumn(null)} className="text-black/60">Cancel</Button>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-black/40 hover:text-black hover:bg-[#C9A84C]/10"
                    onClick={() => setNewTaskColumn(column.id)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add task
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default KanbanBoard;
