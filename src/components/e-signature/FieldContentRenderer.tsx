import { CheckSquare, Pencil, Stamp } from "lucide-react";
import type { SignatureField, Recipient } from "./documentFieldTypes";
import { fieldTypes, getInitials, recipientColorStyles } from "./documentFieldTypes";

interface FieldContentRendererProps {
  field: SignatureField;
  style: typeof recipientColorStyles[0];
  recipients: Recipient[];
  savedStampSvg: string | null;
  savedSignatureUrl: string | null;
  onUpdateValue: (fieldId: string, value: string) => void;
  onOpenDraw: (fieldId: string) => void;
}

export default function FieldContentRenderer({
  field, style, recipients, savedStampSvg, savedSignatureUrl,
  onUpdateValue, onOpenDraw,
}: FieldContentRendererProps) {
  const fieldConfig = fieldTypes.find((f) => f.type === field.type)!;
  const Icon = fieldConfig.icon;
  const recipient = recipients.find((r) => r.id === field.recipientId);

  if (field.type === "stamp") {
    return (
      <div className="flex items-center justify-center h-full w-full overflow-hidden">
        {savedStampSvg ? (
          <div
            className="w-full h-full flex items-center justify-center opacity-85"
            dangerouslySetInnerHTML={{
              __html: savedStampSvg
                .replace(/width="[^"]*"/, `width="${field.width - 4}"`)
                .replace(/height="[^"]*"/, `height="${field.height - 4}"`),
            }}
          />
        ) : (
          <div className={`flex flex-col items-center justify-center gap-0.5 ${style.text}`}>
            <Stamp className="w-6 h-6" />
            <span className="text-[9px] font-medium">Company Stamp</span>
          </div>
        )}
      </div>
    );
  }

  if (field.type === "checkbox") {
    return (
      <div
        className={`flex items-center justify-center h-full cursor-pointer ${style.text}`}
        onClick={(e) => {
          e.stopPropagation();
          onUpdateValue(field.id, field.value === "checked" ? "" : "checked");
        }}
      >
        {field.value === "checked" ? (
          <CheckSquare className="w-5 h-5" />
        ) : (
          <div className={`w-5 h-5 border-2 rounded ${style.border}`} />
        )}
      </div>
    );
  }

  if (field.type === "text") {
    return (
      <input
        type="text"
        value={field.value || ""}
        onChange={(e) => onUpdateValue(field.id, e.target.value)}
        onClick={(e) => e.stopPropagation()}
        placeholder={field.label || "Type here…"}
        className={`w-full h-full px-2 text-sm bg-transparent border-0 outline-none ${style.text} placeholder:text-muted-foreground/60`}
        style={{ cursor: "text" }}
      />
    );
  }

  if (field.type === "date") {
    return (
      <div className="flex items-center gap-1 px-2 h-full">
        <Icon className={`w-3.5 h-3.5 shrink-0 ${style.text}`} />
        <input
          type="text"
          value={field.value || ""}
          onChange={(e) => onUpdateValue(field.id, e.target.value)}
          onClick={(e) => e.stopPropagation()}
          placeholder="Date"
          className={`flex-1 min-w-0 text-xs bg-transparent border-0 outline-none ${style.text}`}
          style={{ cursor: "text" }}
        />
      </div>
    );
  }

  if (field.type === "signature") {
    const sigUrl = field.value?.startsWith("data:") ? field.value : savedSignatureUrl;
    if (sigUrl) {
      return (
        <div
          className="flex items-center justify-center h-full w-full overflow-hidden cursor-pointer"
          onClick={(e) => { e.stopPropagation(); onOpenDraw(field.id); }}
        >
          <img
            src={sigUrl}
            alt="Signature"
            className={`max-w-full max-h-full object-contain ${!field.value?.startsWith("data:") ? "opacity-80" : ""}`}
            draggable={false}
          />
        </div>
      );
    }
    return (
      <div
        className={`flex items-center justify-center gap-1 h-full px-2 cursor-pointer ${style.text}`}
        onClick={(e) => { e.stopPropagation(); onOpenDraw(field.id); }}
      >
        <Pencil className="w-4 h-4 shrink-0" />
        <span className="text-xs font-semibold truncate">Click to sign</span>
      </div>
    );
  }

  if (field.type === "initials") {
    const initials = getInitials(recipient?.name || "");
    return (
      <div className={`flex items-center justify-center h-full px-2 ${style.text}`}>
        <span className="text-lg font-bold tracking-wide">{initials || "?"}</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-center gap-1 h-full px-2 ${style.text}`}>
      <Icon className="w-4 h-4 shrink-0" />
      <span className="text-xs font-semibold truncate">{fieldConfig.label}</span>
    </div>
  );
}
