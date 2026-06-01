import { useState } from "react";
import { motion } from "framer-motion";
import {
  BrokerToolkitHero,
  BrokerToolkitStats,
  BrokerToolkitNavigation,
  BrokerToolkitTools,
  BrokerToolkitEducation,
  BrokerToolkitAcademy,
  BrokerToolkitOperations,
  BrokerToolkitSupport,
  BrokerToolkitCRM,
  BrokerToolkitGrowth,
  BrokerToolkitCTA,
  BrokerToolkitReferral,
} from "@/components/broker-toolkit";

const sectionVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, delay: i * 0.06, ease: "easeOut" },
  }),
};

export default function BrokerToolkit() {
  const [activeSection, setActiveSection] = useState("tools");

  // Sections after the sticky nav alternate between page/surface/raised bands
  // (the band tone IS the divider — no gray rules, no dark fills).
  const bandTones = ["surface", "page", "surface", "page", "raised", "page", "surface"];

  const bodySections = [
    <BrokerToolkitTools key="tools" />,
    <BrokerToolkitSupport key="support" />,
    <BrokerToolkitEducation key="edu" />,
    <BrokerToolkitAcademy key="academy" />,
    <BrokerToolkitOperations key="ops" />,
    <BrokerToolkitCRM key="crm" />,
    <BrokerToolkitGrowth key="growth" />,
    <BrokerToolkitReferral key="referral" />,
    <BrokerToolkitCTA key="cta" />,
  ];

  return (
    <div data-marketing-page className="min-h-screen bg-[#FDFBF7]">
      <BrokerToolkitHero />
      <BrokerToolkitStats />
      <BrokerToolkitNavigation
        activeSection={activeSection}
        onSectionChange={setActiveSection}
      />

      {bodySections.map((section, i) => (
        <motion.section
          key={section.key}
          custom={i}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={sectionVariants}
          className={`jj-band jj-band--${bandTones[i % bandTones.length]}`}
        >
          {section}
        </motion.section>
      ))}
    </div>
  );
}
