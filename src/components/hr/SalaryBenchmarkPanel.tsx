import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign } from "lucide-react";

export function SalaryBenchmarkPanel() {
  return (
    <Card className="bg-card/50 backdrop-blur-sm border-primary/10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-emerald-500" />
          Salary Benchmarks
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-center py-8">
          Please approve the database migration to enable salary benchmarks
        </p>
      </CardContent>
    </Card>
  );
}
