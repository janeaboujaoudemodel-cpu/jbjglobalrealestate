import { CertificatePreview } from "@/components/certification";
export default function CertCheck() {
  return (
    <div className="min-h-screen bg-[#F7F2EA] p-8">
      <div className="mx-auto max-w-3xl"><CertificatePreview isLocked /></div>
    </div>
  );
}
