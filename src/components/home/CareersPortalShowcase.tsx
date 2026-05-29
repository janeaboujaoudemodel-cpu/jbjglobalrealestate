import { Users, Bot, Briefcase, GraduationCap } from "lucide-react";
import PortalShowcaseCard from "@/components/home/PortalShowcaseCard";

/**
 * Public Careers Portal showcase card — visible to all modes on the homepage.
 * Wraps the shared <PortalShowcaseCard /> so design updates cascade.
 */
export default function CareersPortalShowcase() {
  return (
    <PortalShowcaseCard
      kind="careers"
      eyebrow="Careers Portal"
      title="Build Your Career at JBJ"
      description="Join an AI-powered brokerage ecosystem trusted by elite consultants, institutional developers, and global investors — apply in minutes."
      cta="Discover Features"
      href="/join"
      helper="Powered by Jessica, your executive assistant — applications reviewed within 48 hours."
      features={[
        { label: "Executive Hiring", icon: Briefcase },
        { label: "AI Recruiter", icon: Bot },
        { label: "Talent Network", icon: Users },
        { label: "JBJ Academy", icon: GraduationCap },
      ]}
    />
  );
}
