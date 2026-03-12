// ─── Types ─────────────────────────────────────────────────────────────────
export interface Recipient {
  id: string;
  name: string;
  email: string;
}

export interface SignatureField {
  id: string;
  recipientId: string;
  type: "signature" | "initials" | "date" | "text" | "checkbox" | "stamp";
  pageNumber: number;
  x: number;
  y: number;
  width: number;
  height: number;
  value?: string;
  label?: string;
}

export interface DocumentFieldPlacerProps {
  pdfUrl: string;
  pdfFile?: File | null;
  recipients: Recipient[];
  fields: SignatureField[];
  onFieldsChange: (fields: SignatureField[]) => void;
}

// ─── Constants ─────────────────────────────────────────────────────────────
import {
  PenTool, Type, Calendar, AlignLeft, CheckSquare, Stamp,
} from "lucide-react";

export const fieldTypes = [
  { type: "signature" as const, label: "Signature", icon: PenTool, defaultWidth: 180, defaultHeight: 52 },
  { type: "initials" as const, label: "Initials", icon: AlignLeft, defaultWidth: 90, defaultHeight: 40 },
  { type: "date" as const, label: "Date", icon: Calendar, defaultWidth: 140, defaultHeight: 36 },
  { type: "text" as const, label: "Text", icon: Type, defaultWidth: 160, defaultHeight: 36 },
  { type: "checkbox" as const, label: "Checkbox", icon: CheckSquare, defaultWidth: 28, defaultHeight: 28 },
  { type: "stamp" as const, label: "Stamp", icon: Stamp, defaultWidth: 100, defaultHeight: 100 },
];

export const recipientColorStyles = [
  { bg: "bg-blue-500", border: "border-blue-500", text: "text-blue-700", light: "bg-blue-50", hex: "#3B82F6" },
  { bg: "bg-emerald-500", border: "border-emerald-500", text: "text-emerald-700", light: "bg-emerald-50", hex: "#10B981" },
  { bg: "bg-purple-500", border: "border-purple-500", text: "text-purple-700", light: "bg-purple-50", hex: "#8B5CF6" },
  { bg: "bg-orange-500", border: "border-orange-500", text: "text-orange-700", light: "bg-orange-50", hex: "#F97316" },
  { bg: "bg-pink-500", border: "border-pink-500", text: "text-pink-700", light: "bg-pink-50", hex: "#EC4899" },
];

// ─── Helpers ───────────────────────────────────────────────────────────────
export function getInitials(name: string): string {
  return name.split(/\s+/).filter(Boolean).map((w) => w[0].toUpperCase()).join("");
}

export function getRecipientStyle(recipients: Recipient[], recipientId: string) {
  const index = recipients.findIndex((r) => r.id === recipientId);
  return recipientColorStyles[index % recipientColorStyles.length];
}

// ─── PDF.js loader ─────────────────────────────────────────────────────────
declare global {
  interface Window { pdfjsLib: any; }
}

export async function loadPdfJs(): Promise<any> {
  if (window.pdfjsLib) return window.pdfjsLib;
  await new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
    script.onload = () => resolve();
    script.onerror = reject;
    document.head.appendChild(script);
  });
  window.pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
  return window.pdfjsLib;
}

export async function renderPageThumbnail(
  pdfDoc: any, pageNum: number, canvas: HTMLCanvasElement, thumbWidth = 120
) {
  const page = await pdfDoc.getPage(pageNum);
  const viewport = page.getViewport({ scale: 1 });
  const scale = thumbWidth / viewport.width;
  const scaledViewport = page.getViewport({ scale });
  canvas.width = scaledViewport.width;
  canvas.height = scaledViewport.height;
  const ctx = canvas.getContext("2d")!;
  await page.render({ canvasContext: ctx, viewport: scaledViewport }).promise;
}
