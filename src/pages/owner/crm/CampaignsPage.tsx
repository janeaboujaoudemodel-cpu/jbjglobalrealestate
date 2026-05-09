import CampaignComposer from "@/components/crm/CampaignComposer";

export default function CampaignsPage() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-[#1A1A1A]">Email Campaigns</h1>
        <p className="text-sm text-[#1A1A1A]/70">
          Compose, preview audience, and send via Resend with quota, suppression
          and single-agency rules enforced end-to-end.
        </p>
      </div>
      <CampaignComposer />
    </div>
  );
}
