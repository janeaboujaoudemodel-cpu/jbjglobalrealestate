import { Link } from "react-router-dom";
import { Building2, PartyPopper, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const DeveloperPortalCTA = () => {
  return (
    <section className="py-12 md:py-16 bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460]">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
            Are You a Developer?
          </h2>
          <p className="text-white/60 mb-8 text-lg max-w-2xl mx-auto">
            Submit event invitations, new launch details, and marketing materials directly through our developer portal.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/developer-portal?tab=event">
              <Button className="bg-gradient-to-r from-[#D4B896] to-[#C4A87A] hover:from-[#C4A87A] hover:to-[#B4986A] text-black font-bold h-12 px-8 rounded-xl">
                <PartyPopper className="w-5 h-5 mr-2" />
                Submit Event Invitation
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link to="/developer-portal?tab=launch">
              <Button variant="outline" className="border-2 border-gold/50 text-white hover:bg-gold/10 font-bold h-12 px-8 rounded-xl">
                <Building2 className="w-5 h-5 mr-2" />
                Submit New Launch
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DeveloperPortalCTA;
