import { Link, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

export default function CheckoutReturn() {
  const [params] = useSearchParams();
  const sessionId = params.get("session_id");

  return (
    <>
      <Helmet>
        <title>Payment complete | JBJ Global Real Estate</title>
      </Helmet>
      <main className="min-h-[70vh] grid place-items-center px-4 py-16">
        <div className="max-w-lg w-full text-center bg-white/80 backdrop-blur rounded-2xl border border-[#B89555]/30 p-8 shadow-[0_20px_60px_-30px_rgba(6,78,59,0.25)]">
          <CheckCircle2 className="mx-auto h-14 w-14 text-[#064E3B] mb-4" />
          <h1 className="font-cormorant text-3xl md:text-4xl text-[#1A1A1A] mb-2">
            {sessionId ? "Payment received" : "Checkout complete"}
          </h1>
          <p className="text-[#4A4A4A] mb-6">
            {sessionId
              ? "Thank you — your JBJ subscription is being activated. You will receive a confirmation email within a few minutes."
              : "We could not find a checkout session. If this looks wrong, please contact support."}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button variant="primary" asChild>
              <Link to="/">Return home</Link>
            </Button>
            <Button variant="secondary" asChild>
              <Link to="/account">Go to my account</Link>
            </Button>
          </div>
          {sessionId ? (
            <p className="mt-6 text-xs text-[#4A4A4A]/70">Session: {sessionId}</p>
          ) : null}
        </div>
      </main>
    </>
  );
}
