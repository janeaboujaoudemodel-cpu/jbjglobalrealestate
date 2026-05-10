/**
 * RENTAL LISTING FORM
 * Premium form for landlords to submit their rental properties
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Building, MapPin, DollarSign, User, Image, FileText, Send, Loader2, Home, Bed, Bath, Ruler, Sofa } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { useRentalListings, CreateRentalListingRequest } from '@/hooks/useRentalListings';
import { cn } from '@/lib/utils';

const rentalListingSchema = z.object({
  property_title: z.string().min(5, 'Title must be at least 5 characters'),
  property_type: z.string().min(1, 'Please select a property type'),
  bedrooms: z.number().min(0).optional(),
  bathrooms: z.number().min(0).optional(),
  size_sqft: z.number().min(0).optional(),
  furnished: z.string().default('unfurnished'),
  emirate: z.string().min(1, 'Please select an emirate'),
  community: z.string().optional(),
  building_name: z.string().optional(),
  address: z.string().optional(),
  annual_rent: z.number().min(1, 'Annual rent is required'),
  payment_terms: z.string().default('yearly'),
  security_deposit: z.number().optional(),
  landlord_name: z.string().min(2, 'Name is required'),
  landlord_email: z.string().email('Valid email is required'),
  landlord_phone: z.string().min(8, 'Phone number is required'),
  landlord_nationality: z.string().optional(),
  ownership_type: z.string().default('owner'),
  description: z.string().optional(),
  amenities: z.array(z.string()).optional(),
  terms_accepted: z.boolean().refine(val => val === true, 'You must accept the terms'),
});

type RentalListingFormData = z.infer<typeof rentalListingSchema>;

const PROPERTY_TYPES = [
  'Apartment',
  'Villa',
  'Townhouse',
  'Penthouse',
  'Studio',
  'Duplex',
  'Loft',
  'Compound',
  'Warehouse',
  'Office',
  'Retail',
  'Land',
];

const EMIRATES = [
  'Dubai',
  'Abu Dhabi',
  'Sharjah',
  'Ajman',
  'Ras Al Khaimah',
  'Fujairah',
  'Umm Al Quwain',
];

const FURNISHED_OPTIONS = [
  { value: 'unfurnished', label: 'Unfurnished' },
  { value: 'semi-furnished', label: 'Semi-Furnished' },
  { value: 'fully-furnished', label: 'Fully Furnished' },
];

const PAYMENT_TERMS = [
  { value: 'yearly', label: 'Yearly (1 Cheque)' },
  { value: 'bi-yearly', label: 'Bi-Yearly (2 Cheques)' },
  { value: 'quarterly', label: 'Quarterly (4 Cheques)' },
  { value: 'monthly', label: 'Monthly (12 Cheques)' },
];

const AMENITIES = [
  'Swimming Pool',
  'Gym',
  'Parking',
  'Balcony',
  'Sea View',
  'City View',
  'Garden View',
  'Maid Room',
  'Study Room',
  'Storage',
  'Security',
  'Concierge',
  'Kids Play Area',
  'BBQ Area',
  'Jacuzzi',
  'Sauna',
  'Tennis Court',
  'Squash Court',
  'Beach Access',
  'Golf Course View',
];

interface RentalListingFormProps {
  onSuccess?: (listing: any) => void;
  className?: string;
}

export function RentalListingForm({ onSuccess, className }: RentalListingFormProps) {
  const { createListing, isLoading } = useRentalListings();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

  const form = useForm<RentalListingFormData>({
    resolver: zodResolver(rentalListingSchema),
    defaultValues: {
      property_type: '',
      furnished: 'unfurnished',
      emirate: '',
      payment_terms: 'yearly',
      ownership_type: 'owner',
      amenities: [],
      terms_accepted: false,
    },
  });

  const onSubmit = async (data: RentalListingFormData) => {
    const { terms_accepted, ...listingData } = data;
    const result = await createListing(listingData as CreateRentalListingRequest);
    if (result && onSuccess) {
      onSuccess(result);
    }
  };

  const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

  const steps = [
    { number: 1, title: 'Property Details', icon: Building },
    { number: 2, title: 'Location', icon: MapPin },
    { number: 3, title: 'Pricing', icon: DollarSign },
    { number: 4, title: 'Your Info', icon: User },
  ];

  return (
    <div className={cn('space-y-6', className)}>
      {/* Progress Steps */}
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.number} className="flex items-center">
            <button
              onClick={() => setCurrentStep(step.number)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-full transition-all',
                currentStep === step.number
                  ? 'bg-gradient-to-r from-gold to-champagne text-[#1A1A1A] font-semibold'
                  : currentStep > step.number
                  ? 'bg-green-100 text-green-700'
                  : 'bg-muted text-muted-foreground'
              )}
            >
              <step.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{step.title}</span>
            </button>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  'w-12 h-0.5 mx-2',
                  currentStep > step.number ? 'bg-green-500' : 'bg-muted'
                )}
              />
            )}
          </div>
        ))}
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Step 1: Property Details */}
          {currentStep === 1 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card className="border-[#B89555]/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-5 w-5 text-[#1A1A1A]" />
                    Property Details
                  </CardTitle>
                  <CardDescription>
                    Tell us about your rental property
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="property_title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Property Title</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Luxury 2BR Apartment in Downtown Dubai" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="property_type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Property Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {PROPERTY_TYPES.map((type) => (
                                <SelectItem key={type} value={type.toLowerCase()}>
                                  {type}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="furnished"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Furnishing</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select furnishing" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {FURNISHED_OPTIONS.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <FormField
                      control={form.control}
                      name="bedrooms"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-1">
                            <Bed className="h-3 w-3" /> Bedrooms
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="bathrooms"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-1">
                            <Bath className="h-3 w-3" /> Bathrooms
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="size_sqft"
                      render={({ field }) => (
                        <FormItem className="col-span-2">
                          <FormLabel className="flex items-center gap-1">
                            <Ruler className="h-3 w-3" /> Size (sq.ft)
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe your property, its features, and what makes it special..."
                            className="min-h-[120px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="amenities"
                    render={() => (
                      <FormItem>
                        <FormLabel>Amenities</FormLabel>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          {AMENITIES.map((amenity) => (
                            <FormField
                              key={amenity}
                              control={form.control}
                              name="amenities"
                              render={({ field }) => (
                                <FormItem className="flex items-center space-x-2 space-y-0">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(amenity)}
                                      onCheckedChange={(checked) => {
                                        const current = field.value || [];
                                        if (checked) {
                                          field.onChange([...current, amenity]);
                                        } else {
                                          field.onChange(current.filter((a) => a !== amenity));
                                        }
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="text-sm font-normal cursor-pointer">
                                    {amenity}
                                  </FormLabel>
                                </FormItem>
                              )}
                            />
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 2: Location */}
          {currentStep === 2 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card className="border-[#B89555]/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-[#1A1A1A]" />
                    Location
                  </CardTitle>
                  <CardDescription>
                    Where is your property located?
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="emirate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Emirate</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select emirate" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {EMIRATES.map((emirate) => (
                              <SelectItem key={emirate} value={emirate.toLowerCase()}>
                                {emirate}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="community"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Community / Area</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Downtown, Marina, Palm Jumeirah" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="building_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Building Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Burj Khalifa, Address Downtown" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Address (Optional)</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Complete address including unit number..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 3: Pricing */}
          {currentStep === 3 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card className="border-[#B89555]/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-[#1A1A1A]" />
                    Pricing & Terms
                  </CardTitle>
                  <CardDescription>
                    Set your rental price and payment preferences
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="annual_rent"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Annual Rent (AED)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            placeholder="e.g., 120000"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormDescription>
                          The total annual rent amount in AED
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="payment_terms"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payment Terms</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select payment terms" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {PAYMENT_TERMS.map((term) => (
                              <SelectItem key={term.value} value={term.value}>
                                {term.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="security_deposit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Security Deposit (AED)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            placeholder="e.g., 10000"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormDescription>
                          Refundable security deposit amount
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 4: Landlord Info */}
          {currentStep === 4 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card className="border-[#B89555]/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5 text-[#1A1A1A]" />
                    Your Information
                  </CardTitle>
                  <CardDescription>
                    Tell us about yourself as the property owner
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="landlord_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Your full legal name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="landlord_email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="your@email.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="landlord_phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <Input placeholder="+971 XX XXX XXXX" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="landlord_nationality"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nationality</FormLabel>
                          <FormControl>
                            <Input placeholder="Your nationality" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="ownership_type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ownership Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select ownership type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="owner">Property Owner</SelectItem>
                              <SelectItem value="agent">Authorized Agent</SelectItem>
                              <SelectItem value="company">Company Representative</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="terms_accepted"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            I accept the terms and conditions
                          </FormLabel>
                          <FormDescription>
                            By submitting this listing, you confirm that you have the legal right to rent this property and agree to our listing guidelines.
                          </FormDescription>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1}
            >
              Previous
            </Button>

            {currentStep < totalSteps ? (
              <Button
                type="button"
                onClick={nextStep}
                className="bg-gradient-to-r from-gold to-champagne text-[#1A1A1A] hover:opacity-90"
              >
                Next Step
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-gradient-to-r from-gold to-champagne text-[#1A1A1A] hover:opacity-90"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Submit Listing
                  </>
                )}
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
}

export default RentalListingForm;
