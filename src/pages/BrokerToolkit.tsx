import { useState } from "react";
import { motion } from "framer-motion";
import {
  BrokerToolkitHero,
  BrokerToolkitStats,
  BrokerToolkitNavigation,
  BrokerToolkitTools,
  BrokerToolkitAcademy,
  BrokerToolkitCRM,
  BrokerToolkitCTA,
} from "@/components/broker-toolkit";

const sectionVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, delay: i * 0.05, ease: "easeOut" },
  }),
};

export default function BrokerToolkit() {
  const [activeSection, setActiveSection] = useState("tools");

  const bodySections = [
    <BrokerToolkitTools key="tools" />,
    <BrokerToolkitAcademy key="academy" />,
    <BrokerToolkitCRM key="crm" />,
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
        <motion.div
          key={section.key}
          custom={i}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={sectionVariants}
        >
          {section}
        </motion.div>
      ))}
    </div>
  );
}
