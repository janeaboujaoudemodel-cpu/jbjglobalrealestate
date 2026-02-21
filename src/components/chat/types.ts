import { Building2, Home, Scale, Paintbrush, Plane, MessageCircle, LucideIcon } from 'lucide-react';
import { CONTACT_INFO } from '@/constants/stats';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface ChatHistoryItem {
  id: string;
  service_type: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  messages: Array<{ role: string; content: string; timestamp: string }>;
}

export interface UserInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  nationality: string;
  language: string;
  currentLocation: string;
  ageRange: string;
  birthday: string;
  consentAccurate: boolean;
  consentPrivacy: boolean;
}

export type ChatStep = 'welcome_choice' | 'shortcuts' | 'cv_submission' | 'cv_submitted' | 'check_email' | 'collect_info' | 'conversational_collect' | 'chat_history' | 'select_service' | 'agent_joining' | 'chatting' | 'rating' | 'feedback' | 'submitted';

export interface ServiceOption {
  id: string;
  icon: LucideIcon;
  label: string;
  description: string;
}

// Chat agent persona
export const AGENTS = [
  {
    name: 'Natalia',
    fullName: 'Natalia Petrova',
    title: 'Available 24/7 to support you',
    photo: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&h=200&fit=crop&crop=face',
  },
];

// Get agent (single agent - Natalia)
export const getRandomAgent = () => {
  return AGENTS[0];
};

// Legacy export for compatibility
export const AGENT = AGENTS[0]; // Natalia as default

export const SERVICES: ServiceOption[] = [
  { id: 'real_estate', icon: Building2, label: 'Property Sales & Rentals', description: 'Buy, sell, or rent properties' },
  { id: 'holiday_homes', icon: Home, label: 'Holiday Homes', description: 'Short-term rental support' },
  { id: 'sell_property', icon: Building2, label: 'Sell Your Property', description: 'List your property for sale' },
  { id: 'rent_property', icon: Home, label: 'List for Rent', description: 'List your property for rent' },
  { id: 'partner_intro', icon: Scale, label: 'Partner Introductions', description: 'Legal, mortgage, property management' },
  { id: 'design_build', icon: Paintbrush, label: 'Design & Build', description: 'Architecture, interior, fit-out' },
  { id: 'guides', icon: Plane, label: 'Guides & Resources', description: 'Dubai guides, visa, golden visa' },
  { id: 'ai_tools', icon: MessageCircle, label: 'AI Tools & Features', description: 'Property finder, measure, explore' },
  { id: 'cv_submission', icon: Scale, label: 'Submit Your CV', description: 'Career opportunities with us' },
  { id: 'general', icon: MessageCircle, label: 'General Inquiry', description: 'Other questions' },
];

export const AGE_RANGES = [
  { value: '18-24', label: '18-24' },
  { value: '25-34', label: '25-34' },
  { value: '35-44', label: '35-44' },
  { value: '45-54', label: '45-54' },
  { value: '55+', label: '55+' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
];

export const LANGUAGES = [
  { value: 'english', label: 'English' },
  { value: 'arabic', label: 'العربية (Arabic)' },
  { value: 'french', label: 'Français (French)' },
  { value: 'russian', label: 'Русский (Russian)' },
  { value: 'chinese', label: '中文 (Chinese)' },
  { value: 'hindi', label: 'हिंदी (Hindi)' },
  { value: 'other', label: 'Other' },
];

// E.164 phone validation
export const validateE164Phone = (phone: string): boolean => {
  const e164Regex = /^\+[1-9]\d{6,14}$/;
  return e164Regex.test(phone.replace(/[\s\-\(\)]/g, ''));
};

// Email validation
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Get relative time ago string
export const getTimeAgo = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

// Approved contact info block for AI responses
export const APPROVED_CONTACT_BLOCK = `

📧 Email: ${CONTACT_INFO.email}
📞 Phone: ${CONTACT_INFO.phone}
💬 WhatsApp: ${CONTACT_INFO.phone}

Our team is available to assist you.`;

// Initial user info state
export const initialUserInfo: UserInfo = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  nationality: '',
  language: 'english',
  currentLocation: '',
  ageRange: '',
  birthday: '',
  consentAccurate: false,
  consentPrivacy: false,
};
