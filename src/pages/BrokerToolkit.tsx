import { useState } from "react";
import Footer from "@/components/Footer";
import {
  BrokerToolkitHero,
  BrokerToolkitStats,
  BrokerToolkitNavigation,
  BrokerToolkitTools,
  BrokerToolkitEducation,
  BrokerToolkitSupport,
  BrokerToolkitCRM,
  BrokerToolkitGrowth,
  BrokerToolkitCTA,
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
      <BrokerToolkitEducation />
      <BrokerToolkitSupport />
      <BrokerToolkitCRM />
      <BrokerToolkitGrowth />
      <BrokerToolkitCTA />
      <Footer />
    </div>
  );
}
