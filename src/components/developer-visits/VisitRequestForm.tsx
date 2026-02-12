import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { Calendar, Loader2, Building2 } from "lucide-react";
import { format, addDays } from "date-fns";

const visitSchema = z.object({
  requested_date: z.string().min(1, "Please select a date"),
  requested_time: z.string().optional(),
  purpose: z.enum(["briefing", "general_visit"]),
  notes: z.string().optional(),
});

type VisitFormData = z.infer<typeof visitSchema>;

interface VisitRequestFormProps {
  developerId: string;
  developerName: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function VisitRequestForm({ developerId, developerName, onSuccess, onCancel }: VisitRequestFormProps) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const minDate = format(addDays(new Date(), 1), "yyyy-MM-dd");
  const maxDate = format(addDays(new Date(), 30), "yyyy-MM-dd");

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<VisitFormData>({
    resolver: zodResolver(visitSchema),
    defaultValues: {
      purpose: "briefing",
    },
  });

  const purpose = watch("purpose");

  const onSubmit = async (data: VisitFormData) => {
    if (!user) {
      toast.error("You must be logged in to request a visit");
      return;
    }

    setIsSubmitting(true);

    try {
      const sourcePage = window.location.pathname;
      const { error } = await supabase.from("developer_visit_requests").insert({
        user_id: user.id,
        developer_id: developerId,
        requested_date: data.requested_date,
        requested_time: data.requested_time || null,
        purpose: data.purpose,
        notes: data.notes ? `${data.notes}\n\n[Source: ${sourcePage} | Developer: ${developerName}]` : `[Source: ${sourcePage} | Developer: ${developerName}]`,
        status: "submitted",
      });

      if (error) throw error;

      toast.success(
        purpose === "briefing"
          ? "Briefing request submitted! You'll receive contact details once approved."
          : "Visit request submitted successfully!"
      );
      onSuccess?.();
    } catch (error) {
      console.error("Error submitting visit request:", error);
      toast.error("Failed to submit request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Calendar className="h-5 w-5 text-primary" />
          Request a Visit
        </CardTitle>
        <CardDescription className="flex items-center gap-2">
          <Building2 className="h-4 w-4" />
          {developerName}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Purpose Selection */}
          <div className="space-y-3">
            <Label>Visit Purpose</Label>
            <RadioGroup
              value={purpose}
              onValueChange={(val) => setValue("purpose", val as "briefing" | "general_visit")}
              className="grid grid-cols-2 gap-3"
            >
              <div
                className={`flex items-center space-x-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                  purpose === "briefing"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-muted-foreground"
                }`}
                onClick={() => setValue("purpose", "briefing")}
              >
                <RadioGroupItem value="briefing" id="briefing" />
                <div>
                  <Label htmlFor="briefing" className="cursor-pointer font-medium">
                    Briefing Request
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Request a detailed briefing with salesperson contact
                  </p>
                </div>
              </div>
              <div
                className={`flex items-center space-x-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                  purpose === "general_visit"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-muted-foreground"
                }`}
                onClick={() => setValue("purpose", "general_visit")}
              >
                <RadioGroupItem value="general_visit" id="general_visit" />
                <div>
                  <Label htmlFor="general_visit" className="cursor-pointer font-medium">
                    General Visit
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Self-guided site visit without booking
                  </p>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="requested_date">Preferred Date *</Label>
              <Input
                id="requested_date"
                type="date"
                min={minDate}
                max={maxDate}
                {...register("requested_date")}
                className={errors.requested_date ? "border-destructive" : ""}
              />
              {errors.requested_date && (
                <p className="text-xs text-destructive">{errors.requested_date.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="requested_time">Preferred Time</Label>
              <Input
                id="requested_time"
                type="time"
                {...register("requested_time")}
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              placeholder="Any specific topics or questions you'd like covered..."
              {...register("notes")}
              rows={3}
            />
          </div>

          {/* Info Note */}
          {purpose === "briefing" && (
            <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 text-sm">
              <p className="text-foreground">
                <strong>Note:</strong> Salesperson contact details will be revealed once your briefing request is approved by an admin.
              </p>
            </div>
          )}

          {/* Actions */}
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
                  <Calendar className="h-4 w-4 mr-2" />
                  Submit Request
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
