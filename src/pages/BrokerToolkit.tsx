import { useState } from "react";
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

export default function BrokerToolkit() {
  const [activeSection, setActiveSection] = useState("tools");

  return (
    <div className="min-h-screen bg-black">
      <BrokerToolkitHero />
      <BrokerToolkitStats />
      <BrokerToolkitNavigation 
        activeSection={activeSection} 
        onSectionChange={setActiveSection} 
      />
      <BrokerToolkitTools />
      <BrokerToolkitSupport />
      <BrokerToolkitEducation />
      <BrokerToolkitAcademy />
      <BrokerToolkitOperations />
      <BrokerToolkitCRM />
      <BrokerToolkitGrowth />
      <BrokerToolkitReferral />
      <BrokerToolkitCTA />
    </div>
  );
}
