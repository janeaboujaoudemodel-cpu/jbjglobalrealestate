import React from "react";
import { cn } from "@/lib/utils";

interface AuditDiffViewerProps {
  oldValues: Record<string, unknown> | null;
  newValues: Record<string, unknown> | null;
  changedFields?: string[] | null;
}

function formatValue(val: unknown): string {
  if (val === null || val === undefined) return "—";
  if (typeof val === "object") return JSON.stringify(val, null, 2);
  return String(val);
}

function getAllKeys(a: Record<string, unknown> | null, b: Record<string, unknown> | null): string[] {
  const keys = new Set<string>();
  if (a) Object.keys(a).forEach((k) => keys.add(k));
  if (b) Object.keys(b).forEach((k) => keys.add(k));
  return Array.from(keys).sort();
}

const AuditDiffViewer: React.FC<AuditDiffViewerProps> = ({ oldValues, newValues, changedFields }) => {
  if (!oldValues && !newValues) {
    return <p className="text-sm text-muted-foreground italic">No diff data available</p>;
  }

  const allKeys = getAllKeys(oldValues, newValues);
  const changedSet = new Set(changedFields || []);

  return (
    <div className="rounded-lg border border-border overflow-hidden text-xs">
      {/* Header */}
      <div className="grid grid-cols-3 bg-muted/50 border-b border-border font-semibold">
        <div className="px-3 py-2 text-muted-foreground">Field</div>
        <div className="px-3 py-2 text-muted-foreground">Before</div>
        <div className="px-3 py-2 text-muted-foreground">After</div>
      </div>

      {/* Rows */}
      {allKeys.map((key) => {
        const oldVal = oldValues?.[key];
        const newVal = newValues?.[key];
        const isChanged = changedSet.size > 0 ? changedSet.has(key) : formatValue(oldVal) !== formatValue(newVal);
        const isAdded = oldVal === undefined && newVal !== undefined;
        const isRemoved = oldVal !== undefined && newVal === undefined;

        return (
          <div
            key={key}
            className={cn(
              "grid grid-cols-3 border-b border-border last:border-b-0",
              isAdded && "bg-green-500/5",
              isRemoved && "bg-red-500/5",
              isChanged && !isAdded && !isRemoved && "bg-amber-500/5"
            )}
          >
            <div className="px-3 py-1.5 font-medium text-foreground break-all">
              {key.replace(/_/g, " ")}
              {isAdded && <span className="ml-1 text-green-600 text-[10px]">NEW</span>}
              {isRemoved && <span className="ml-1 text-red-600 text-[10px]">DEL</span>}
            </div>
            <div className={cn(
              "px-3 py-1.5 break-all font-mono",
              isChanged && "text-red-600 line-through"
            )}>
              {formatValue(oldVal)}
            </div>
            <div className={cn(
              "px-3 py-1.5 break-all font-mono",
              isChanged && "text-green-600 font-semibold"
            )}>
              {formatValue(newVal)}
            </div>
          </div>
        );
      })}

      {allKeys.length === 0 && (
        <div className="px-3 py-4 text-center text-muted-foreground">No fields to display</div>
      )}
    </div>
  );
};

export default AuditDiffViewer;
