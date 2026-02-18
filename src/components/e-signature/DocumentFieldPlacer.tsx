import { useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  PenTool,
  Type,
  Calendar,
  Trash2,
  User,
  Wand2,
  Loader2,
  ChevronLeft,
  ChevronRight,
  AlignLeft,
  X,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Recipient {
  id: string;
  name: string;
  email: string;
}

interface SignatureField {
  id: string;
  recipientId: string;
  type: "signature" | "initials" | "date" | "text";
  pageNumber: number;
  x: number;
  y: number;
  width: number;
  height: number;
  value?: string;
  label?: string;
}

interface DocumentFieldPlacerProps {
  pdfUrl: string;
  recipients: Recipient[];
  fields: SignatureField[];
  onFieldsChange: (fields: SignatureField[]) => void;
}

const fieldTypes = [
  { type: "signature" as const, label: "Signature", icon: PenTool, defaultWidth: 180, defaultHeight: 52 },
  { type: "initials" as const, label: "Initials", icon: AlignLeft, defaultWidth: 90, defaultHeight: 40 },
  { type: "date" as const, label: "Date", icon: Calendar, defaultWidth: 140, defaultHeight: 36 },
  { type: "text" as const, label: "Text", icon: Type, defaultWidth: 160, defaultHeight: 36 },
];

const recipientColorStyles = [
  { bg: "bg-blue-500", border: "border-blue-500", text: "text-blue-700", light: "bg-blue-50", hex: "#3B82F6" },
  { bg: "bg-emerald-500", border: "border-emerald-500", text: "text-emerald-700", light: "bg-emerald-50", hex: "#10B981" },
  { bg: "bg-purple-500", border: "border-purple-500", text: "text-purple-700", light: "bg-purple-50", hex: "#8B5CF6" },
  { bg: "bg-orange-500", border: "border-orange-500", text: "text-orange-700", light: "bg-orange-50", hex: "#F97316" },
  { bg: "bg-pink-500", border: "border-pink-500", text: "text-pink-700", light: "bg-pink-50", hex: "#EC4899" },
];

export default function DocumentFieldPlacer({
  pdfUrl,
  recipients,
  fields,
  onFieldsChange,
}: DocumentFieldPlacerProps) {
  const [selectedRecipient, setSelectedRecipient] = useState<string>(recipients[0]?.id || "");
  const [selectedFieldType, setSelectedFieldType] = useState<SignatureField["type"]>("signature");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages] = useState(1); // iframes don't expose page count; kept for nav UI
  const [isAutoDetecting, setIsAutoDetecting] = useState(false);
  const [placementMode, setPlacementMode] = useState(true); // click-to-place is always active
  const overlayRef = useRef<HTMLDivElement>(null);

  const getRecipientStyle = (recipientId: string) => {
    const index = recipients.findIndex((r) => r.id === recipientId);
    return recipientColorStyles[index % recipientColorStyles.length];
  };

  const pageFields = fields.filter((f) => f.pageNumber === currentPage);

  // Click anywhere on document overlay → place field
  const handleOverlayClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!selectedRecipient) {
        toast.error("Please select a recipient first");
        return;
      }
      // Ignore clicks on existing field elements
      if ((e.target as HTMLElement).closest("[data-field]")) return;

      const rect = overlayRef.current!.getBoundingClientRect();
      const xPct = ((e.clientX - rect.left) / rect.width) * 100;
      const yPct = ((e.clientY - rect.top) / rect.height) * 100;

      const fieldConfig = fieldTypes.find((f) => f.type === selectedFieldType)!;
      const today = new Date().toLocaleDateString("en-AE");
      const recipientName = recipients.find((r) => r.id === selectedRecipient)?.name || "";

      const newField: SignatureField = {
        id: crypto.randomUUID(),
        recipientId: selectedRecipient,
        type: selectedFieldType,
        pageNumber: currentPage,
        x: Math.max(0, Math.min(95, xPct)),
        y: Math.max(0, Math.min(95, yPct)),
        width: fieldConfig.defaultWidth,
        height: fieldConfig.defaultHeight,
        value:
          selectedFieldType === "date"
            ? today
            : selectedFieldType === "text"
            ? ""
            : undefined,
      };

      onFieldsChange([...fields, newField]);
      toast.success(`${fieldConfig.label} field added — drag to reposition`);
    },
    [selectedRecipient, selectedFieldType, currentPage, fields, onFieldsChange, recipients]
  );

  const removeField = (fieldId: string) => {
    onFieldsChange(fields.filter((f) => f.id !== fieldId));
  };

  const updateFieldValue = (fieldId: string, value: string) => {
    onFieldsChange(fields.map((f) => (f.id === fieldId ? { ...f, value } : f)));
  };

  // Drag-to-reposition
  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const fieldId = e.dataTransfer.getData("fieldId");
      if (!fieldId || !overlayRef.current) return;
      const rect = overlayRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      onFieldsChange(
        fields.map((f) =>
          f.id === fieldId
            ? { ...f, x: Math.max(0, Math.min(95, x)), y: Math.max(0, Math.min(95, y)) }
            : f
        )
      );
    },
    [fields, onFieldsChange]
  );

  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  const handleDragStart = (e: React.DragEvent, fieldId: string) => {
    e.dataTransfer.setData("fieldId", fieldId);
  };

  // Auto-detect via Gemini
  const handleAutoDetect = async () => {
    if (!selectedRecipient) {
      toast.error("Please select a recipient first");
      return;
    }
    setIsAutoDetecting(true);
    try {
      const { data, error } = await supabase.functions.invoke("esign-auto-detect-fields", {
        body: {
          pdfUrl,
          recipientId: selectedRecipient,
          recipientName: recipients.find((r) => r.id === selectedRecipient)?.name || "",
        },
      });

      if (error) throw error;

      const detected: SignatureField[] = (data.fields || []).map((f: any) => ({
        id: crypto.randomUUID(),
        recipientId: selectedRecipient,
        type: f.type,
        pageNumber: f.pageNumber || currentPage,
        x: f.x,
        y: f.y,
        width: f.width || fieldTypes.find((ft) => ft.type === f.type)?.defaultWidth || 160,
        height: f.height || fieldTypes.find((ft) => ft.type === f.type)?.defaultHeight || 36,
        value: f.suggestedValue || undefined,
        label: f.label || undefined,
      }));

      onFieldsChange([...fields, ...detected]);
      toast.success(`Auto-detected ${detected.length} field(s) — review and adjust as needed`);
    } catch (err: any) {
      console.error("Auto-detect error:", err);
      toast.error("Auto-detect failed. Placing smart defaults instead.");
      // Fallback: standard contract layout
      const today = new Date().toLocaleDateString("en-AE");
      const recipientName = recipients.find((r) => r.id === selectedRecipient)?.name || "";
      const fallbackFields: SignatureField[] = [
        { id: crypto.randomUUID(), recipientId: selectedRecipient, type: "text", pageNumber: currentPage, x: 10, y: 8, width: 160, height: 36, value: recipientName, label: "Name" },
        { id: crypto.randomUUID(), recipientId: selectedRecipient, type: "text", pageNumber: currentPage, x: 55, y: 8, width: 160, height: 36, value: "", label: "Title" },
        { id: crypto.randomUUID(), recipientId: selectedRecipient, type: "date", pageNumber: currentPage, x: 10, y: 88, width: 140, height: 36, value: today, label: "Date" },
        { id: crypto.randomUUID(), recipientId: selectedRecipient, type: "signature", pageNumber: currentPage, x: 55, y: 85, width: 180, height: 52, label: "Signature" },
        { id: crypto.randomUUID(), recipientId: selectedRecipient, type: "initials", pageNumber: currentPage, x: 88, y: 88, width: 90, height: 40, label: "Initials" },
      ];
      onFieldsChange([...fields, ...fallbackFields]);
    } finally {
      setIsAutoDetecting(false);
    }
  };

  const clearAllFields = () => {
    onFieldsChange(fields.filter((f) => f.pageNumber !== currentPage));
    toast.info("All fields on this page cleared");
  };

  return (
    <div className="space-y-4">
      {/* ─── Toolbar ─── */}
      <div className="flex flex-wrap items-center gap-3 p-3 bg-muted/40 rounded-xl border">
        {/* Recipient selector */}
        <div className="flex items-center gap-2 min-w-[180px]">
          <User className="w-4 h-4 text-muted-foreground shrink-0" />
          <Select value={selectedRecipient} onValueChange={setSelectedRecipient}>
            <SelectTrigger className="h-9 text-sm">
              <SelectValue placeholder="Select recipient" />
            </SelectTrigger>
            <SelectContent>
              {recipients.map((recipient, index) => (
                <SelectItem key={recipient.id} value={recipient.id}>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ background: recipientColorStyles[index % recipientColorStyles.length].hex }}
                    />
                    {recipient.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="w-px h-8 bg-border" />

        {/* Field type buttons */}
        <div className="flex gap-1.5 flex-wrap">
          {fieldTypes.map(({ type, label, icon: Icon }) => (
            <Button
              key={type}
              variant={selectedFieldType === type ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedFieldType(type)}
              className={`h-9 gap-1.5 text-sm font-medium ${
                selectedFieldType === type
                  ? "bg-[hsl(var(--gold))] hover:bg-[hsl(var(--gold)/.9)] text-white border-transparent"
                  : "hover:border-[hsl(var(--gold)/.5)]"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </Button>
          ))}
        </div>

        <div className="w-px h-8 bg-border" />

        {/* Auto Detect + Clear */}
        <Button
          onClick={handleAutoDetect}
          disabled={isAutoDetecting}
          size="sm"
          className="h-9 bg-[hsl(var(--gold))] hover:bg-[hsl(var(--gold)/.9)] text-white font-medium gap-1.5"
        >
          {isAutoDetecting ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Wand2 className="w-3.5 h-3.5" />
          )}
          {isAutoDetecting ? "Detecting…" : "Auto Detect Fields"}
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={clearAllFields}
          className="h-9 text-destructive border-destructive/30 hover:bg-destructive/5"
        >
          <Trash2 className="w-3.5 h-3.5 mr-1" />
          Clear Page
        </Button>
      </div>

      {/* Click-mode hint */}
      <div className="flex items-center gap-2 px-1">
        <Badge variant="outline" className="text-xs text-muted-foreground border-dashed">
          💡 Click anywhere on the document to place the selected field type
        </Badge>
      </div>

      {/* ─── Main Layout ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Document + Overlay */}
        <div className="lg:col-span-2">
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              {/* Clickable/droppable overlay wrapping the iframe */}
              <div
                ref={overlayRef}
                className="relative w-full"
                style={{ height: "780px", cursor: "crosshair" }}
                onClick={handleOverlayClick}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
              >
                {/* Actual PDF */}
                <iframe
                  src={`${pdfUrl}#toolbar=0&navpanes=0`}
                  className="absolute inset-0 w-full h-full border-0 pointer-events-none"
                  title="Document Preview"
                />

                {/* Transparent interaction layer */}
                <div className="absolute inset-0 z-10" />

                {/* Field overlays */}
                {pageFields.map((field) => {
                  const style = getRecipientStyle(field.recipientId);
                  const fieldConfig = fieldTypes.find((f) => f.type === field.type)!;
                  const Icon = fieldConfig.icon;

                  return (
                    <div
                      key={field.id}
                      data-field="true"
                      draggable
                      onDragStart={(e) => handleDragStart(e, field.id)}
                      onClick={(e) => e.stopPropagation()}
                      className={`absolute z-20 rounded border-2 shadow-md ${style.border} ${style.light} group`}
                      style={{
                        left: `${field.x}%`,
                        top: `${field.y}%`,
                        width: `${field.width}px`,
                        height: `${field.height}px`,
                        cursor: "move",
                      }}
                    >
                      {/* Delete button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeField(field.id);
                        }}
                        className="absolute -top-2.5 -right-2.5 z-30 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full items-center justify-center hidden group-hover:flex shadow"
                      >
                        <X className="w-3 h-3" />
                      </button>

                      {/* Field content */}
                      {field.type === "text" ? (
                        <input
                          type="text"
                          value={field.value || ""}
                          onChange={(e) => updateFieldValue(field.id, e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          placeholder={field.label || "Type here…"}
                          className={`w-full h-full px-2 text-sm bg-transparent border-0 outline-none ${style.text} placeholder:text-muted-foreground/60`}
                          style={{ cursor: "text" }}
                        />
                      ) : field.type === "date" ? (
                        <div className="flex items-center gap-1 px-2 h-full">
                          <Icon className={`w-3.5 h-3.5 shrink-0 ${style.text}`} />
                          <input
                            type="text"
                            value={field.value || ""}
                            onChange={(e) => updateFieldValue(field.id, e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            placeholder="Date"
                            className={`flex-1 min-w-0 text-xs bg-transparent border-0 outline-none ${style.text}`}
                            style={{ cursor: "text" }}
                          />
                        </div>
                      ) : (
                        <div className={`flex items-center justify-center gap-1 h-full px-2 ${style.text}`}>
                          <Icon className="w-4 h-4 shrink-0" />
                          <span className="text-xs font-semibold truncate">{fieldConfig.label}</span>
                        </div>
                      )}

                      {/* Recipient color bar */}
                      <div
                        className={`absolute bottom-0 left-0 right-0 h-0.5 rounded-b ${style.bg}`}
                      />
                    </div>
                  );
                })}
              </div>

              {/* Page navigation */}
              <div className="flex items-center justify-center gap-4 px-4 py-2 border-t bg-muted/30">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="h-8 w-8"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm text-muted-foreground">Page {currentPage}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setCurrentPage((p) => p + 1)}
                  className="h-8 w-8"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar: fields list + legend */}
        <div className="space-y-4">
          {/* Placed Fields */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-3 flex items-center justify-between">
                Placed Fields
                <Badge variant="secondary">{fields.length}</Badge>
              </h3>
              {fields.length === 0 ? (
                <div className="text-center py-8">
                  <PenTool className="w-8 h-8 mx-auto mb-2 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">
                    Click on the document to place fields
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5 max-h-[340px] overflow-y-auto pr-1">
                  {fields.map((field) => {
                    const recipient = recipients.find((r) => r.id === field.recipientId);
                    const fieldConfig = fieldTypes.find((f) => f.type === field.type);
                    const Icon = fieldConfig?.icon || PenTool;
                    const style = getRecipientStyle(field.recipientId);

                    return (
                      <div
                        key={field.id}
                        className="flex items-center justify-between p-2 rounded-lg bg-muted/40 hover:bg-muted/70 transition-colors"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ background: style.hex }}
                          />
                          <Icon className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
                          <div className="min-w-0">
                            <p className="text-xs font-medium truncate">
                              {field.label || fieldConfig?.label}
                              {field.value ? ` — ${field.value}` : ""}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {recipient?.name} · p{field.pageNumber}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 shrink-0"
                          onClick={() => removeField(field.id)}
                        >
                          <Trash2 className="w-3 h-3 text-red-500" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recipients legend */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-3">Recipients</h3>
              <div className="space-y-2">
                {recipients.map((recipient, index) => {
                  const style = recipientColorStyles[index % recipientColorStyles.length];
                  const count = fields.filter((f) => f.recipientId === recipient.id).length;
                  return (
                    <div key={recipient.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ background: style.hex }}
                        />
                        <span className="text-sm truncate">{recipient.name}</span>
                      </div>
                      <Badge variant={count > 0 ? "default" : "outline"} className="text-xs">
                        {count} field{count !== 1 ? "s" : ""}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Instructions */}
          <Card className="bg-muted/30">
            <CardContent className="p-4">
              <h4 className="text-sm font-semibold mb-2">How to place fields</h4>
              <ol className="text-xs text-muted-foreground space-y-1.5 list-decimal list-inside">
                <li>Select the recipient above</li>
                <li>Choose a field type (Signature, Initials, Date, Text)</li>
                <li>Click anywhere on the document to place it</li>
                <li>Drag placed fields to reposition them</li>
                <li>Type directly inside Text or Date fields</li>
                <li>Or use <strong>Auto Detect</strong> for AI placement</li>
              </ol>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
