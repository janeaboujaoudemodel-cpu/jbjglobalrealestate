import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle, XCircle, Loader2, Mail, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

const Unsubscribe = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "resubscribed" | "error">("loading");
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      return;
    }
    
    const unsubscribe = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("unsubscribe-newsletter", {
          body: { token, source: "email_link" },
        });
        if (error) throw error;
        setEmail(data?.email || "");
        setStatus("success");
      } catch {
        setStatus("error");
      }
    };
    
    unsubscribe();
  }, [token]);

  const handleResubscribe = async () => {
    setStatus("loading");
    try {
      const { error } = await supabase.functions.invoke("resubscribe-newsletter", {
        body: { token },
      });
      if (error) throw error;
      setStatus("resubscribed");
    } catch {
      setStatus("error");
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="max-w-md w-full rounded-2xl border border-border bg-[linear-gradient(135deg,hsl(var(--champagne-1)),hsl(var(--champagne-2)),hsl(var(--champagne-3)))] p-8 text-center space-y-6">
        {/* Logo */}
        <div>
          <p className="text-2xl font-bold text-gold tracking-widest font-serif">JBJ GLOBAL</p>
          <p className="text-xs tracking-[0.3em] text-muted-foreground">REAL ESTATE</p>
        </div>

        {status === "loading" && (
          <div className="space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-gold mx-auto" />
            <p className="text-muted-foreground">Processing your request...</p>
          </div>
        )}

        {status === "success" && (
          <div className="space-y-6">
            <div className="mx-auto w-20 h-20 rounded-full bg-emerald-500/10 border-2 border-emerald-500/40 flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-emerald-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">You Have Been Unsubscribed</h1>
              {email && <p className="text-sm text-muted-foreground mt-2">{email}</p>}
              <p className="text-muted-foreground mt-4">
                You will no longer receive marketing communications from JBJ Global Real Estate.
              </p>
              <p className="text-muted-foreground mt-2">You may resubscribe at any time.</p>
            </div>
            <Button variant="primary" onClick={handleResubscribe} className="w-full">
              <RotateCcw className="w-4 h-4 mr-2" />
              Resubscribe
            </Button>
          </div>
        )}

        {status === "resubscribed" && (
          <div className="space-y-6">
            <div className="mx-auto w-20 h-20 rounded-full bg-gold/10 border-2 border-gold/40 flex items-center justify-center">
              <Mail className="w-10 h-10 text-gold" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Welcome Back!</h1>
              <p className="text-muted-foreground mt-4">
                You have been resubscribed to JBJ Global Real Estate updates.
              </p>
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="space-y-6">
            <div className="mx-auto w-20 h-20 rounded-full bg-destructive/10 border-2 border-destructive/40 flex items-center justify-center">
              <XCircle className="w-10 h-10 text-destructive" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Something Went Wrong</h1>
              <p className="text-muted-foreground mt-4">
                We couldn't process your request. The link may be invalid or expired.
              </p>
            </div>
          </div>
        )}

        <div className="pt-4 border-t border-border">
          <Link to="/" className="text-sm text-gold hover:underline">
            ← Back to JBJ Global Real Estate
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Unsubscribe;
