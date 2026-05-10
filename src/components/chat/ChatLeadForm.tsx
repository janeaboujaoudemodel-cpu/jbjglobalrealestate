import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { UserCircle, Mail, Phone as PhoneIcon, Globe, MapPin, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import { UserInfo, AGE_RANGES, LANGUAGES, validateEmail, validateE164Phone } from './types';
import { T } from '@/components/ui/T';

interface ChatLeadFormProps {
  userInfo: UserInfo;
  onUserInfoChange: (info: UserInfo) => void;
  onSubmit: () => void;
  formErrors: Record<string, string>;
  setFormErrors: (errors: Record<string, string>) => void;
}

const ChatLeadForm = ({ 
  userInfo, 
  onUserInfoChange, 
  onSubmit, 
  formErrors, 
  setFormErrors 
}: ChatLeadFormProps) => {

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!userInfo.firstName.trim()) errors.firstName = 'First name is required';
    if (!userInfo.lastName.trim()) errors.lastName = 'Last name is required';
    if (!userInfo.email.trim()) {
      errors.email = 'Email is required';
    } else if (!validateEmail(userInfo.email)) {
      errors.email = 'Please enter a valid email';
    }
    if (!userInfo.phone.trim()) {
      errors.phone = 'Phone is required';
    } else if (!validateE164Phone(userInfo.phone)) {
      errors.phone = 'Use international format (e.g., +971501234567)';
    }
    if (!userInfo.nationality.trim()) errors.nationality = 'Nationality is required';
    if (!userInfo.currentLocation.trim()) errors.currentLocation = 'Location is required';
    if (!userInfo.ageRange) errors.ageRange = 'Age range is required';
    if (!userInfo.consentAccurate) errors.consentAccurate = 'Please confirm information is accurate';
    if (!userInfo.consentPrivacy) errors.consentPrivacy = 'Please agree to Privacy Policy';
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onSubmit();
    }
  };

  const updateField = (field: keyof UserInfo, value: string | boolean) => {
    onUserInfoChange({ ...userInfo, [field]: value });
  };

  return (
    <ScrollArea className="flex-1 p-4">
      <div className="text-center mb-4">
        <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-gradient-to-r from-gold/20 to-gold/10 flex items-center justify-center">
          <UserCircle className="w-7 h-7 text-[#1A1A1A]" />
        </div>
        <h4 className="text-[#1A1A1A] text-lg font-semibold mb-1"><T>Quick intro!</T></h4>
        <p className="text-[#1A1A1A]/70 text-sm"><T>So I can personalize your experience</T></p>
      </div>

      <div className="space-y-3">
        {/* Name Row */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-[#1A1A1A] text-xs mb-1 block"><T>First Name</T> *</Label>
            <Input
              value={userInfo.firstName}
              onChange={(e) => updateField('firstName', e.target.value)}
              placeholder="First"
              className={`bg-[#FDFBF7] border-2 border-[#B89555]/40 text-[#1A1A1A] placeholder:text-[#1A1A1A]/70 h-9 text-sm focus:border-[#B89555] ${formErrors.firstName ? 'border-red-500' : ''}`}
            />
            {formErrors.firstName && <p className="text-red-500 text-xs mt-0.5"><T>{formErrors.firstName}</T></p>}
          </div>
          <div>
            <Label className="text-[#1A1A1A] text-xs mb-1 block"><T>Last Name</T> *</Label>
            <Input
              value={userInfo.lastName}
              onChange={(e) => updateField('lastName', e.target.value)}
              placeholder="Last"
              className={`bg-[#FDFBF7] border-2 border-[#B89555]/40 text-[#1A1A1A] placeholder:text-[#1A1A1A]/70 h-9 text-sm focus:border-[#B89555] ${formErrors.lastName ? 'border-red-500' : ''}`}
            />
            {formErrors.lastName && <p className="text-red-500 text-xs mt-0.5"><T>{formErrors.lastName}</T></p>}
          </div>
        </div>

        {/* Email */}
        <div>
          <Label className="text-[#1A1A1A] text-xs flex items-center gap-1 mb-1">
            <Mail className="w-3 h-3 text-[#1A1A1A]" />
            <T>Email Address</T> *
          </Label>
          <Input
            type="email"
            value={userInfo.email}
            onChange={(e) => updateField('email', e.target.value)}
            placeholder="your@email.com"
            className={`bg-[#FDFBF7] border-2 border-[#B89555]/40 text-[#1A1A1A] placeholder:text-[#1A1A1A]/70 h-9 text-sm focus:border-[#B89555] ${formErrors.email ? 'border-red-500' : ''}`}
          />
          {formErrors.email && <p className="text-red-500 text-xs mt-0.5"><T>{formErrors.email}</T></p>}
        </div>

        {/* Phone */}
        <div>
          <Label className="text-[#1A1A1A] text-xs flex items-center gap-1 mb-1">
            <PhoneIcon className="w-3 h-3 text-[#1A1A1A]" />
            <T>Phone (with country code)</T> *
          </Label>
          <Input
            type="tel"
            value={userInfo.phone}
            onChange={(e) => updateField('phone', e.target.value)}
            placeholder="+971 50 123 4567"
            className={`bg-[#FDFBF7] border-2 border-[#B89555]/40 text-[#1A1A1A] placeholder:text-[#1A1A1A]/70 h-9 text-sm focus:border-[#B89555] ${formErrors.phone ? 'border-red-500' : ''}`}
          />
          {formErrors.phone && <p className="text-red-500 text-xs mt-0.5"><T>{formErrors.phone}</T></p>}
        </div>

        {/* Nationality & Location Row */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-[#1A1A1A] text-xs flex items-center gap-1 mb-1">
              <Globe className="w-3 h-3 text-[#1A1A1A]" />
              <T>Nationality</T> *
            </Label>
            <Input
              value={userInfo.nationality}
              onChange={(e) => updateField('nationality', e.target.value)}
              placeholder="e.g., British"
              className={`bg-[#FDFBF7] border-2 border-[#B89555]/40 text-[#1A1A1A] placeholder:text-[#1A1A1A]/70 h-9 text-sm focus:border-[#B89555] ${formErrors.nationality ? 'border-red-500' : ''}`}
            />
            {formErrors.nationality && <p className="text-red-500 text-xs mt-0.5"><T>{formErrors.nationality}</T></p>}
          </div>
          <div>
            <Label className="text-[#1A1A1A] text-xs flex items-center gap-1 mb-1">
              <MapPin className="w-3 h-3 text-[#1A1A1A]" />
              <T>Current Location</T> *
            </Label>
            <Input
              value={userInfo.currentLocation}
              onChange={(e) => updateField('currentLocation', e.target.value)}
              placeholder="City, Country"
              className={`bg-[#FDFBF7] border-2 border-[#B89555]/40 text-[#1A1A1A] placeholder:text-[#1A1A1A]/70 h-9 text-sm focus:border-[#B89555] ${formErrors.currentLocation ? 'border-red-500' : ''}`}
            />
            {formErrors.currentLocation && <p className="text-red-500 text-xs mt-0.5"><T>{formErrors.currentLocation}</T></p>}
          </div>
        </div>

        {/* Language & Age Row */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-[#1A1A1A] text-xs mb-1 block"><T>Preferred Language</T></Label>
            <Select value={userInfo.language} onValueChange={(v) => updateField('language', v)}>
              <SelectTrigger className="bg-[#FDFBF7] border-2 border-[#B89555]/40 text-[#1A1A1A] h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map(lang => (
                  <SelectItem key={lang.value} value={lang.value}>{lang.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-[#1A1A1A] text-xs flex items-center gap-1 mb-1">
              <Calendar className="w-3 h-3 text-[#1A1A1A]" />
              <T>Age Range</T> *
            </Label>
            <Select value={userInfo.ageRange} onValueChange={(v) => updateField('ageRange', v)}>
              <SelectTrigger className={`bg-[#FDFBF7] border-2 border-[#B89555]/40 text-[#1A1A1A] h-9 text-sm ${formErrors.ageRange ? 'border-red-500' : ''}`}>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {AGE_RANGES.map(age => (
                  <SelectItem key={age.value} value={age.value}>{age.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {formErrors.ageRange && <p className="text-red-500 text-xs mt-0.5"><T>{formErrors.ageRange}</T></p>}
          </div>
        </div>

        {/* Birthday (Optional) */}
        <div>
          <Label className="text-[#1A1A1A] text-xs flex items-center gap-1 mb-1">
            <Calendar className="w-3 h-3 text-[#1A1A1A]" />
            <T>Birthday (Optional)</T>
          </Label>
          <Input
            type="date"
            value={userInfo.birthday}
            onChange={(e) => updateField('birthday', e.target.value)}
            className="bg-[#FDFBF7] border-2 border-[#B89555]/40 text-[#1A1A1A] h-9 text-sm focus:border-[#B89555]"
          />
          <p className="text-[#1A1A1A]/70 text-[10px] mt-0.5">🎁 <T>We'll send you exclusive birthday offers!</T></p>
        </div>

        {/* Consent Checkboxes */}
        <div className="space-y-2 pt-2">
          <div className="flex items-start gap-2">
            <Checkbox
              id="consent-accurate"
              checked={userInfo.consentAccurate}
              onCheckedChange={(checked) => updateField('consentAccurate', checked === true)}
              className="border-[#B89555]/50 data-[state=checked]:bg-[#EFE6D6] data-[state=checked]:border-[#B89555] mt-0.5"
            />
            <label htmlFor="consent-accurate" className="text-[#1A1A1A] text-xs leading-tight cursor-pointer">
              <T>I confirm the information provided is accurate.</T> *
            </label>
          </div>
          {formErrors.consentAccurate && <p className="text-red-500 text-xs ml-6"><T>{formErrors.consentAccurate}</T></p>}
          
          <div className="flex items-start gap-2">
            <Checkbox
              id="consent-privacy"
              checked={userInfo.consentPrivacy}
              onCheckedChange={(checked) => updateField('consentPrivacy', checked === true)}
              className="border-[#B89555]/50 data-[state=checked]:bg-[#EFE6D6] data-[state=checked]:border-[#B89555] mt-0.5"
            />
            <label htmlFor="consent-privacy" className="text-[#1A1A1A] text-xs leading-tight cursor-pointer">
              <T>I agree to the</T> <Link to="/privacy" className="text-[#1A1A1A] hover:underline"><T>Privacy Policy</T></Link> <T>and</T> <Link to="/terms" className="text-[#1A1A1A] hover:underline"><T>Terms</T></Link>. *
            </label>
          </div>
          {formErrors.consentPrivacy && <p className="text-red-500 text-xs ml-6"><T>{formErrors.consentPrivacy}</T></p>}
        </div>

        <button
          onClick={handleSubmit}
          type="button"
          className="group relative w-full inline-flex items-center justify-center gap-2 px-6 py-4 text-sm font-bold rounded-xl transition-all duration-300 overflow-hidden mt-3 hover:scale-[1.02] transform active:scale-95"
          style={{
            background: 'linear-gradient(135deg, #FFFFFF 0%, #FDFBF7 25%, #F7F2EA 50%, #E8DFD0 75%, #C8A766 100%)',
            border: '2px solid rgba(200,167,102,0.6)',
            boxShadow: `
              0 8px 20px rgba(200,167,102,0.35),
              0 4px 10px rgba(0,0,0,0.15),
              inset 0 2px 4px rgba(255,255,255,0.9),
              inset 0 -2px 4px rgba(200,167,102,0.2)
            `,
          }}
        >
          <span className="absolute inset-x-0 top-0 h-1/2 rounded-t-xl bg-gradient-to-b from-white/80 to-transparent pointer-events-none" />
          <span className="absolute inset-x-0 bottom-0 h-1/3 rounded-b-xl bg-gradient-to-t from-gold/10 to-transparent pointer-events-none" />
          <span className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" style={{ boxShadow: '0 0 40px rgba(200,167,102,0.6), inset 0 0 20px rgba(200,167,102,0.1)' }} />
          <span className="relative flex items-center justify-center gap-2">
            <span className="text-[#1A1A1A] group-hover:text-[#1A1A1A] transition-colors"><T>Continue</T></span>
          </span>
        </button>
      </div>
    </ScrollArea>
  );
};

export default ChatLeadForm;
