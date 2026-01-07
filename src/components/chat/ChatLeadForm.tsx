import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { UserCircle, Mail, Phone as PhoneIcon, Globe, MapPin, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import { UserInfo, AGE_RANGES, LANGUAGES, validateEmail, validateE164Phone } from './types';

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
          <UserCircle className="w-7 h-7 text-gold" />
        </div>
        <h4 className="text-white text-lg font-semibold mb-1">Quick intro!</h4>
        <p className="text-zinc-400 text-sm">So I can personalize your experience</p>
      </div>

      <div className="space-y-3">
        {/* Name Row */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-zinc-300 text-xs mb-1 block">First Name *</Label>
            <Input
              value={userInfo.firstName}
              onChange={(e) => updateField('firstName', e.target.value)}
              placeholder="First"
              className={`bg-white/10 border-gold/20 text-white placeholder:text-white/40 h-9 text-sm ${formErrors.firstName ? 'border-red-500' : ''}`}
            />
            {formErrors.firstName && <p className="text-red-400 text-xs mt-0.5">{formErrors.firstName}</p>}
          </div>
          <div>
            <Label className="text-zinc-300 text-xs mb-1 block">Last Name *</Label>
            <Input
              value={userInfo.lastName}
              onChange={(e) => updateField('lastName', e.target.value)}
              placeholder="Last"
              className={`bg-white/10 border-gold/20 text-white placeholder:text-white/40 h-9 text-sm ${formErrors.lastName ? 'border-red-500' : ''}`}
            />
            {formErrors.lastName && <p className="text-red-400 text-xs mt-0.5">{formErrors.lastName}</p>}
          </div>
        </div>

        {/* Email */}
        <div>
          <Label className="text-zinc-300 text-xs flex items-center gap-1 mb-1">
            <Mail className="w-3 h-3 text-gold" />
            Email Address *
          </Label>
          <Input
            type="email"
            value={userInfo.email}
            onChange={(e) => updateField('email', e.target.value)}
            placeholder="your@email.com"
            className={`bg-white/10 border-gold/20 text-white placeholder:text-white/40 h-9 text-sm ${formErrors.email ? 'border-red-500' : ''}`}
          />
          {formErrors.email && <p className="text-red-400 text-xs mt-0.5">{formErrors.email}</p>}
        </div>

        {/* Phone */}
        <div>
          <Label className="text-zinc-300 text-xs flex items-center gap-1 mb-1">
            <PhoneIcon className="w-3 h-3 text-gold" />
            Phone (with country code) *
          </Label>
          <Input
            type="tel"
            value={userInfo.phone}
            onChange={(e) => updateField('phone', e.target.value)}
            placeholder="+971 50 123 4567"
            className={`bg-white/10 border-gold/20 text-white placeholder:text-white/40 h-9 text-sm ${formErrors.phone ? 'border-red-500' : ''}`}
          />
          {formErrors.phone && <p className="text-red-400 text-xs mt-0.5">{formErrors.phone}</p>}
        </div>

        {/* Nationality & Location Row */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-zinc-300 text-xs flex items-center gap-1 mb-1">
              <Globe className="w-3 h-3 text-gold" />
              Nationality *
            </Label>
            <Input
              value={userInfo.nationality}
              onChange={(e) => updateField('nationality', e.target.value)}
              placeholder="e.g., British"
              className={`bg-white/10 border-gold/20 text-white placeholder:text-white/40 h-9 text-sm ${formErrors.nationality ? 'border-red-500' : ''}`}
            />
            {formErrors.nationality && <p className="text-red-400 text-xs mt-0.5">{formErrors.nationality}</p>}
          </div>
          <div>
            <Label className="text-zinc-300 text-xs flex items-center gap-1 mb-1">
              <MapPin className="w-3 h-3 text-gold" />
              Current Location *
            </Label>
            <Input
              value={userInfo.currentLocation}
              onChange={(e) => updateField('currentLocation', e.target.value)}
              placeholder="City, Country"
              className={`bg-white/10 border-gold/20 text-white placeholder:text-white/40 h-9 text-sm ${formErrors.currentLocation ? 'border-red-500' : ''}`}
            />
            {formErrors.currentLocation && <p className="text-red-400 text-xs mt-0.5">{formErrors.currentLocation}</p>}
          </div>
        </div>

        {/* Language & Age Row */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-zinc-300 text-xs mb-1 block">Preferred Language</Label>
            <Select value={userInfo.language} onValueChange={(v) => updateField('language', v)}>
              <SelectTrigger className="bg-white/10 border-gold/20 text-white h-9 text-sm">
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
            <Label className="text-zinc-300 text-xs flex items-center gap-1 mb-1">
              <Calendar className="w-3 h-3 text-gold" />
              Age Range *
            </Label>
            <Select value={userInfo.ageRange} onValueChange={(v) => updateField('ageRange', v)}>
              <SelectTrigger className={`bg-white/10 border-gold/20 text-white h-9 text-sm ${formErrors.ageRange ? 'border-red-500' : ''}`}>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {AGE_RANGES.map(age => (
                  <SelectItem key={age.value} value={age.value}>{age.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {formErrors.ageRange && <p className="text-red-400 text-xs mt-0.5">{formErrors.ageRange}</p>}
          </div>
        </div>

        {/* Birthday (Optional) */}
        <div>
          <Label className="text-zinc-300 text-xs flex items-center gap-1 mb-1">
            <Calendar className="w-3 h-3 text-gold" />
            Birthday (Optional)
          </Label>
          <Input
            type="date"
            value={userInfo.birthday}
            onChange={(e) => updateField('birthday', e.target.value)}
            className="bg-white/10 border-gold/20 text-white h-9 text-sm [color-scheme:dark]"
          />
          <p className="text-zinc-500 text-[10px] mt-0.5">🎁 We'll send you exclusive birthday offers!</p>
        </div>

        {/* Consent Checkboxes */}
        <div className="space-y-2 pt-2">
          <div className="flex items-start gap-2">
            <Checkbox
              id="consent-accurate"
              checked={userInfo.consentAccurate}
              onCheckedChange={(checked) => updateField('consentAccurate', checked === true)}
              className="border-gold/50 data-[state=checked]:bg-gold data-[state=checked]:border-gold mt-0.5"
            />
            <label htmlFor="consent-accurate" className="text-zinc-300 text-xs leading-tight cursor-pointer">
              I confirm the information provided is accurate. *
            </label>
          </div>
          {formErrors.consentAccurate && <p className="text-red-400 text-xs ml-6">{formErrors.consentAccurate}</p>}
          
          <div className="flex items-start gap-2">
            <Checkbox
              id="consent-privacy"
              checked={userInfo.consentPrivacy}
              onCheckedChange={(checked) => updateField('consentPrivacy', checked === true)}
              className="border-gold/50 data-[state=checked]:bg-gold data-[state=checked]:border-gold mt-0.5"
            />
            <label htmlFor="consent-privacy" className="text-zinc-300 text-xs leading-tight cursor-pointer">
              I agree to the <Link to="/privacy" className="text-gold hover:underline">Privacy Policy</Link> and <Link to="/terms" className="text-gold hover:underline">Terms</Link>. *
            </label>
          </div>
          {formErrors.consentPrivacy && <p className="text-red-400 text-xs ml-6">{formErrors.consentPrivacy}</p>}
        </div>

        <Button
          onClick={handleSubmit}
          className="w-full bg-gradient-to-r from-gold to-gold/80 hover:from-gold/90 hover:to-gold/70 text-black font-semibold mt-3"
        >
          Continue
        </Button>
      </div>
    </ScrollArea>
  );
};

export default ChatLeadForm;
