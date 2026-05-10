/**
 * Meeting Booking Modal
 * Secure online meeting booking system with comprehensive verification
 */

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, addDays, startOfDay, setHours, setMinutes } from "date-fns";
import { Calendar as CalendarIcon, Clock, Shield, AlertTriangle, X, Video, CheckCircle, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { PhoneInput, getPhoneValidation } from "@/components/ui/phone-input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { getCountryList, getLanguageList } from "@/constants/localeOptions";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useLeadCapture } from "@/hooks/useLeadCapture";

const meetingSchema = z.object({
  fullName: z.string().min(2, "Full name is required").max(100),
  email: z.string().email("Please enter a valid email address").max(255),
  phone: z.string()
    .min(1, "Phone number is required")
    .refine((val) => {
      const validation = getPhoneValidation(val);
      return validation.isValid;
    }, (val) => ({
      message: getPhoneValidation(val).message
    })),
  nationality: z.string().min(1, "Please select your nationality"),
  currentLocation: z.string().min(2, "Please enter your current location").max(100),
  serviceNeeded: z.string().min(1, "Please select a service"),
  purpose: z.string().min(20, "Please provide detailed meeting purpose (min 20 characters)").max(500),
  meetingDate: z.date({
    required_error: "Please select a meeting date",
  }),
  meetingTime: z.string().min(1, "Please select a meeting time"),
  confirmAccurate: z.boolean().refine((val) => val === true, {
    message: "Please confirm the information is accurate",
  }),
  agreeTerms: z.boolean().refine((val) => val === true, {
    message: "You must agree to the legal disclaimer",
  }),
});

type MeetingFormData = z.infer<typeof meetingSchema>;

const SERVICE_OPTIONS = [
  { value: "buy-consultation", label: "Property Purchase Consultation" },
  { value: "sell-consultation", label: "Property Sale Consultation" },
  { value: "rent-consultation", label: "Rental Consultation" },
  { value: "investment-advisory", label: "Investment Advisory" },
  { value: "market-analysis", label: "Market Analysis Discussion" },
  { value: "mortgage-intro", label: "Mortgage Partner Introduction" },
  { value: "legal-intro", label: "Legal Partner Introduction" },
];

const TIME_SLOTS = [
  "10:00", "10:30", "11:00", "11:30", 
  "14:00", "14:30", "15:00", "15:30", "16:00", "16:30"
];

interface MeetingBookingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const MeetingBookingModal = ({ open, onOpenChange }: MeetingBookingModalProps) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { captureLead } = useLeadCapture();
  
  const countries = getCountryList();

  const form = useForm<MeetingFormData>({
    resolver: zodResolver(meetingSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      nationality: "",
      currentLocation: "",
      serviceNeeded: "",
      purpose: "",
      meetingTime: "",
      confirmAccurate: false,
      agreeTerms: false,
    },
  });

  // Minimum date is tomorrow
  const minDate = addDays(startOfDay(new Date()), 1);
  // Max date is 30 days from now
  const maxDate = addDays(startOfDay(new Date()), 30);

  const handleNext = async () => {
    if (step === 1) {
      const isValid = await form.trigger(["fullName", "email", "phone", "nationality", "currentLocation", "serviceNeeded", "purpose"]);
      if (isValid) setStep(2);
    } else if (step === 2) {
      const isValid = await form.trigger(["meetingDate", "meetingTime"]);
      if (isValid) setStep(3);
    }
  };

  const handleBack = () => {
    if (step > 1) setStep((prev) => (prev - 1) as 1 | 2);
  };

  const onSubmit = async (data: MeetingFormData) => {
    setIsSubmitting(true);
    try {
      // Capture lead
      await captureLead({
        email: data.email,
        fullName: data.fullName,
        phone: data.phone,
        nationality: data.nationality,
        currentLocation: data.currentLocation,
      }, "meeting-booking", "client");

      // Send notification email
      try {
        await supabase.functions.invoke("send-inquiry-email", {
          body: {
            fullName: data.fullName,
            email: data.email,
            phone: data.phone,
            nationality: data.nationality,
            source: "meeting-booking",
            context: {
              currentLocation: data.currentLocation,
              serviceNeeded: data.serviceNeeded,
              meetingDate: format(data.meetingDate, "PPP"),
              meetingTime: data.meetingTime,
              meetingType: "Online Video Meeting",
            },
            message: data.purpose,
          },
        });
      } catch (notifyErr) {
        console.warn('Admin notification failed (lead still saved):', notifyErr);
      }

      setIsSuccess(true);
      toast.success("Meeting request submitted successfully!");
    } catch (error) {
      console.error("Error submitting meeting request:", error);
      toast.error("Failed to submit meeting request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setIsSuccess(false);
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border-2 border-[#B89555]/30 shadow-2xl shadow-gold/20">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-[#1A1A1A] text-xl font-bold">
            <div className="w-10 h-10 bg-[#1A1A1A] rounded-lg flex items-center justify-center">
              <Video className="w-5 h-5 text-[#1A1A1A]" />
            </div>
            Book Online Meeting
          </DialogTitle>
        </DialogHeader>

        {isSuccess ? (
          /* Success State */
          <div className="text-center py-8">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-green-500/30">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-[#1A1A1A] mb-4">Meeting Request Submitted</h3>
            <p className="text-[#1A1A1A]/70 mb-6">
              We have received your meeting request and will confirm your appointment via email within 24 hours.
            </p>
            <div className="bg-[#F7F2EA] border border-[#B89555]/30 rounded-xl p-4 text-left max-w-sm mx-auto mb-6">
              <p className="text-sm text-[#1A1A1A]/70">
                <strong className="text-[#1A1A1A]">Date:</strong> {form.getValues("meetingDate") ? format(form.getValues("meetingDate"), "PPP") : ""}<br />
                <strong className="text-[#1A1A1A]">Time:</strong> {form.getValues("meetingTime")} (Dubai Time)
              </p>
            </div>
            <Button onClick={handleClose} variant="primary">
              Close
            </Button>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Progress Indicator */}
              <div className="flex items-center justify-center gap-2 mb-6">
                {[1, 2, 3].map((s) => (
                  <div key={s} className="flex items-center gap-2">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all",
                      step >= s ? "bg-[#EFE6D6] text-[#1A1A1A]" : "bg-[#EFE6D6] text-[#1A1A1A]/70"
                    )}>
                      {s}
                    </div>
                    {s < 3 && <div className={cn("w-12 h-0.5", step > s ? "bg-[#EFE6D6]" : "bg-[#EFE6D6]")} />}
                  </div>
                ))}
              </div>

              {/* Step 1: Personal Information */}
              {step === 1 && (
                <div className="space-y-4">
                  <div className="text-center mb-6">
                    <h3 className="text-lg font-semibold text-[#1A1A1A]">Your Information</h3>
                    <p className="text-[#1A1A1A]/70 text-sm">Please provide accurate details for verification</p>
                  </div>

                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[#1A1A1A]/70">Full Name *</FormLabel>
                        <FormControl>
                          <Input {...field} className="h-12 bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border-2 border-[#B89555]/40 text-[#1A1A1A] focus:border-[#B89555]" placeholder="Your full legal name" />
                        </FormControl>
                        <FormMessage className="text-red-500 text-xs" />
                      </FormItem>
                    )}
                  />

                  <div className="grid md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[#1A1A1A]/70">Email Address *</FormLabel>
                          <FormControl>
                            <Input {...field} type="email" className="h-12 bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border-2 border-[#B89555]/40 text-[#1A1A1A] focus:border-[#B89555]" placeholder="email@example.com" />
                          </FormControl>
                          <FormMessage className="text-red-500 text-xs" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[#1A1A1A]/70">Phone Number *</FormLabel>
                          <FormControl>
                            <PhoneInput value={field.value} onChange={field.onChange} />
                          </FormControl>
                          <FormMessage className="text-red-500 text-xs" />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="nationality"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[#1A1A1A]/70">Nationality *</FormLabel>
                          <FormControl>
                            <SearchableSelect
                              value={field.value}
                              onChange={field.onChange}
                              options={countries}
                              placeholder="Select nationality"
                              searchPlaceholder="Search countries..."
                              priorityItem="United Arab Emirates"
                            />
                          </FormControl>
                          <FormMessage className="text-red-500 text-xs" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="currentLocation"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[#1A1A1A]/70">Current Location *</FormLabel>
                          <FormControl>
                            <Input {...field} className="h-12 bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border-2 border-[#B89555]/40 text-[#1A1A1A] focus:border-[#B89555]" placeholder="City, Country" />
                          </FormControl>
                          <FormMessage className="text-red-500 text-xs" />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="serviceNeeded"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[#1A1A1A]/70">Service Needed *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-12 bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border-2 border-[#B89555]/40 text-[#1A1A1A] hover:border-[#B89555] focus:border-[#B89555]">
                              <SelectValue placeholder="Select a service" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-[#FDFBF7] border-[#B89555]/30">
                            {SERVICE_OPTIONS.map((option) => (
                              <SelectItem key={option.value} value={option.value} className="text-[#1A1A1A]">
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-red-500 text-xs" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="purpose"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[#1A1A1A]/70">Meeting Purpose *</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            className="min-h-[120px] bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border-2 border-[#B89555]/40 text-[#1A1A1A] resize-none focus:border-[#B89555]" 
                            placeholder="Please describe in detail: What specific property or service are you interested in? What is your budget range? What is your timeline? Any specific requirements?"
                          />
                        </FormControl>
                        <FormMessage className="text-red-500 text-xs" />
                      </FormItem>
                    )}
                  />

                  <Button type="button" onClick={handleNext} className="w-full h-12 bg-[#EFE6D6] hover:bg-[#EFE6D6]-light text-[#1A1A1A] font-semibold">
                    Continue to Select Date & Time
                  </Button>
                </div>
              )}

              {/* Step 2: Date & Time Selection */}
              {step === 2 && (
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <h3 className="text-lg font-semibold text-[#1A1A1A]">Select Date & Time</h3>
                    <p className="text-[#1A1A1A]/70 text-sm">Online meetings are scheduled at least 1 day in advance</p>
                  </div>

                  <FormField
                    control={form.control}
                    name="meetingDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel className="text-[#1A1A1A]/70">Meeting Date *</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "h-12 w-full pl-3 text-left font-normal bg-[#F7F2EA] border-[#B89555]/30",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0 bg-[#FDFBF7]" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) => date < minDate || date > maxDate}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage className="text-red-500 text-xs" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="meetingTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[#1A1A1A]/70">Meeting Time (Dubai Time - GMT+4) *</FormLabel>
                        <div className="grid grid-cols-5 gap-2">
                          {TIME_SLOTS.map((time) => (
                            <Button
                              key={time}
                              type="button"
                              variant={field.value === time ? "default" : "outline"}
                              className={cn(
                                "h-10",
                                field.value === time 
                                  ? "bg-[#EFE6D6] text-[#1A1A1A] hover:bg-[#EFE6D6]-light" 
                                  : "bg-[#F7F2EA] border-[#B89555]/30 text-[#1A1A1A]/70 hover:border-[#B89555]"
                              )}
                              onClick={() => field.onChange(time)}
                            >
                              {time}
                            </Button>
                          ))}
                        </div>
                        <FormMessage className="text-red-500 text-xs" />
                      </FormItem>
                    )}
                  />

                  <div className="flex gap-4">
                    <Button type="button" variant="outline" onClick={handleBack} className="flex-1 h-12 border-[#B89555]/30 text-[#1A1A1A]/70">
                      Back
                    </Button>
                    <Button type="button" onClick={handleNext} className="flex-1 h-12 bg-[#EFE6D6] hover:bg-[#EFE6D6]-light text-[#1A1A1A] font-semibold">
                      Continue to Confirmation
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 3: Confirmation & Legal Disclaimer */}
              {step === 3 && (
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <h3 className="text-lg font-semibold text-[#1A1A1A]">Confirm Your Booking</h3>
                    <p className="text-[#1A1A1A]/70 text-sm">Please review and accept the terms</p>
                  </div>

                  {/* Summary */}
                  <div className="bg-[#F7F2EA] border border-[#B89555]/30 rounded-xl p-4 space-y-2">
                    <h4 className="font-semibold text-[#1A1A1A] mb-3">Meeting Summary</h4>
                    <p className="text-sm text-[#1A1A1A]/70"><strong className="text-[#1A1A1A]">Name:</strong> {form.getValues("fullName")}</p>
                    <p className="text-sm text-[#1A1A1A]/70"><strong className="text-[#1A1A1A]">Email:</strong> {form.getValues("email")}</p>
                    <p className="text-sm text-[#1A1A1A]/70"><strong className="text-[#1A1A1A]">Service:</strong> {SERVICE_OPTIONS.find(s => s.value === form.getValues("serviceNeeded"))?.label}</p>
                    <p className="text-sm text-[#1A1A1A]/70"><strong className="text-[#1A1A1A]">Date:</strong> {form.getValues("meetingDate") ? format(form.getValues("meetingDate"), "PPP") : ""}</p>
                    <p className="text-sm text-[#1A1A1A]/70"><strong className="text-[#1A1A1A]">Time:</strong> {form.getValues("meetingTime")} (Dubai Time)</p>
                    <p className="text-sm text-[#1A1A1A]/70"><strong className="text-[#1A1A1A]">Type:</strong> Online Video Meeting</p>
                  </div>

                  {/* Legal Disclaimer */}
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-amber-800 mb-2">Important Legal Notice</h4>
                        <p className="text-amber-700 text-sm leading-relaxed">
                          This booking system is for genuine real estate inquiries only. Submitting false, misleading, 
                          or spam information is strictly prohibited. JBJ Global Real Estate reserves the right to 
                          pursue legal action under UAE law against any individual or entity submitting fraudulent 
                          inquiries or attempting to misuse this system. All submissions are logged and verified.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="confirmAccurate"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox 
                              checked={field.value} 
                              onCheckedChange={field.onChange}
                              className="border-[#B89555]/30 data-[state=checked]:bg-[#EFE6D6] data-[state=checked]:border-[#B89555] mt-0.5"
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="text-[#1A1A1A]/70 text-sm font-normal cursor-pointer">
                              I confirm all information provided is accurate and truthful. *
                            </FormLabel>
                            <FormMessage className="text-red-500 text-xs" />
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="agreeTerms"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox 
                              checked={field.value} 
                              onCheckedChange={field.onChange}
                              className="border-[#B89555]/30 data-[state=checked]:bg-[#EFE6D6] data-[state=checked]:border-[#B89555] mt-0.5"
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="text-[#1A1A1A]/70 text-sm font-normal cursor-pointer">
                              I understand and agree to the legal disclaimer above. *
                            </FormLabel>
                            <FormMessage className="text-red-500 text-xs" />
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex gap-4">
                    <Button type="button" variant="outline" onClick={handleBack} className="flex-1 h-12 border-[#B89555]/30 text-[#1A1A1A]/70">
                      Back
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="flex-1 h-12 bg-gradient-to-r from-gold via-gold-light to-gold text-[#1A1A1A] font-semibold shadow-lg shadow-gold/20"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-5 h-5 mr-2" />
                          Confirm Booking
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default MeetingBookingModal;
