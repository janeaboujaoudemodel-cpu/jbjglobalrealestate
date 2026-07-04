import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Video, VideoOff, Mic, MicOff, Settings, Shield, User, Mail, Phone, Globe } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export interface PreJoinData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  nationality: string;
  cameraEnabled: boolean;
  micEnabled: boolean;
  agreeToTerms: boolean;
}

interface PreJoinFormProps {
  onJoin: (data: PreJoinData) => void;
  videoEnabled: boolean;
  audioEnabled: boolean;
  onToggleVideo: () => void;
  onToggleAudio: () => void;
  onOpenSettings: () => void;
  localVideoRef: React.RefObject<HTMLVideoElement>;
  beautyFilter: boolean;
}

const PreJoinForm = ({
  onJoin,
  videoEnabled,
  audioEnabled,
  onToggleVideo,
  onToggleAudio,
  onOpenSettings,
  localVideoRef,
  beautyFilter
}: PreJoinFormProps) => {
  const [formData, setFormData] = useState<PreJoinData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    nationality: '',
    cameraEnabled: false,
    micEnabled: false,
    agreeToTerms: false
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone is required';
    } else if (!/^\+?[0-9\s\-()]{8,}$/.test(formData.phone)) {
      newErrors.phone = 'Invalid phone format';
    }
    if (!formData.nationality.trim()) newErrors.nationality = 'Nationality is required';
    if (!formData.agreeToTerms) newErrors.agreeToTerms = 'You must agree to the terms';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (validateForm()) {
      try {
        await supabase.functions.invoke('capture-lead', {
          body: {
            email: formData.email,
            fullName: `${formData.firstName} ${formData.lastName}`.trim(),
            phone: formData.phone,
            nationality: formData.nationality,
            source: 'video_meeting',
            pageSource: window.location.pathname,
            contactType: 'client',
            message: 'Video meeting pre-join registration',
            context: {
              cameraEnabled: videoEnabled,
              micEnabled: audioEnabled,
            },
          },
        });
      } catch (error) {
        console.warn('Video meeting lead capture failed:', error);
      }
      onJoin({
        ...formData,
        cameraEnabled: videoEnabled,
        micEnabled: audioEnabled
      });
    }
  };

  const updateField = (field: keyof PreJoinData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center mx-auto mb-4">
            <Video className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">JBJ Video Meet</h1>
          <p className="text-white/70">Free professional video meetings for everyone</p>
          <div className="flex items-center justify-center gap-2 mt-2 text-green-400 text-xs">
            <Shield className="w-3 h-3" />
            <span>End-to-end encrypted • Unlimited time</span>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Video Preview */}
          <Card className="bg-[#FDFBF7]/50 border-[#1A1A1A]">
            <CardHeader className="pb-2">
              <CardTitle className="text-white text-lg">Camera Preview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative aspect-video bg-[#1A1A1A] rounded-xl overflow-hidden">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover scale-x-[-1]"
                  style={{ filter: beautyFilter ? 'contrast(1.1) brightness(1.05)' : 'none' }}
                />
                {!videoEnabled && (
                  <div className="absolute inset-0 flex items-center justify-center bg-[#1A1A1A]">
                    <div className="w-20 h-20 rounded-full bg-[#1A1A1A] flex items-center justify-center">
                      <VideoOff className="w-8 h-8 text-white/70" />
                    </div>
                  </div>
                )}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                  <Button
                    variant={videoEnabled ? "secondary" : "destructive"}
                    size="icon"
                    onClick={onToggleVideo}
                    className="rounded-full"
                    type="button"
                  >
                    {videoEnabled ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant={audioEnabled ? "secondary" : "destructive"}
                    size="icon"
                    onClick={onToggleAudio}
                    className="rounded-full"
                    type="button"
                  >
                    {audioEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="secondary"
                    size="icon"
                    onClick={onOpenSettings}
                    className="rounded-full"
                    type="button"
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <p className="text-xs text-white/90 text-center">
                Camera and microphone are off by default. Click to enable.
              </p>
            </CardContent>
          </Card>

          {/* Join Form */}
          <Card className="bg-[#FDFBF7]/50 border-[#1A1A1A]">
            <CardHeader className="pb-2">
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <User className="w-5 h-5 text-[#1A1A1A]" />
                Enter Your Details
              </CardTitle>
              <p className="text-xs text-white/70">Required to join the meeting</p>
            </CardHeader>
            <CardContent className="space-y-4" data-jbj-form>
              {/* Name Row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-white/85 text-xs mb-1 block">First Name *</Label>
                  <Input
                    value={formData.firstName}
                    onChange={(e) => updateField('firstName', e.target.value)}
                    placeholder="First"
                    className={`bg-[#1A1A1A] border-[#1A1A1A] text-white h-9 ${errors.firstName ? 'border-red-500' : ''}`}
                  />
                  {errors.firstName && <p className="text-red-400 text-xs mt-0.5">{errors.firstName}</p>}
                </div>
                <div>
                  <Label className="text-white/85 text-xs mb-1 block">Last Name *</Label>
                  <Input
                    value={formData.lastName}
                    onChange={(e) => updateField('lastName', e.target.value)}
                    placeholder="Last"
                    className={`bg-[#1A1A1A] border-[#1A1A1A] text-white h-9 ${errors.lastName ? 'border-red-500' : ''}`}
                  />
                  {errors.lastName && <p className="text-red-400 text-xs mt-0.5">{errors.lastName}</p>}
                </div>
              </div>

              {/* Email */}
              <div>
                <Label className="text-white/85 text-xs flex items-center gap-1 mb-1">
                  <Mail className="w-3 h-3 text-[#1A1A1A]" />
                  Email Address *
                </Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  placeholder="your@email.com"
                  className={`bg-[#1A1A1A] border-[#1A1A1A] text-white h-9 ${errors.email ? 'border-red-500' : ''}`}
                />
                {errors.email && <p className="text-red-400 text-xs mt-0.5">{errors.email}</p>}
              </div>

              {/* Phone */}
              <div>
                <Label className="text-white/85 text-xs flex items-center gap-1 mb-1">
                  <Phone className="w-3 h-3 text-[#1A1A1A]" />
                  Phone Number *
                </Label>
                <Input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => updateField('phone', e.target.value)}
                  placeholder="+971 50 123 4567"
                  className={`bg-[#1A1A1A] border-[#1A1A1A] text-white h-9 ${errors.phone ? 'border-red-500' : ''}`}
                />
                {errors.phone && <p className="text-red-400 text-xs mt-0.5">{errors.phone}</p>}
              </div>

              {/* Nationality */}
              <div>
                <Label className="text-white/85 text-xs flex items-center gap-1 mb-1">
                  <Globe className="w-3 h-3 text-[#1A1A1A]" />
                  Nationality *
                </Label>
                <Input
                  value={formData.nationality}
                  onChange={(e) => updateField('nationality', e.target.value)}
                  placeholder="e.g., British"
                  className={`bg-[#1A1A1A] border-[#1A1A1A] text-white h-9 ${errors.nationality ? 'border-red-500' : ''}`}
                />
                {errors.nationality && <p className="text-red-400 text-xs mt-0.5">{errors.nationality}</p>}
              </div>

              {/* Terms */}
              <div className="flex items-start gap-2 pt-2">
                <Checkbox
                  id="agree-terms"
                  checked={formData.agreeToTerms}
                  onCheckedChange={(checked) => updateField('agreeToTerms', checked === true)}
                  className="border-[#B89555]/50 data-[state=checked]:bg-[#EFE6D6] data-[state=checked]:border-[#B89555] mt-0.5"
                />
                <label htmlFor="agree-terms" className="text-white/85 text-xs leading-tight cursor-pointer">
                  I agree to the terms and consent to have my meeting data processed. 
                  <span className="text-white/90 block mt-1">
                    Your details are only visible to the meeting host.
                  </span>
                </label>
              </div>
              {errors.agreeToTerms && <p className="text-red-400 text-xs">{errors.agreeToTerms}</p>}

              <Button 
                onClick={handleSubmit}
                className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 mt-2"
              >
                <Video className="w-4 h-4 mr-2" />
                Join Meeting
              </Button>
            </CardContent>
          </Card>
        </div>

        <p className="text-center text-white/90 text-sm mt-4">
          Unlimited meeting time • Encrypted connections • First name only shown to participants
        </p>
      </div>
    </div>
  );
};

export default PreJoinForm;
