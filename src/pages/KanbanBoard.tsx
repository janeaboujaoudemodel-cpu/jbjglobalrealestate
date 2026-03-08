import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Plus, Trash2, MoreVertical, Calendar, 
  GripVertical, LayoutGrid, ArrowLeft, Clock,
  CheckCircle2, Circle, AlertCircle, Columns3,
  Search, Filter, Archive, Copy, Tag, Users
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface Task {
  id: string;
  title: string;
  description: string;
  priority: "low" | "medium" | "high" | "urgent";
  dueDate?: string;
  tags: string[];
  assignee?: string;
  createdAt: string;
  checklist?: { id: string; text: string; done: boolean }[];
}

interface Column {
  id: string;
  title: string;
  color: string;
  tasks: Task[];
}

const PRIORITY_CONFIG = {
  low: { label: "Low", className: "bg-[#C9A84C]/10 text-[#8B7D3A] border border-[#C9A84C]/20", icon: Circle },
  medium: { label: "Medium", className: "bg-amber-100 text-amber-700 border border-amber-200", icon: Clock },
  high: { label: "High", className: "bg-red-50 text-red-700 border border-red-200", icon: AlertCircle },
  urgent: { label: "Urgent", className: "bg-red-100 text-red-800 border border-red-300", icon: AlertCircle },
};

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
  const [editingColumnId, setEditingColumnId] = useState<string | null>(null);
  const [inlineTaskText, setInlineTaskText] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const inlineInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Focus inline input when column becomes active for editing
  useEffect(() => {
    if (editingColumnId && inlineInputRefs.current[editingColumnId]) {
      inlineInputRefs.current[editingColumnId]?.focus();
    }
  }, [editingColumnId]);

  const addTaskInline = (columnId: string) => {
    const text = inlineTaskText[columnId]?.trim();
    if (!text) return;
    const newTask: Task = {
      id: Date.now().toString(),
      title: text,
      description: "",
      priority: "medium",
      tags: [],
      createdAt: new Date().toISOString(),
    };
    setColumns(columns.map(col =>
      col.id === columnId ? { ...col, tasks: [...col.tasks, newTask] } : col
    ));
    setInlineTaskText(prev => ({ ...prev, [columnId]: "" }));
    toast.success("Task added");
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
    setSelectedTasks(prev => { const n = new Set(prev); n.delete(taskId); return n; });
    toast.success("Task removed");
  };

  const duplicateTask = (columnId: string, task: Task) => {
    const dup: Task = { ...task, id: Date.now().toString(), title: `${task.title} (copy)`, createdAt: new Date().toISOString() };
    setColumns(columns.map(col =>
      col.id === columnId ? { ...col, tasks: [...col.tasks, dup] } : col
    ));
    toast.success("Task duplicated");
  };

  const bulkDelete = () => {
    if (selectedTasks.size === 0) return;
    setColumns(columns.map(col => ({
      ...col,
      tasks: col.tasks.filter(t => !selectedTasks.has(t.id))
    })));
    toast.success(`${selectedTasks.size} tasks deleted`);
    setSelectedTasks(new Set());
  };

  const bulkMove = (targetColumnId: string) => {
    if (selectedTasks.size === 0) return;
    const moving: Task[] = [];
    const updated = columns.map(col => ({
      ...col,
      tasks: col.tasks.filter(t => {
        if (selectedTasks.has(t.id)) { moving.push(t); return false; }
        return true;
      })
    }));
    setColumns(updated.map(col =>
      col.id === targetColumnId ? { ...col, tasks: [...col.tasks, ...moving] } : col
    ));
    toast.success(`Moved ${selectedTasks.size} tasks`);
    setSelectedTasks(new Set());
  };

  const toggleSelect = (taskId: string) => {
    setSelectedTasks(prev => {
      const n = new Set(prev);
      n.has(taskId) ? n.delete(taskId) : n.add(taskId);
      return n;
    });
  };

  const handleDragStart = (task: Task, columnId: string) => setDraggedTask({ task, columnId });
  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  const handleDrop = (targetColumnId: string) => {
    if (!draggedTask || draggedTask.columnId === targetColumnId) { setDraggedTask(null); return; }
    setColumns(columns.map(col => {
      if (col.id === draggedTask.columnId) return { ...col, tasks: col.tasks.filter(t => t.id !== draggedTask.task.id) };
      if (col.id === targetColumnId) return { ...col, tasks: [...col.tasks, draggedTask.task] };
      return col;
    }));
    toast.success(`Moved to ${columns.find(c => c.id === targetColumnId)?.title}`);
    setDraggedTask(null);
  };

  const addColumn = () => {
    setColumns([...columns, { id: Date.now().toString(), title: "New Column", color: "#C9A84C", tasks: [] }]);
  };

  const deleteColumn = (columnId: string) => {
    if (columns.length <= 1) { toast.error("Cannot remove the last column"); return; }
    setColumns(columns.filter(col => col.id !== columnId));
  };

  const totalTasks = columns.reduce((acc, col) => acc + col.tasks.length, 0);

  // Filtered tasks
  const getFilteredTasks = (tasks: Task[]) => {
    return tasks.filter(t => {
      if (searchQuery && !t.title.toLowerCase().includes(searchQuery.toLowerCase()) && !t.description.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (filterPriority !== "all" && t.priority !== filterPriority) return false;
      return true;
    });
  };

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
                <Columns3 className="h-5 w-5 text-white" />
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
          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-black/40" />
              <Input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search tasks..."
                className="pl-8 w-44 h-9 text-xs border-[#C9A84C]/30 bg-white/60"
              />
            </div>
            {/* Priority filter */}
            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger className="w-28 h-9 text-xs border-[#C9A84C]/30 bg-white/60">
                <Filter className="w-3 h-3 mr-1" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
            {/* Bulk actions */}
            {selectedTasks.size > 0 && (
              <div className="flex items-center gap-1.5 ml-2">
                <Badge className="bg-[#C9A84C]/20 text-[#8B7D3A] border border-[#C9A84C]/30">{selectedTasks.size} selected</Badge>
                <Select onValueChange={bulkMove}>
                  <SelectTrigger className="w-28 h-8 text-xs border-[#C9A84C]/30">
                    <SelectValue placeholder="Move to..." />
                  </SelectTrigger>
                  <SelectContent>
                    {columns.map(c => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Button size="sm" variant="destructive" onClick={bulkDelete} className="h-8 text-xs">
                  <Trash2 className="w-3 h-3 mr-1" /> Delete
                </Button>
              </div>
            )}
            <Button onClick={addColumn} className="bg-gradient-to-r from-[#C9A84C] to-amber-600 hover:from-[#C9A84C]/90 hover:to-amber-600/90 text-black font-semibold shadow-lg shadow-[#C9A84C]/20 h-9 text-xs">
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              Add Column
            </Button>
          </div>
        </div>
      </header>

      {/* Board */}
      <div className="p-6 overflow-x-auto">
        <div className="flex gap-6 min-w-max">
          {columns.map((column) => {
            const filtered = getFilteredTasks(column.tasks);
            return (
              <div
                key={column.id}
                className="w-80 flex-shrink-0"
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(column.id)}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between mb-4 pb-3 border-b-2 border-[#C9A84C]/30">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className="w-3 h-3 rounded-full bg-gradient-to-br from-[#C9A84C] to-amber-600 shrink-0" />
                    <Input
                      value={column.title}
                      onChange={(e) => setColumns(columns.map(col => col.id === column.id ? { ...col, title: e.target.value } : col))}
                      className="bg-transparent border-none font-semibold text-lg p-0 h-auto focus-visible:ring-0 text-black flex-1 min-w-0"
                    />
                    <Badge className="ml-1 bg-[#C9A84C]/10 text-[#8B7D3A] border border-[#C9A84C]/20 shrink-0">{filtered.length}</Badge>
                  </div>
                  <Button
                    variant="ghost" size="icon"
                    className="h-7 w-7 text-black/40 hover:text-red-600 hover:bg-red-50 shrink-0"
                    onClick={() => deleteColumn(column.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                {/* Inline quick-add at the TOP of each column */}
                <div className="mb-3">
                  <div className="flex items-center gap-1.5">
                    <Input
                      ref={el => { inlineInputRefs.current[column.id] = el; }}
                      value={inlineTaskText[column.id] || ""}
                      onChange={e => setInlineTaskText(prev => ({ ...prev, [column.id]: e.target.value }))}
                      placeholder={`+ Add task to ${column.title}...`}
                      className="border-[#C9A84C]/20 bg-white/60 h-8 text-xs placeholder:text-black/30 focus:border-[#C9A84C]/50 focus:bg-white"
                      onKeyDown={e => {
                        if (e.key === "Enter") addTaskInline(column.id);
                      }}
                      onFocus={() => setEditingColumnId(column.id)}
                    />
                    {(inlineTaskText[column.id] || "").trim() && (
                      <Button
                        size="icon"
                        className="h-8 w-8 bg-gradient-to-r from-[#C9A84C] to-amber-600 text-black shrink-0"
                        onClick={() => addTaskInline(column.id)}
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Tasks */}
                <div className="space-y-3 min-h-[200px]">
                  {filtered.map((task) => {
                    const pConfig = PRIORITY_CONFIG[task.priority];
                    const PriorityIcon = pConfig.icon;
                    const isSelected = selectedTasks.has(task.id);
                    return (
                      <Card
                        key={task.id}
                        className={`border-2 bg-white/80 cursor-grab active:cursor-grabbing hover:shadow-lg transition-all ${
                          isSelected ? "border-[#C9A84C] ring-2 ring-[#C9A84C]/20" : "border-[#C9A84C]/20 hover:border-[#C9A84C]/40"
                        }`}
                        draggable
                        onDragStart={() => handleDragStart(task, column.id)}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-start gap-2 mb-2">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelect(task.id)}
                              className="mt-1 accent-[#C9A84C] shrink-0"
                            />
                            <h4 className="font-medium text-black text-sm flex-1 min-w-0 break-words">{task.title}</h4>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-[#C9A84C]/10 shrink-0">
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
                                    placeholder="Description (supports notes, links, details)"
                                    className="border-[#C9A84C]/30 min-h-[100px]"
                                  />
                                  <div>
                                    <p className="text-xs font-medium text-black/60 mb-2">Priority</p>
                                    <div className="flex gap-2 flex-wrap">
                                      {(["low", "medium", "high", "urgent"] as const).map((p) => (
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
                                  <div>
                                    <p className="text-xs font-medium text-black/60 mb-2">Assignee</p>
                                    <Input
                                      value={task.assignee || ""}
                                      onChange={(e) => updateTask(column.id, task.id, { assignee: e.target.value })}
                                      placeholder="Assign to..."
                                      className="border-[#C9A84C]/30"
                                    />
                                  </div>
                                  <div className="flex gap-2">
                                    <Button
                                      variant="outline"
                                      className="flex-1 border-[#C9A84C]/30 text-black hover:bg-[#C9A84C]/10"
                                      onClick={() => duplicateTask(column.id, task)}
                                    >
                                      <Copy className="w-3.5 h-3.5 mr-1.5" /> Duplicate
                                    </Button>
                                    <Button
                                      variant="destructive"
                                      className="flex-1"
                                      onClick={() => deleteTask(column.id, task.id)}
                                    >
                                      <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Delete
                                    </Button>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </div>

                          {task.description && (
                            <p className="text-xs text-black/50 mb-2.5 line-clamp-2 ml-6">{task.description}</p>
                          )}

                          <div className="flex items-center gap-1.5 flex-wrap ml-6">
                            <Badge className={`${pConfig.className} text-[10px]`}>
                              <PriorityIcon className="w-2.5 h-2.5 mr-0.5" />
                              {pConfig.label}
                            </Badge>
                            {task.dueDate && (
                              <Badge className="bg-white border border-[#C9A84C]/20 text-black/60 text-[10px]">
                                <Calendar className="w-2.5 h-2.5 mr-0.5" />
                                {new Date(task.dueDate).toLocaleDateString()}
                              </Badge>
                            )}
                            {task.assignee && (
                              <Badge className="bg-blue-50 text-blue-700 border border-blue-200 text-[10px]">
                                <Users className="w-2.5 h-2.5 mr-0.5" />
                                {task.assignee}
                              </Badge>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default KanbanBoard;
