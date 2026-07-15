import ServicePageTemplate from "@/components/services/ServicePageTemplate";
import { allServicesConfig } from "@/data/services/configs";

export default function Services() {
  return <ServicePageTemplate config={allServicesConfig} />;
}