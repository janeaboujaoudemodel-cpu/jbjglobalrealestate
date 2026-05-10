import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { CheckCircle, AlertCircle, Loader2, Ticket, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

const ReopenTicket = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "error" | "already_open">("loading");
  const [message, setMessage] = useState("");
  const [ticketNumber, setTicketNumber] = useState("");

  useEffect(() => {
    const reopenTicket = async () => {
      const ticket = searchParams.get("ticket");
      const token = searchParams.get("token");

      if (!ticket || !token) {
        setStatus("error");
        setMessage("Invalid link. Please use the link from your email.");
        return;
      }

      setTicketNumber(ticket);

      try {
        const { data, error } = await supabase.functions.invoke("reopen-ticket", {
          body: { ticketNumber: ticket, token },
        });

        if (error) {
          console.error("Reopen error:", error);
          setStatus("error");
          setMessage(error.message || "Failed to reopen ticket. Please try again.");
          return;
        }

        if (data.message === "Ticket is already open") {
          setStatus("already_open");
          setMessage("This ticket is already open and being reviewed by our team.");
        } else {
          setStatus("success");
          setMessage("Your ticket has been reopened. Our support team will review it shortly.");
        }
      } catch (err) {
        console.error("Reopen error:", err);
        setStatus("error");
        setMessage("An error occurred. Please contact support directly.");
      }
    };

    reopenTicket();
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-zinc-900 to-black flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-gradient-to-br from-zinc-900/90 to-zinc-950/90 rounded-2xl border border-[#B89555]/30 p-8 shadow-[0_0_40px_rgba(200,167,102,0.1)] text-center">
          {status === "loading" && (
            <>
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[#EFE6D6]/20 flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-[#1A1A1A] animate-spin" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-3">Reopening Ticket...</h1>
              <p className="text-white/70">Please wait while we process your request.</p>
            </>
          )}

          {status === "success" && (
            <>
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-green-400" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-3">Ticket Reopened!</h1>
              <div className="bg-[#EFE6D6]/10 border border-[#B89555]/30 rounded-lg p-4 mb-4">
                <p className="text-[#1A1A1A] font-mono font-bold text-lg">{ticketNumber}</p>
              </div>
              <p className="text-white/85 mb-6">{message}</p>
              <p className="text-white/70 text-sm mb-6">
                Our team has been notified and will respond as soon as possible.
              </p>
            </>
          )}

          {status === "already_open" && (
            <>
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-blue-500/20 flex items-center justify-center">
                <Ticket className="w-10 h-10 text-blue-400" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-3">Ticket Already Open</h1>
              <div className="bg-[#EFE6D6]/10 border border-[#B89555]/30 rounded-lg p-4 mb-4">
                <p className="text-[#1A1A1A] font-mono font-bold text-lg">{ticketNumber}</p>
              </div>
              <p className="text-white/85 mb-6">{message}</p>
            </>
          )}

          {status === "error" && (
            <>
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-500/20 flex items-center justify-center">
                <AlertCircle className="w-10 h-10 text-red-400" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-3">Unable to Reopen</h1>
              <p className="text-white/85 mb-6">{message}</p>
              <p className="text-white/70 text-sm mb-6">
                Please contact our support team directly for assistance.
              </p>
            </>
          )}

          <div className="space-y-3">
            <Button
              onClick={() => navigate("/")}
              className="w-full bg-gradient-to-r from-gold to-gold/80 text-[#1A1A1A] font-semibold hover:from-gold/90 hover:to-gold/70"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Return to Homepage
            </Button>
            <a
              href="https://wa.me/971565911000"
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full"
            >
              <Button
                variant="outline"
                className="w-full border-[#B89555]/50 text-[#1A1A1A] hover:bg-[#EFE6D6]/10"
              >
                Contact Support via WhatsApp
              </Button>
            </a>
          </div>
        </div>

        <p className="text-center text-white/90 text-sm mt-6">
          JBJ Global Real Estate Support
        </p>
      </div>
    </div>
  );
};

export default ReopenTicket;
