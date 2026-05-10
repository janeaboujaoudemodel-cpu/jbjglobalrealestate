import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { 
  Pencil, Eraser, Square, Circle, Type, Trash2, Download, 
  Undo, Redo, Move, Minus, MousePointer, Palette, ZoomIn, ZoomOut
} from "lucide-react";
import { toast } from "sonner";

type Tool = "select" | "pencil" | "eraser" | "rectangle" | "circle" | "line" | "text" | "move";

interface DrawElement {
  id: string;
  type: "path" | "rectangle" | "circle" | "line" | "text";
  points?: { x: number; y: number }[];
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  radius?: number;
  x1?: number;
  y1?: number;
  x2?: number;
  y2?: number;
  text?: string;
  color: string;
  strokeWidth: number;
}

const Whiteboard = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tool, setTool] = useState<Tool>("pencil");
  const [color, setColor] = useState("#ffffff");
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [elements, setElements] = useState<DrawElement[]>([]);
  const [history, setHistory] = useState<DrawElement[][]>([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentElement, setCurrentElement] = useState<DrawElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [boardName, setBoardName] = useState("Untitled Whiteboard");

  const colorOptions = [
    "#ffffff", "#dc2626", "#ea580c", "#eab308", "#22c55e",
    "#3b82f6", "#8b5cf6", "#ec4899", "#06b6d4", "#000000"
  ];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = "#1a1a2e";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Apply zoom and pan
    ctx.save();
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);

    // Draw all elements
    elements.forEach((element) => {
      ctx.strokeStyle = element.color;
      ctx.fillStyle = element.color;
      ctx.lineWidth = element.strokeWidth;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      switch (element.type) {
        case "path":
          if (element.points && element.points.length > 0) {
            ctx.beginPath();
            ctx.moveTo(element.points[0].x, element.points[0].y);
            element.points.forEach((point) => {
              ctx.lineTo(point.x, point.y);
            });
            ctx.stroke();
          }
          break;
        case "rectangle":
          if (element.x !== undefined && element.y !== undefined && element.width !== undefined && element.height !== undefined) {
            ctx.strokeRect(element.x, element.y, element.width, element.height);
          }
          break;
        case "circle":
          if (element.x !== undefined && element.y !== undefined && element.radius !== undefined) {
            ctx.beginPath();
            ctx.arc(element.x, element.y, element.radius, 0, Math.PI * 2);
            ctx.stroke();
          }
          break;
        case "line":
          if (element.x1 !== undefined && element.y1 !== undefined && element.x2 !== undefined && element.y2 !== undefined) {
            ctx.beginPath();
            ctx.moveTo(element.x1, element.y1);
            ctx.lineTo(element.x2, element.y2);
            ctx.stroke();
          }
          break;
        case "text":
          if (element.x !== undefined && element.y !== undefined && element.text) {
            ctx.font = `${element.strokeWidth * 6}px sans-serif`;
            ctx.fillText(element.text, element.x, element.y);
          }
          break;
      }
    });

    // Draw current element
    if (currentElement) {
      ctx.strokeStyle = currentElement.color;
      ctx.lineWidth = currentElement.strokeWidth;
      
      if (currentElement.type === "path" && currentElement.points && currentElement.points.length > 0) {
        ctx.beginPath();
        ctx.moveTo(currentElement.points[0].x, currentElement.points[0].y);
        currentElement.points.forEach((point) => {
          ctx.lineTo(point.x, point.y);
        });
        ctx.stroke();
      }
    }

    ctx.restore();
  }, [elements, currentElement, zoom, pan]);

  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left - pan.x) / zoom,
      y: (e.clientY - rect.top - pan.y) / zoom
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoords(e);
    setIsDrawing(true);

    if (tool === "pencil" || tool === "eraser") {
      setCurrentElement({
        id: Date.now().toString(),
        type: "path",
        points: [coords],
        color: tool === "eraser" ? "#1a1a2e" : color,
        strokeWidth: tool === "eraser" ? strokeWidth * 3 : strokeWidth
      });
    } else if (tool === "rectangle") {
      setCurrentElement({
        id: Date.now().toString(),
        type: "rectangle",
        x: coords.x,
        y: coords.y,
        width: 0,
        height: 0,
        color,
        strokeWidth
      });
    } else if (tool === "circle") {
      setCurrentElement({
        id: Date.now().toString(),
        type: "circle",
        x: coords.x,
        y: coords.y,
        radius: 0,
        color,
        strokeWidth
      });
    } else if (tool === "line") {
      setCurrentElement({
        id: Date.now().toString(),
        type: "line",
        x1: coords.x,
        y1: coords.y,
        x2: coords.x,
        y2: coords.y,
        color,
        strokeWidth
      });
    } else if (tool === "text") {
      const text = prompt("Enter text:");
      if (text) {
        const newElement: DrawElement = {
          id: Date.now().toString(),
          type: "text",
          x: coords.x,
          y: coords.y,
          text,
          color,
          strokeWidth
        };
        const newElements = [...elements, newElement];
        setElements(newElements);
        saveHistory(newElements);
      }
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !currentElement) return;
    const coords = getCanvasCoords(e);

    if (currentElement.type === "path") {
      setCurrentElement({
        ...currentElement,
        points: [...(currentElement.points || []), coords]
      });
    } else if (currentElement.type === "rectangle" && currentElement.x !== undefined && currentElement.y !== undefined) {
      setCurrentElement({
        ...currentElement,
        width: coords.x - currentElement.x,
        height: coords.y - currentElement.y
      });
    } else if (currentElement.type === "circle" && currentElement.x !== undefined && currentElement.y !== undefined) {
      const radius = Math.sqrt(
        Math.pow(coords.x - currentElement.x, 2) + Math.pow(coords.y - currentElement.y, 2)
      );
      setCurrentElement({ ...currentElement, radius });
    } else if (currentElement.type === "line") {
      setCurrentElement({ ...currentElement, x2: coords.x, y2: coords.y });
    }
  };

  const stopDrawing = () => {
    if (currentElement) {
      const newElements = [...elements, currentElement];
      setElements(newElements);
      saveHistory(newElements);
    }
    setIsDrawing(false);
    setCurrentElement(null);
  };

  const saveHistory = (newElements: DrawElement[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newElements);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setElements(history[historyIndex - 1]);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setElements(history[historyIndex + 1]);
    }
  };

  const clearCanvas = () => {
    setElements([]);
    saveHistory([]);
  };

  const exportCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `${boardName}.png`;
    link.href = canvas.toDataURL();
    link.click();
    toast.success("Whiteboard exported!");
  };

  const tools = [
    { id: "select", icon: MousePointer, label: "Select" },
    { id: "pencil", icon: Pencil, label: "Pencil" },
    { id: "eraser", icon: Eraser, label: "Eraser" },
    { id: "rectangle", icon: Square, label: "Rectangle" },
    { id: "circle", icon: Circle, label: "Circle" },
    { id: "line", icon: Minus, label: "Line" },
    { id: "text", icon: Type, label: "Text" },
    { id: "move", icon: Move, label: "Pan" },
  ];

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-white flex flex-col">
      {/* Header */}
      <div className="border-b border-[#1A1A1A] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Palette className="w-6 h-6 text-cyan-500" />
          <Input
            value={boardName}
            onChange={(e) => setBoardName(e.target.value)}
            className="bg-transparent border-none text-xl font-semibold w-64 focus-visible:ring-0"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={undo} disabled={historyIndex === 0}>
            <Undo className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={redo} disabled={historyIndex === history.length - 1}>
            <Redo className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => setZoom(z => Math.max(0.5, z - 0.1))}>
            <ZoomOut className="w-4 h-4" />
          </Button>
          <span className="text-sm text-[#1A1A1A]/70 w-12 text-center">{Math.round(zoom * 100)}%</span>
          <Button variant="outline" size="icon" onClick={() => setZoom(z => Math.min(2, z + 0.1))}>
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button variant="destructive" size="icon" onClick={clearCanvas}>
            <Trash2 className="w-4 h-4" />
          </Button>
          <Button onClick={exportCanvas} className="bg-cyan-600 hover:bg-cyan-700">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <div className="flex flex-1">
        {/* Toolbar */}
        <div className="w-16 border-r border-[#1A1A1A] p-2 flex flex-col gap-2">
          {tools.map((t) => (
            <Button
              key={t.id}
              variant={tool === t.id ? "default" : "ghost"}
              size="icon"
              onClick={() => setTool(t.id as Tool)}
              title={t.label}
            >
              <t.icon className="w-5 h-5" />
            </Button>
          ))}
          
          <div className="border-t border-[#1A1A1A] my-2 pt-2">
            <div className="flex flex-wrap gap-1 justify-center">
              {colorOptions.map((c) => (
                <button
                  key={c}
                  className={`w-5 h-5 rounded-full border-2 ${color === c ? "border-white" : "border-transparent"}`}
                  style={{ backgroundColor: c }}
                  onClick={() => setColor(c)}
                />
              ))}
            </div>
          </div>

          <div className="mt-2">
            <Slider
              value={[strokeWidth]}
              onValueChange={([v]) => setStrokeWidth(v)}
              min={1}
              max={20}
              step={1}
              orientation="vertical"
              className="h-24"
            />
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 overflow-hidden">
          <canvas
            ref={canvasRef}
            width={1920}
            height={1080}
            className="cursor-crosshair"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
          />
        </div>
      </div>
    </div>
  );
};

export default Whiteboard;
