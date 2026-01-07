import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, Trash2, MoreVertical, Calendar, Tag, User, 
  GripVertical, CheckSquare, Clock, LayoutGrid
} from "lucide-react";
import { toast } from "sonner";

interface Task {
  id: string;
  title: string;
  description: string;
  priority: "low" | "medium" | "high";
  dueDate?: string;
  tags: string[];
  assignee?: string;
}

interface Column {
  id: string;
  title: string;
  color: string;
  tasks: Task[];
}

const KanbanBoard = () => {
  const [boardName, setBoardName] = useState("Project Board");
  const [columns, setColumns] = useState<Column[]>([
    { id: "todo", title: "To Do", color: "#6366f1", tasks: [] },
    { id: "in-progress", title: "In Progress", color: "#f59e0b", tasks: [] },
    { id: "review", title: "Review", color: "#8b5cf6", tasks: [] },
    { id: "done", title: "Done", color: "#22c55e", tasks: [] }
  ]);
  const [draggedTask, setDraggedTask] = useState<{ task: Task; columnId: string } | null>(null);
  const [editingTask, setEditingTask] = useState<{ task: Task; columnId: string } | null>(null);
  const [newTaskColumn, setNewTaskColumn] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState("");

  const addTask = (columnId: string) => {
    if (!newTaskTitle.trim()) return;
    
    const newTask: Task = {
      id: Date.now().toString(),
      title: newTaskTitle,
      description: "",
      priority: "medium",
      tags: []
    };

    setColumns(columns.map(col => 
      col.id === columnId 
        ? { ...col, tasks: [...col.tasks, newTask] }
        : col
    ));
    setNewTaskTitle("");
    setNewTaskColumn(null);
    toast.success("Task added!");
  };

  const updateTask = (columnId: string, taskId: string, updates: Partial<Task>) => {
    setColumns(columns.map(col => 
      col.id === columnId 
        ? { 
            ...col, 
            tasks: col.tasks.map(task => 
              task.id === taskId ? { ...task, ...updates } : task
            ) 
          }
        : col
    ));
  };

  const deleteTask = (columnId: string, taskId: string) => {
    setColumns(columns.map(col => 
      col.id === columnId 
        ? { ...col, tasks: col.tasks.filter(task => task.id !== taskId) }
        : col
    ));
    toast.success("Task deleted");
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
        if (col.id === draggedTask.columnId) {
          return { ...col, tasks: col.tasks.filter(t => t.id !== draggedTask.task.id) };
        }
        if (col.id === targetColumnId) {
          return { ...col, tasks: [...col.tasks, draggedTask.task] };
        }
        return col;
      }));
    }
    setDraggedTask(null);
  };

  const addColumn = () => {
    const newColumn: Column = {
      id: Date.now().toString(),
      title: "New Column",
      color: "#64748b",
      tasks: []
    };
    setColumns([...columns, newColumn]);
  };

  const deleteColumn = (columnId: string) => {
    if (columns.length <= 1) {
      toast.error("Cannot delete the last column");
      return;
    }
    setColumns(columns.filter(col => col.id !== columnId));
  };

  const priorityColors = {
    low: "bg-blue-500/20 text-blue-400",
    medium: "bg-yellow-500/20 text-yellow-400",
    high: "bg-red-500/20 text-red-400"
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <div className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <LayoutGrid className="w-6 h-6 text-indigo-500" />
          <Input
            value={boardName}
            onChange={(e) => setBoardName(e.target.value)}
            className="bg-transparent border-none text-2xl font-bold w-64 focus-visible:ring-0"
          />
        </div>
        <Button onClick={addColumn} variant="outline">
          <Plus className="w-4 h-4 mr-2" />
          Add Column
        </Button>
      </div>

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
              <div 
                className="flex items-center justify-between mb-4 pb-2 border-b-2"
                style={{ borderColor: column.color }}
              >
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: column.color }} />
                  <Input
                    value={column.title}
                    onChange={(e) => setColumns(columns.map(col => 
                      col.id === column.id ? { ...col, title: e.target.value } : col
                    ))}
                    className="bg-transparent border-none font-semibold text-lg p-0 h-auto focus-visible:ring-0"
                  />
                  <Badge variant="secondary" className="ml-2">{column.tasks.length}</Badge>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6 text-zinc-500 hover:text-red-500"
                  onClick={() => deleteColumn(column.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              {/* Tasks */}
              <div className="space-y-3 min-h-[200px]">
                {column.tasks.map((task) => (
                  <Card
                    key={task.id}
                    className="bg-zinc-900 border-zinc-800 cursor-grab active:cursor-grabbing hover:border-zinc-700 transition-colors"
                    draggable
                    onDragStart={() => handleDragStart(task, column.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-white">{task.title}</h4>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="bg-zinc-900 border-zinc-800">
                            <DialogHeader>
                              <DialogTitle>Edit Task</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <Input
                                value={task.title}
                                onChange={(e) => updateTask(column.id, task.id, { title: e.target.value })}
                                placeholder="Task title"
                              />
                              <Textarea
                                value={task.description}
                                onChange={(e) => updateTask(column.id, task.id, { description: e.target.value })}
                                placeholder="Description"
                              />
                              <div className="flex gap-2">
                                {(["low", "medium", "high"] as const).map((p) => (
                                  <Button
                                    key={p}
                                    size="sm"
                                    variant={task.priority === p ? "default" : "outline"}
                                    onClick={() => updateTask(column.id, task.id, { priority: p })}
                                    className="capitalize"
                                  >
                                    {p}
                                  </Button>
                                ))}
                              </div>
                              <Input
                                type="date"
                                value={task.dueDate || ""}
                                onChange={(e) => updateTask(column.id, task.id, { dueDate: e.target.value })}
                              />
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
                        <p className="text-sm text-zinc-400 mb-3 line-clamp-2">{task.description}</p>
                      )}
                      
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={priorityColors[task.priority]}>
                          {task.priority}
                        </Badge>
                        {task.dueDate && (
                          <Badge variant="outline" className="text-zinc-400">
                            <Calendar className="w-3 h-3 mr-1" />
                            {new Date(task.dueDate).toLocaleDateString()}
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {/* Add Task */}
                {newTaskColumn === column.id ? (
                  <Card className="bg-zinc-900 border-zinc-800">
                    <CardContent className="p-3">
                      <Input
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        placeholder="Task title..."
                        className="mb-2"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") addTask(column.id);
                          if (e.key === "Escape") setNewTaskColumn(null);
                        }}
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => addTask(column.id)}>Add</Button>
                        <Button size="sm" variant="ghost" onClick={() => setNewTaskColumn(null)}>Cancel</Button>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-zinc-500 hover:text-white"
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
