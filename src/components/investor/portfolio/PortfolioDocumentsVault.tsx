import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FolderOpen, FileText, FileCheck, Upload, Lock, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

interface DocumentCategory {
  label: string;
  count: number;
  icon: React.ElementType;
}

interface PortfolioDocumentsVaultProps {
  documentCounts: {
    contracts: number;
    approvals: number;
    reports: number;
    uploads: number;
  };
}

export default function PortfolioDocumentsVault({ documentCounts }: PortfolioDocumentsVaultProps) {
  const categories: DocumentCategory[] = [
    { label: "Contracts", count: documentCounts.contracts, icon: FileText },
    { label: "Approval Records", count: documentCounts.approvals, icon: FileCheck },
    { label: "Reports", count: documentCounts.reports, icon: FolderOpen },
    { label: "Uploaded Files", count: documentCounts.uploads, icon: Upload },
  ];

  const totalDocuments = Object.values(documentCounts).reduce((a, b) => a + b, 0);

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
          <FolderOpen className="w-5 h-5 text-[#1A1A1A]" />
          Portfolio Documents Vault
        </h2>
        <p className="text-muted-foreground text-sm mt-1">
          Access all documents linked to your portfolio assets.
        </p>
      </div>

      <Card className="border-2 border-[#B89555]/30">
        <CardContent className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {categories.map((category) => (
              <div
                key={category.label}
                className="p-4 bg-muted/30 rounded-lg text-center hover:bg-muted/50 transition-colors cursor-pointer"
              >
                <category.icon className="w-8 h-8 mx-auto text-[#1A1A1A] mb-2" />
                <p className="text-2xl font-bold text-foreground">{category.count}</p>
                <p className="text-xs text-muted-foreground">{category.label}</p>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-border/50">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Lock className="w-4 h-4" />
              <span>Private to you and authorized JBJ administrators</span>
            </div>
            <Link to="/investor-dashboard/documents">
              <Button variant="primary" className="gap-2">
                View All Documents
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
