import { useState } from "react";
import { Eye, EyeOff, Download, XCircle, Pencil, Check, FileText, DollarSign, Layers, ClipboardList, Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface DocItem {
  id: string;
  type: string;
  url: string;
  name?: string | null;
  is_visible?: boolean;
  allow_download?: boolean;
  display_title?: string | null;
}

interface DocumentsManagerProps {
  documents: DocItem[];
  onUpdate: (docs: DocItem[]) => void;
}

function humanizeDocTitle(rawName: string): string {
  let t = rawName
    .replace(/\.[a-z0-9]{2,5}$/i, "")
    .replace(/\(\d+\)\s*$/g, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!t) return rawName;
  return t.replace(/\b\w/g, (c) => c.toUpperCase());
}

const getDocIcon = (type: string) => {
  switch (type) {
    case "brochure": case "fact_sheet": return <FileText className="w-4 h-4" />;
    case "payment_plan": return <DollarSign className="w-4 h-4" />;
    case "floor_plan": return <Layers className="w-4 h-4" />;
    case "inventory": return <ClipboardList className="w-4 h-4" />;
    case "renders": return <Image className="w-4 h-4" />;
    default: return <FileText className="w-4 h-4" />;
  }
};

const getDocTypeLabel = (type: string) => {
  return type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
};

export default function DocumentsManager({ documents, onUpdate }: DocumentsManagerProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  const toggle = (id: string, field: "is_visible" | "allow_download") => {
    const updated = documents.map((d) =>
      d.id === id ? { ...d, [field]: !(d[field] ?? true) } : d
    );
    onUpdate(updated);
  };

  const startEdit = (doc: DocItem) => {
    setEditingId(doc.id);
    setEditTitle(doc.display_title || doc.name || humanizeDocTitle(doc.type));
  };

  const saveEdit = (id: string) => {
    const updated = documents.map((d) =>
      d.id === id ? { ...d, display_title: editTitle.trim() || null } : d
    );
    onUpdate(updated);
    setEditingId(null);
  };

  if (!documents.length) return null;

  return (
    <div className="rounded-xl border-2 border-gold/30 bg-gradient-to-b from-champagne/60 to-champagne-light/40 p-5">
      <h3 className="text-foreground font-semibold text-base mb-4 flex items-center gap-2">
        <FileText className="w-5 h-5 text-gold" />
        Documents Manager
      </h3>
      <p className="text-xs text-muted-foreground mb-4">
        Control visibility and download access for each document. Changes apply when the project is approved.
      </p>

      <div className="space-y-3">
        {documents.map((doc) => {
          const isVisible = doc.is_visible ?? true;
          const canDownload = doc.allow_download ?? true;
          const title = doc.display_title || doc.name || humanizeDocTitle(doc.type);

          return (
            <div
              key={doc.id}
              className={cn(
                "flex items-center gap-3 rounded-lg border p-3 transition-colors",
                isVisible
                  ? "border-gold/30 bg-card"
                  : "border-border/30 bg-muted/30 opacity-60"
              )}
            >
              <div className="w-9 h-9 rounded-lg bg-black flex items-center justify-center flex-shrink-0">
                <span className="text-gold">{getDocIcon(doc.type)}</span>
              </div>

              <div className="flex-1 min-w-0">
                {editingId === doc.id ? (
                  <div className="flex items-center gap-2">
                    <Input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="h-7 text-sm bg-background"
                      onKeyDown={(e) => e.key === "Enter" && saveEdit(doc.id)}
                      autoFocus
                    />
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => saveEdit(doc.id)}>
                      <Check className="w-3.5 h-3.5 text-green-600" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditingId(null)}>
                      <XCircle className="w-3.5 h-3.5 text-red-500" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground truncate">{title}</p>
                    <button
                      onClick={() => startEdit(doc)}
                      className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">{getDocTypeLabel(doc.type)}</p>
              </div>

              <div className="flex items-center gap-4 flex-shrink-0">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  {isVisible ? <Eye className="w-3.5 h-3.5 text-gold" /> : <EyeOff className="w-3.5 h-3.5 text-muted-foreground" />}
                  <Switch
                    checked={isVisible}
                    onCheckedChange={() => toggle(doc.id, "is_visible")}
                    className="scale-75"
                  />
                  <span className="text-[10px] text-muted-foreground">Visible</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer">
                  <Download className={cn("w-3.5 h-3.5", canDownload ? "text-gold" : "text-muted-foreground")} />
                  <Switch
                    checked={canDownload}
                    onCheckedChange={() => toggle(doc.id, "allow_download")}
                    className="scale-75"
                  />
                  <span className="text-[10px] text-muted-foreground">Download</span>
                </label>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
