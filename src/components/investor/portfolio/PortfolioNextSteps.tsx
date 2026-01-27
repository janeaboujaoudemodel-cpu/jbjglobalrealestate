import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageCircle, BarChart3, ArrowLeftRight, ArrowRight, Lightbulb } from "lucide-react";
import { Link } from "react-router-dom";

interface NextStep {
  icon: React.ElementType;
  title: string;
  description: string;
  actionLabel: string;
  actionLink: string;
}

export default function PortfolioNextSteps() {
  const nextSteps: NextStep[] = [
    {
      icon: MessageCircle,
      title: "Request Portfolio Consultation",
      description: "Speak with a JBJ advisor about structuring your portfolio for your goals.",
      actionLabel: "Speak With an Advisor",
      actionLink: "/contact",
    },
    {
      icon: BarChart3,
      title: "Review Market Intelligence",
      description: "Explore market data for the areas where your assets are located.",
      actionLabel: "View Market Intelligence",
      actionLink: "/market-intelligence",
    },
    {
      icon: ArrowLeftRight,
      title: "Compare Two Assets",
      description: "Use the comparison tool to evaluate assets side-by-side.",
      actionLabel: "Compare Assets",
      actionLink: "/compare",
    },
  ];

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-gold" />
          Next Step Recommendations
        </h2>
        <p className="text-muted-foreground text-sm mt-1">
          Suggested actions to help you manage and grow your portfolio.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {nextSteps.map((step) => (
          <Card key={step.title} className="border-2 border-gold/30 hover:border-gold transition-colors">
            <CardContent className="p-5">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 bg-gold/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <step.icon className="w-5 h-5 text-gold" />
                </div>
                <div>
                  <h3 className="font-medium text-foreground mb-1">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
              </div>
              <Link to={step.actionLink}>
                <Button variant="secondary" className="w-full gap-2">
                  {step.actionLabel}
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
