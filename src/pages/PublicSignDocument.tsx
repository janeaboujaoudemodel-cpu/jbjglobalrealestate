import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import DOMPurify from "dompurify";

export default function PublicSignDocument() {
  const { token } = useParams<{ token: string }>();
  const [doc, setDoc] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [signed, setSigned] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);

  useEffect(() => {
    (async () => {
      if (!token) return;
      const { data, error } = await supabase.functions.invoke("documents-public-fill", {
        body: { action: "get", token },
      });
      if (error) toast.error("Document not found or expired");
      else {
        setDoc(data?.document ?? null);
        if (data?.document?.status === "signed" || data?.document?.status === "completed") setSigned(true);
      }
      setLoading(false);
    })();
  }, [token]);

  const start = (e: React.PointerEvent) => {
    drawing.current = true;
    const c = canvasRef.current!; const r = c.getBoundingClientRect();
    const ctx = c.getContext("2d")!;
    ctx.strokeStyle = "#1A1A1A"; ctx.lineWidth = 2; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(e.clientX - r.left, e.clientY - r.top);
  };
  const move = (e: React.PointerEvent) => {
    if (!drawing.current) return;
    const c = canvasRef.current!; const r = c.getBoundingClientRect();
    const ctx = c.getContext("2d")!;
    ctx.lineTo(e.clientX - r.left, e.clientY - r.top); ctx.stroke();
  };
  const end = () => { drawing.current = false; };
  const clearSig = () => {
    const c = canvasRef.current!; c.getContext("2d")!.clearRect(0, 0, c.width, c.height);
  };

  const submit = async () => {
    const c = canvasRef.current!;
    const dataUrl = c.toDataURL("image/png");
    const { error } = await supabase.functions.invoke("documents-public-fill", {
      body: { action: "sign", token, signature_data_url: dataUrl },
    });
    if (error) toast.error("Failed to submit signature");
    else { setSigned(true); toast.success("Signed. Thank you."); }
  };

  if (loading) return <div className="p-8 text-[#1A1A1A]">Loading…</div>;
  if (!doc) return <div className="p-8 text-[#1A1A1A]">This document link is invalid or expired.</div>;

  return (
    <div className="min-h-screen bg-[#FDFBF7] py-10 px-4">
      <div className="max-w-4xl mx-auto bg-white border border-[#B89555]/40 rounded-md shadow-sm">
        <div className="p-6 border-b border-[#B89555]/30">
          <h1 className="text-xl font-semibold text-[#1A1A1A]">{doc.title}</h1>
          <p className="text-xs text-[#1A1A1A]/60 mt-1">JBJ GLOBAL REAL ESTATE — Property Advertising Agreement</p>
        </div>
        <div
          className="p-6"
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(doc.rendered_html || "") }}
        />
        {!signed ? (
          <div className="p-6 border-t border-[#B89555]/30">
            <p className="text-sm font-semibold text-[#1A1A1A] mb-2">Sign below</p>
            <canvas
              ref={canvasRef} width={600} height={160}
              className="border border-[#B89555]/50 rounded bg-white touch-none w-full max-w-[600px]"
              onPointerDown={start} onPointerMove={move} onPointerUp={end} onPointerLeave={end}
            />
            <div className="flex gap-2 mt-3">
              <Button variant="secondary" onClick={clearSig}>Clear</Button>
              <Button variant="gold" onClick={submit}>Submit Signature</Button>
            </div>
          </div>
        ) : (
          <div className="p-6 border-t border-[#B89555]/30 text-center text-[#1A1A1A]">
            <p className="font-semibold">This document has been signed.</p>
            <p className="text-xs text-[#1A1A1A]/60 mt-1">A copy will be emailed to all parties.</p>
          </div>
        )}
      </div>
    </div>
  );
}
