import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  PenTool, 
  Type, 
  Calendar, 
  Trash2,
  Plus,
  User
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
}

interface DocumentFieldPlacerProps {
  pdfUrl: string;
  recipients: Recipient[];
  fields: SignatureField[];
  onFieldsChange: (fields: SignatureField[]) => void;
}

const fieldTypes = [
  { type: "signature" as const, label: "Signature", icon: PenTool, defaultWidth: 200, defaultHeight: 50 },
  { type: "initials" as const, label: "Initials", icon: Type, defaultWidth: 100, defaultHeight: 40 },
  { type: "date" as const, label: "Date", icon: Calendar, defaultWidth: 120, defaultHeight: 30 },
  { type: "text" as const, label: "Text", icon: Type, defaultWidth: 150, defaultHeight: 30 },
];

const recipientColors = [
  "bg-blue-500",
  "bg-green-500",
  "bg-purple-500",
  "bg-orange-500",
  "bg-pink-500",
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

  const getRecipientColor = (recipientId: string) => {
    const index = recipients.findIndex(r => r.id === recipientId);
    return recipientColors[index % recipientColors.length];
  };

  const addField = useCallback(() => {
    if (!selectedRecipient) return;

    const fieldConfig = fieldTypes.find(f => f.type === selectedFieldType);
    if (!fieldConfig) return;

    const newField: SignatureField = {
      id: crypto.randomUUID(),
      recipientId: selectedRecipient,
      type: selectedFieldType,
      pageNumber: currentPage,
      x: 50, // Default position (percentage)
      y: 50,
      width: fieldConfig.defaultWidth,
      height: fieldConfig.defaultHeight,
    };

    onFieldsChange([...fields, newField]);
  }, [selectedRecipient, selectedFieldType, currentPage, fields, onFieldsChange]);

  const removeField = (fieldId: string) => {
    onFieldsChange(fields.filter(f => f.id !== fieldId));
  };

  const updateFieldPosition = (fieldId: string, x: number, y: number) => {
    onFieldsChange(
      fields.map(f => f.id === fieldId ? { ...f, x, y } : f)
    );
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const fieldId = e.dataTransfer.getData("fieldId");
    const rect = e.currentTarget.getBoundingClientRect();
    
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    updateFieldPosition(fieldId, Math.max(0, Math.min(100, x)), Math.max(0, Math.min(100, y)));
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDragStart = (e: React.DragEvent, fieldId: string) => {
    e.dataTransfer.setData("fieldId", fieldId);
  };

  const pageFields = fields.filter(f => f.pageNumber === currentPage);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-4 p-4 bg-muted/50 rounded-lg">
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-muted-foreground" />
          <Select value={selectedRecipient} onValueChange={setSelectedRecipient}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select recipient" />
            </SelectTrigger>
            <SelectContent>
              {recipients.map((recipient, index) => (
                <SelectItem key={recipient.id} value={recipient.id}>
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${recipientColors[index % recipientColors.length]}`} />
                    {recipient.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          {fieldTypes.map(({ type, label, icon: Icon }) => (
            <Button
              key={type}
              variant={selectedFieldType === type ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedFieldType(type)}
              className={selectedFieldType === type ? "bg-gold hover:bg-gold/90" : ""}
            >
              <Icon className="w-4 h-4 mr-1" />
              {label}
            </Button>
          ))}
        </div>

        <Button onClick={addField} className="bg-gold hover:bg-gold/90">
          <Plus className="w-4 h-4 mr-2" />
          Add Field
        </Button>
      </div>

      {/* Document Preview with Fields */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Document Area */}
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-4">
              <div 
                className="relative bg-white border rounded-lg overflow-hidden"
                style={{ minHeight: "500px" }}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
              >
                {/* PDF Preview (simplified - shows placeholder) */}
                <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                  <div className="text-center text-muted-foreground">
                    <PenTool className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Document Preview</p>
                    <p className="text-xs">Drag fields to position them</p>
                  </div>
                </div>

                {/* Placed Fields */}
                {pageFields.map((field) => {
                  const recipient = recipients.find(r => r.id === field.recipientId);
                  const fieldConfig = fieldTypes.find(f => f.type === field.type);
                  const Icon = fieldConfig?.icon || PenTool;
                  
                  return (
                    <div
                      key={field.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, field.id)}
                      className={`absolute cursor-move border-2 rounded flex items-center justify-center gap-1 text-white text-xs font-medium ${getRecipientColor(field.recipientId)}`}
                      style={{
                        left: `${field.x}%`,
                        top: `${field.y}%`,
                        width: `${field.width}px`,
                        height: `${field.height}px`,
                        transform: "translate(-50%, -50%)",
                      }}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{fieldConfig?.label}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeField(field.id);
                        }}
                        className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Fields List */}
        <div>
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-3">Placed Fields</h3>
              
              {fields.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No fields added yet. Select a recipient and field type, then click "Add Field".
                </p>
              ) : (
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {fields.map((field) => {
                    const recipient = recipients.find(r => r.id === field.recipientId);
                    const fieldConfig = fieldTypes.find(f => f.type === field.type);
                    const Icon = fieldConfig?.icon || PenTool;
                    
                    return (
                      <div
                        key={field.id}
                        className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${getRecipientColor(field.recipientId)}`} />
                          <Icon className="w-4 h-4" />
                          <div>
                            <p className="text-sm font-medium">{fieldConfig?.label}</p>
                            <p className="text-xs text-muted-foreground">{recipient?.name}</p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeField(field.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Legend */}
          <Card className="mt-4">
            <CardContent className="p-4">
              <h3 className="font-semibold mb-3">Recipients</h3>
              <div className="space-y-2">
                {recipients.map((recipient, index) => (
                  <div key={recipient.id} className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${recipientColors[index % recipientColors.length]}`} />
                    <span className="text-sm">{recipient.name}</span>
                    <span className="text-xs text-muted-foreground">
                      ({fields.filter(f => f.recipientId === recipient.id).length} fields)
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
