import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Plus, Trash2, Download, ZoomIn, ZoomOut, Move, 
  Circle, GitBranch, Palette, RotateCcw
} from "lucide-react";
import { toast } from "sonner";

interface MindNode {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
  parentId: string | null;
  children: string[];
}

const MindMap = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [nodes, setNodes] = useState<MindNode[]>([
    {
      id: "root",
      text: "Central Idea",
      x: 500,
      y: 300,
      color: "#8b5cf6",
      parentId: null,
      children: []
    }
  ]);
  const [selectedNode, setSelectedNode] = useState<string | null>("root");
  const [editingNode, setEditingNode] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [draggedNode, setDraggedNode] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [mapTitle, setMapTitle] = useState("Mind Map");

  const colorOptions = [
    "#8b5cf6", "#3b82f6", "#22c55e", "#eab308", "#ea580c",
    "#dc2626", "#ec4899", "#06b6d4", "#84cc16", "#6366f1"
  ];

  const drawConnections = useCallback((ctx: CanvasRenderingContext2D) => {
    nodes.forEach((node) => {
      if (node.parentId) {
        const parent = nodes.find(n => n.id === node.parentId);
        if (parent) {
          ctx.beginPath();
          ctx.strokeStyle = node.color + "80";
          ctx.lineWidth = 3;
          
          // Draw curved line
          const startX = parent.x;
          const startY = parent.y;
          const endX = node.x;
          const endY = node.y;
          const controlX = (startX + endX) / 2;
          
          ctx.moveTo(startX, startY);
          ctx.bezierCurveTo(controlX, startY, controlX, endY, endX, endY);
          ctx.stroke();
        }
      }
    });
  }, [nodes]);

  const drawNodes = useCallback((ctx: CanvasRenderingContext2D) => {
    nodes.forEach((node) => {
      // Node background
      ctx.beginPath();
      ctx.fillStyle = node.color;
      ctx.shadowColor = node.color;
      ctx.shadowBlur = selectedNode === node.id ? 20 : 10;
      
      const textWidth = ctx.measureText(node.text).width;
      const padding = 20;
      const width = Math.max(100, textWidth + padding * 2);
      const height = 40;
      const radius = 20;
      
      // Rounded rectangle
      ctx.beginPath();
      ctx.roundRect(node.x - width / 2, node.y - height / 2, width, height, radius);
      ctx.fill();
      
      // Border for selected node
      if (selectedNode === node.id) {
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 3;
        ctx.stroke();
      }
      
      // Reset shadow
      ctx.shadowBlur = 0;
      
      // Node text
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 14px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(node.text, node.x, node.y);
    });
  }, [nodes, selectedNode]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = "#0f0f23";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Apply zoom and pan
    ctx.save();
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);

    // Draw grid
    ctx.strokeStyle = "#1a1a2e";
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width / zoom; x += 50) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height / zoom);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height / zoom; y += 50) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width / zoom, y);
      ctx.stroke();
    }

    // Draw connections first
    drawConnections(ctx);
    
    // Draw nodes on top
    drawNodes(ctx);

    ctx.restore();
  }, [nodes, selectedNode, zoom, pan, drawConnections, drawNodes]);

  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left - pan.x) / zoom,
      y: (e.clientY - rect.top - pan.y) / zoom
    };
  };

  const findNodeAtPosition = (x: number, y: number): MindNode | undefined => {
    return nodes.find((node) => {
      const dx = x - node.x;
      const dy = y - node.y;
      return Math.abs(dx) < 60 && Math.abs(dy) < 25;
    });
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoords(e);
    const clickedNode = findNodeAtPosition(coords.x, coords.y);
    
    if (clickedNode) {
      setSelectedNode(clickedNode.id);
    } else {
      setSelectedNode(null);
    }
  };

  const handleCanvasDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoords(e);
    const clickedNode = findNodeAtPosition(coords.x, coords.y);
    
    if (clickedNode) {
      setEditingNode(clickedNode.id);
      setEditText(clickedNode.text);
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoords(e);
    const clickedNode = findNodeAtPosition(coords.x, coords.y);
    
    if (clickedNode) {
      setDraggedNode(clickedNode.id);
      setDragOffset({ x: coords.x - clickedNode.x, y: coords.y - clickedNode.y });
    } else {
      setIsDragging(true);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (draggedNode) {
      const coords = getCanvasCoords(e);
      setNodes(nodes.map(n => 
        n.id === draggedNode 
          ? { ...n, x: coords.x - dragOffset.x, y: coords.y - dragOffset.y }
          : n
      ));
    } else if (isDragging) {
      setPan({
        x: pan.x + e.movementX,
        y: pan.y + e.movementY
      });
    }
  };

  const handleMouseUp = () => {
    setDraggedNode(null);
    setIsDragging(false);
  };

  const addChildNode = () => {
    if (!selectedNode) return;
    
    const parent = nodes.find(n => n.id === selectedNode);
    if (!parent) return;

    const angle = (parent.children.length * 60 - 90) * (Math.PI / 180);
    const distance = 150;
    
    const newNode: MindNode = {
      id: Date.now().toString(),
      text: "New Idea",
      x: parent.x + Math.cos(angle) * distance,
      y: parent.y + Math.sin(angle) * distance,
      color: colorOptions[Math.floor(Math.random() * colorOptions.length)],
      parentId: selectedNode,
      children: []
    };

    setNodes([
      ...nodes.map(n => 
        n.id === selectedNode 
          ? { ...n, children: [...n.children, newNode.id] }
          : n
      ),
      newNode
    ]);
    setSelectedNode(newNode.id);
  };

  const deleteNode = () => {
    if (!selectedNode || selectedNode === "root") {
      toast.error("Cannot delete the root node");
      return;
    }

    const deleteRecursive = (nodeId: string): string[] => {
      const node = nodes.find(n => n.id === nodeId);
      if (!node) return [nodeId];
      return [nodeId, ...node.children.flatMap(deleteRecursive)];
    };

    const nodesToDelete = deleteRecursive(selectedNode);
    const nodeToDelete = nodes.find(n => n.id === selectedNode);
    
    setNodes(nodes
      .filter(n => !nodesToDelete.includes(n.id))
      .map(n => ({
        ...n,
        children: n.children.filter(c => !nodesToDelete.includes(c))
      }))
    );
    
    setSelectedNode(nodeToDelete?.parentId || "root");
  };

  const changeNodeColor = (color: string) => {
    if (!selectedNode) return;
    setNodes(nodes.map(n => 
      n.id === selectedNode ? { ...n, color } : n
    ));
  };

  const saveEdit = () => {
    if (!editingNode) return;
    setNodes(nodes.map(n => 
      n.id === editingNode ? { ...n, text: editText } : n
    ));
    setEditingNode(null);
  };

  const exportMap = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `${mapTitle}.png`;
    link.href = canvas.toDataURL();
    link.click();
    toast.success("Mind map exported!");
  };

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-white flex flex-col">
      {/* Header */}
      <div className="border-b border-[#1A1A1A] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <GitBranch className="w-6 h-6 text-violet-500" />
          <Input
            value={mapTitle}
            onChange={(e) => setMapTitle(e.target.value)}
            className="bg-transparent border-none text-xl font-semibold w-64 focus-visible:ring-0"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setZoom(z => Math.max(0.5, z - 0.1))}>
            <ZoomOut className="w-4 h-4" />
          </Button>
          <span className="text-sm text-white/70 w-12 text-center">{Math.round(zoom * 100)}%</span>
          <Button variant="outline" size="icon" onClick={() => setZoom(z => Math.min(2, z + 0.1))}>
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={resetView}>
            <RotateCcw className="w-4 h-4" />
          </Button>
          <Button onClick={exportMap} className="bg-violet-600 hover:bg-violet-700">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <div className="flex flex-1">
        {/* Toolbar */}
        <div className="w-64 border-r border-[#1A1A1A] p-4">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-white/70 mb-3">Actions</h3>
              <div className="space-y-2">
                <Button 
                  onClick={addChildNode} 
                  disabled={!selectedNode}
                  className="w-full justify-start"
                  variant="outline"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Child Node
                </Button>
                <Button 
                  onClick={deleteNode} 
                  disabled={!selectedNode || selectedNode === "root"}
                  className="w-full justify-start"
                  variant="outline"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Node
                </Button>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-white/70 mb-3">Node Color</h3>
              <div className="flex flex-wrap gap-2">
                {colorOptions.map((color) => (
                  <button
                    key={color}
                    className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${
                      nodes.find(n => n.id === selectedNode)?.color === color 
                        ? "border-white" 
                        : "border-transparent"
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => changeNodeColor(color)}
                    disabled={!selectedNode}
                  />
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-white/70 mb-3">Selected Node</h3>
              {selectedNode ? (
                <div className="bg-[#FDFBF7] rounded-lg p-3">
                  <p className="text-sm">{nodes.find(n => n.id === selectedNode)?.text}</p>
                  <p className="text-xs text-white/90 mt-1">
                    {nodes.find(n => n.id === selectedNode)?.children.length} children
                  </p>
                </div>
              ) : (
                <p className="text-sm text-white/90">Click a node to select it</p>
              )}
            </div>

            <div>
              <h3 className="text-sm font-semibold text-white/70 mb-3">Tips</h3>
              <ul className="text-xs text-white/90 space-y-1">
                <li>• Click to select a node</li>
                <li>• Double-click to edit text</li>
                <li>• Drag nodes to reposition</li>
                <li>• Drag canvas to pan</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 relative overflow-hidden">
          <canvas
            ref={canvasRef}
            width={1920}
            height={1080}
            className="cursor-grab active:cursor-grabbing"
            onClick={handleCanvasClick}
            onDoubleClick={handleCanvasDoubleClick}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          />

          {/* Edit Input Overlay */}
          {editingNode && (
            <div 
              className="absolute"
              style={{
                left: (nodes.find(n => n.id === editingNode)?.x || 0) * zoom + pan.x - 75,
                top: (nodes.find(n => n.id === editingNode)?.y || 0) * zoom + pan.y - 20
              }}
            >
              <Input
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                onBlur={saveEdit}
                onKeyDown={(e) => e.key === "Enter" && saveEdit()}
                className="w-40 text-center"
                autoFocus
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MindMap;
