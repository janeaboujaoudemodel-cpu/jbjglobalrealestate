import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Briefcase, Trash2, Edit2, Target } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useOpenPositions } from "@/hooks/useHRStats";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const DEPARTMENTS = [
  "Sales",
  "Marketing", 
  "Operations",
  "Finance",
  "HR",
  "IT",
  "Legal",
  "Management"
];

interface NewPositionForm {
  position_title: string;
  department: string;
  description: string;
  salary_range_min: string;
  salary_range_max: string;
  commission_structure: string;
}

export function OpenPositionsPanel() {
  const { data: positions, isLoading } = useOpenPositions();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [form, setForm] = useState<NewPositionForm>({
    position_title: "",
    department: "",
    description: "",
    salary_range_min: "",
    salary_range_max: "",
    commission_structure: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.position_title || !form.department) {
      toast.error("Position title and department are required");
      return;
    }

    // Write to both tables for backward compat
    const [r1, r2] = await Promise.all([
      supabase.from("open_positions").insert({
        title: form.position_title,
        department: form.department,
        description: form.description || null,
        employment_type: form.commission_structure ? "commission_basis" : "full_time",
        is_broker_role: form.department === "Sales",
        location: "Dubai, UAE",
        is_active: true,
      }),
      supabase.from("hr_job_offers").insert({
        position_title: form.position_title,
        department: form.department,
        description: form.description || null,
        salary_range_min: form.salary_range_min ? parseFloat(form.salary_range_min) : null,
        salary_range_max: form.salary_range_max ? parseFloat(form.salary_range_max) : null,
        commission_structure: form.commission_structure || null,
        is_active: true,
      }),
    ]);
    const error = r1.error || r2.error;

    if (error) {
      toast.error("Failed to create position");
      console.error(error);
      return;
    }

    toast.success("Position created! AI Hunting will now target this role.");
    setIsDialogOpen(false);
    setForm({
      position_title: "",
      department: "",
      description: "",
      salary_range_min: "",
      salary_range_max: "",
      commission_structure: "",
    });
    queryClient.invalidateQueries({ queryKey: ["open-positions"] });
    queryClient.invalidateQueries({ queryKey: ["hr-stats"] });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to close this position?")) return;

    const { error } = await supabase
      .from("hr_job_offers")
      .update({ is_active: false })
      .eq("id", id);

    if (error) {
      toast.error("Failed to close position");
      return;
    }

    toast.success("Position closed");
    queryClient.invalidateQueries({ queryKey: ["open-positions"] });
    queryClient.invalidateQueries({ queryKey: ["hr-stats"] });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-foreground">Open Positions</h3>
          <p className="text-sm text-muted-foreground">
            Manage job openings - AI Hunting will automatically target these roles
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gold hover:bg-gold/90 text-black">
              <Plus className="h-4 w-4 mr-2" />
              Add Position
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Position</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Position Title *</Label>
                <Input
                  placeholder="e.g., Senior Sales Manager"
                  value={form.position_title}
                  onChange={(e) => setForm({ ...form, position_title: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Department *</Label>
                <Select
                  value={form.department}
                  onValueChange={(v) => setForm({ ...form, department: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEPARTMENTS.map((dept) => (
                      <SelectItem key={dept} value={dept}>
                        {dept}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  placeholder="Job description and requirements..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Min Salary (AED)</Label>
                  <Input
                    type="number"
                    placeholder="e.g., 15000"
                    value={form.salary_range_min}
                    onChange={(e) => setForm({ ...form, salary_range_min: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Max Salary (AED)</Label>
                  <Input
                    type="number"
                    placeholder="e.g., 25000"
                    value={form.salary_range_max}
                    onChange={(e) => setForm({ ...form, salary_range_max: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Commission Structure</Label>
                <Input
                  placeholder="e.g., 30% of deals"
                  value={form.commission_structure}
                  onChange={(e) => setForm({ ...form, commission_structure: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-gold hover:bg-gold/90 text-black">
                  Create Position
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Positions List */}
      <div className="grid gap-4">
        {isLoading ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Loading positions...
            </CardContent>
          </Card>
        ) : positions?.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No open positions yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Create a position and AI will start hunting for candidates
              </p>
            </CardContent>
          </Card>
        ) : (
          positions?.map((position) => (
            <Card key={position.id} className="hover:border-gold/50 transition-colors">
              <CardContent className="py-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-foreground">{position.position_title}</h4>
                      <Badge variant="outline" className="text-gold border-gold/30">
                        {position.department}
                      </Badge>
                    </div>
                    
                    {position.description && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {position.description}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      {(position.salary_range_min || position.salary_range_max) && (
                        <span>
                          AED {position.salary_range_min?.toLocaleString() || "?"} - {position.salary_range_max?.toLocaleString() || "?"}
                        </span>
                      )}
                      {position.commission_structure && (
                        <span>Commission: {position.commission_structure}</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" className="text-purple-600 border-purple-600/30">
                      <Target className="h-4 w-4 mr-1" />
                      Hunt
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(position.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
