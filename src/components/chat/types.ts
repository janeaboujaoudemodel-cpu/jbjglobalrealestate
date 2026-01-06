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
  consentAccurate: boolean;
  consentPrivacy: boolean;
}

export type ChatStep = 'welcome_choice' | 'check_email' | 'collect_info' | 'chat_history' | 'select_service' | 'chatting' | 'rating' | 'submitted';

export interface ServiceOption {
  id: string;
  icon: LucideIcon;
  label: string;
  description: string;
}

// Agent persona for human-like experience
export const AGENT = {
  name: 'Sara',
  fullName: 'Sara Al Rashid',
  title: 'Property Consultant',
  photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&h=200&fit=crop&crop=face',
};

export const SERVICES: ServiceOption[] = [
  { id: 'real_estate', icon: Building2, label: 'Property Sales & Leasing', description: 'Brokerage for buying, selling, leasing' },
  { id: 'holiday_homes', icon: Home, label: 'Holiday Homes', description: 'Short-term rental support' },
  { id: 'partner_intro', icon: Scale, label: 'Partner Introductions', description: 'Legal, mortgage, concierge partners' },
  { id: 'design_build', icon: Paintbrush, label: 'Design & Build', description: 'Architecture, interior, fit-out partners' },
  { id: 'concierge', icon: Plane, label: 'Luxury Concierge', description: 'Jets, yachts, VIP experiences' },
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
  consentAccurate: false,
  consentPrivacy: false,
};
