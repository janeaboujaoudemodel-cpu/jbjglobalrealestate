import { ReactNode } from "react";
import { Label } from "@/components/ui/label";

interface Props {
  label: string;
  required?: boolean;
  hint?: string;
  children: ReactNode;
}

export default function Field({ label, required, hint, children }: Props) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-[11px] tracking-[0.18em] uppercase text-[#1A1A1A]/70">
        {label} {required && <span className="text-[#8B0000]">*</span>}
      </Label>
      {children}
      {hint && <p className="text-[11px] text-[#1A1A1A]/50">{hint}</p>}
    </div>
  );
}
