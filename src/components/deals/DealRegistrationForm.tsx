import { useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { FileCheck, Loader2 } from "lucide-react";
import { FormDraftBar } from "@/components/shared/FormDraftBar";

const DEAL_DRAFT_KEY = "jbj_deal_reg_draft";

const dealSchema = z.object({
  unit_number: z.string().min(1, "Unit number is required"),
  client_name: z.string().min(2, "Client name is required"),
  client_phone: z.string().optional(),
  client_email: z.string().email().optional().or(z.literal("")),
  deal_value_aed: z.coerce.number().min(1, "Deal value must be greater than 0"),
  developer_name: z.string().min(1, "Developer name is required"),
  notes: z.string().optional(),
});

type DealFormData = z.infer<typeof dealSchema>;

interface DealRegistrationFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function DealRegistrationForm({ onSuccess, onCancel }: DealRegistrationFormProps) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<DealFormData>({
    resolver: zodResolver(dealSchema),
  });

  const onSubmit = async (data: DealFormData) => {
    if (!user) {
      toast.error("You must be logged in to register a deal");
      return;
    }

    setIsSubmitting(true);

    try {
      const sourcePage = window.location.pathname;
      const { error } = await supabase.from("deals").insert({
        broker_user_id: user.id,
        unit_number: data.unit_number,
        client_name: data.client_name,
        client_phone: data.client_phone || null,
        client_email: data.client_email || null,
        deal_value_aed: data.deal_value_aed,
        developer_name: data.developer_name,
        notes: data.notes ? `${data.notes}\n\n[Submitted from: ${sourcePage}]` : `[Submitted from: ${sourcePage}]`,
        deal_status: "submitted",
      });

      if (error) throw error;

      toast.success("Deal submitted successfully! Awaiting verification.");
      reset();
      onSuccess?.();
    } catch (error) {
      console.error("Error submitting deal:", error);
      toast.error("Failed to submit deal. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <FileCheck className="h-5 w-5 text-primary" />
          Register a Deal
        </CardTitle>
        <CardDescription>
          Submit your closed deal for verification and earn points
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="developer_name">Developer Name *</Label>
              <Input
                id="developer_name"
                placeholder="e.g., Emaar, DAMAC"
                {...register("developer_name")}
                className={errors.developer_name ? "border-destructive" : ""}
              />
              {errors.developer_name && (
                <p className="text-xs text-destructive">{errors.developer_name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit_number">Unit Number *</Label>
              <Input
                id="unit_number"
                placeholder="e.g., A-1205"
                {...register("unit_number")}
                className={errors.unit_number ? "border-destructive" : ""}
              />
              {errors.unit_number && (
                <p className="text-xs text-destructive">{errors.unit_number.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="client_name">Client Name *</Label>
              <Input
                id="client_name"
                placeholder="Full name"
                {...register("client_name")}
                className={errors.client_name ? "border-destructive" : ""}
              />
              {errors.client_name && (
                <p className="text-xs text-destructive">{errors.client_name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="deal_value_aed">Deal Value (AED) *</Label>
              <Input
                id="deal_value_aed"
                type="number"
                placeholder="e.g., 2500000"
                {...register("deal_value_aed")}
                className={errors.deal_value_aed ? "border-destructive" : ""}
              />
              {errors.deal_value_aed && (
                <p className="text-xs text-destructive">{errors.deal_value_aed.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="client_phone">Client Phone</Label>
              <Input
                id="client_phone"
                placeholder="+971..."
                {...register("client_phone")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="client_email">Client Email</Label>
              <Input
                id="client_email"
                type="email"
                placeholder="client@example.com"
                {...register("client_email")}
                className={errors.client_email ? "border-destructive" : ""}
              />
              {errors.client_email && (
                <p className="text-xs text-destructive">{errors.client_email.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              placeholder="Any additional details about the deal..."
              {...register("notes")}
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-2">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <FileCheck className="h-4 w-4 mr-2" />
                  Submit Deal
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
