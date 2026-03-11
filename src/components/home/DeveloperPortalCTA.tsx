import { Link } from "react-router-dom";
import { Building2, PartyPopper, ArrowRight, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";

const DeveloperPortalCTA = () => {
  return (
    <section className="py-12 md:py-16 bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460]">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
            Are You a Developer?
          </h2>
          <p className="text-white/60 mb-4 text-lg max-w-2xl mx-auto">
            Submit your project documents and we'll publish your listing. Manage events, tasks, and materials — all in one portal.
          </p>
          <p className="text-white/40 text-sm mb-8">
            Have a new project? Submit the documents now, so we can publish your project and collaborate with you.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/developer-portal?tab=submit">
              <Button className="bg-gradient-to-r from-[#D4B896] to-[#C4A87A] hover:from-[#C4A87A] hover:to-[#B4986A] text-black font-bold h-12 px-8 rounded-xl">
                <Upload className="w-5 h-5 mr-2" />
                Submit New Project
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link to="/developer-portal?tab=events">
              <Button variant="outline" className="border-2 border-gold/50 text-white hover:bg-gold/10 font-bold h-12 px-8 rounded-xl">
                <PartyPopper className="w-5 h-5 mr-2" />
                Submit Event Invitation
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
