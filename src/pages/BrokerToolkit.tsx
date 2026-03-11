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
    transition: { duration: 0.5, delay: i * 0.08, ease: "easeOut" },
  }),
};

export default function BrokerToolkit() {
  const [activeSection, setActiveSection] = useState("tools");

  const sections = [
    <BrokerToolkitHero key="hero" />,
    <BrokerToolkitStats key="stats" />,
    <BrokerToolkitNavigation key="nav" activeSection={activeSection} onSectionChange={setActiveSection} />,
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
    <div className="min-h-screen bg-black">
      {sections.map((section, i) => (
        <motion.div
          key={section.key}
          custom={i}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={sectionVariants}
        >
          {section}
        </motion.div>
      ))}
    </div>
  );
}
