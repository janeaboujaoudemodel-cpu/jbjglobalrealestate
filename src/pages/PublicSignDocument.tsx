import { Link } from "react-router-dom";

export default function PublicSignDocument() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FDFBF7] p-6">
      <div className="max-w-md text-center bg-[#F7F2EA] border border-[#B89555]/30 rounded-xl p-8">
        <h1 className="text-xl font-semibold text-[#1A1A1A] mb-2">
          This signing link is no longer valid
        </h1>
        <p className="text-sm text-[#1A1A1A]/70 mb-6">
          We've upgraded our e-signature system. Please contact{" "}
          <a className="text-[#B89555] underline" href="mailto:contact@jbj.ae">
            contact@jbj.ae
          </a>{" "}
          to request a new agreement link.
        </p>
        <Link
          to="/"
          className="inline-block px-4 py-2 rounded bg-[#B89555] text-white text-sm font-medium hover:bg-[#A08047]"
        >
          Return to JBJ
        </Link>
      </div>
    </div>
  );
}
