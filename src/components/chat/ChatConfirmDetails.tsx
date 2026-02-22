import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Mail, Phone, CheckCircle, Edit3, ArrowRight, Loader2 } from 'lucide-react';
import jbjMonogramLightBg from "@/assets/jbj-monogram-light-bg.png";

interface ChatConfirmDetailsProps {
  name: string;
  email: string;
  phone: string;
  onContinue: () => void;
  onUpdateDetails: (updated: { name: string; email: string; phone: string }) => Promise<void>;
}

const ChatConfirmDetails = ({ name, email, phone, onContinue, onUpdateDetails }: ChatConfirmDetailsProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(name);
  const [editEmail, setEditEmail] = useState(email);
  const [editPhone, setEditPhone] = useState(phone);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!editEmail.trim()) return;
    setIsSaving(true);
    try {
      await onUpdateDetails({ name: editName, email: editEmail, phone: editPhone });
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex-1 p-5 pb-8 flex flex-col items-center justify-center text-center overflow-y-auto">
      <div className="mb-4">
        <img
          src={jbjMonogramLightBg}
          alt="JBJ Global Real Estate"
          className="h-16 w-auto mx-auto object-contain"
        />
      </div>

      <div className="mb-4">
        <h4 className="text-[#1a1a1a] text-lg font-bold mb-1">Welcome Back!</h4>
        <p className="text-zinc-600 text-sm">Please confirm your details to continue</p>
      </div>

      <div className="w-full bg-white/80 rounded-xl border border-[#C8A766]/30 p-4 space-y-3">
        {!isEditing ? (
          <>
            <div className="flex items-center gap-3 text-left">
              <User className="w-4 h-4 text-[#C8A766] shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-zinc-500">Name</p>
                <p className="text-sm font-semibold text-black truncate">{name || 'Not provided'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-left">
              <Mail className="w-4 h-4 text-[#C8A766] shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-zinc-500">Email</p>
                <p className="text-sm font-semibold text-black truncate">{email}</p>
              </div>
            </div>
            {phone && (
              <div className="flex items-center gap-3 text-left">
                <Phone className="w-4 h-4 text-[#C8A766] shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-zinc-500">Phone</p>
                  <p className="text-sm font-semibold text-black truncate">{phone}</p>
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="text-left">
              <Label className="text-black text-xs flex items-center gap-1.5 mb-1">
                <User className="w-3.5 h-3.5 text-[#C8A766]" /> Name
              </Label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="bg-white border-[#C8A766]/30 text-black h-10"
              />
            </div>
            <div className="text-left">
              <Label className="text-black text-xs flex items-center gap-1.5 mb-1">
                <Mail className="w-3.5 h-3.5 text-[#C8A766]" /> Email
              </Label>
              <Input
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                className="bg-white border-[#C8A766]/30 text-black h-10"
              />
            </div>
            <div className="text-left">
              <Label className="text-black text-xs flex items-center gap-1.5 mb-1">
                <Phone className="w-3.5 h-3.5 text-[#C8A766]" /> Phone
              </Label>
              <Input
                type="tel"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                className="bg-white border-[#C8A766]/30 text-black h-10"
              />
            </div>
          </>
        )}
      </div>

      <div className="w-full mt-4 space-y-2">
        {!isEditing ? (
          <>
            <Button
              onClick={onContinue}
              className="w-full h-12 bg-gradient-to-r from-[#C8A766] to-[#B8944A] hover:from-[#B8944A] hover:to-[#A8843A] text-black font-bold"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Continue
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button
              variant="ghost"
              onClick={() => setIsEditing(true)}
              className="w-full h-10 text-zinc-600 hover:text-black hover:bg-black/5 text-sm"
            >
              <Edit3 className="w-3.5 h-3.5 mr-1.5" />
              Update My Details
            </Button>
          </>
        ) : (
          <>
            <Button
              onClick={handleSave}
              disabled={isSaving || !editEmail.trim()}
              className="w-full h-12 bg-gradient-to-r from-[#C8A766] to-[#B8944A] hover:from-[#B8944A] hover:to-[#A8843A] text-black font-bold"
            >
              {isSaving ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
              ) : (
                <><CheckCircle className="w-4 h-4 mr-2" /> Save & Continue</>
              )}
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setEditName(name);
                setEditEmail(email);
                setEditPhone(phone);
                setIsEditing(false);
              }}
              className="w-full h-10 text-zinc-600 hover:text-black hover:bg-black/5 text-sm"
            >
              Cancel
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default ChatConfirmDetails;
