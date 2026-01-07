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

export type ChatStep = 'welcome_choice' | 'check_email' | 'collect_info' | 'chat_history' | 'select_service' | 'agent_joining' | 'chatting' | 'rating' | 'submitted';

export interface ServiceOption {
  id: string;
  icon: LucideIcon;
  label: string;
  description: string;
}

// Multiple agent personas for a real team experience
export const AGENTS = [
  {
    name: 'Alex',
    fullName: 'Alex Morgan',
    title: 'Senior Property Consultant',
    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face',
  },
  {
    name: 'Sarah',
    fullName: 'Sarah Al Rashid',
    title: 'Property Consultant',
    photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&h=200&fit=crop&crop=face',
  },
  {
    name: 'David',
    fullName: 'David Chen',
    title: 'Investment Advisor',
    photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face',
  },
  {
    name: 'Leah',
    fullName: 'Leah Williams',
    title: 'Client Relations Manager',
    photo: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&h=200&fit=crop&crop=face',
  },
  {
    name: 'Patrick',
    fullName: 'Patrick O\'Brien',
    title: 'Luxury Property Specialist',
    photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face',
  },
  {
    name: 'Troy',
    fullName: 'Troy Hassan',
    title: 'Off-Plan Investment Consultant',
    photo: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&h=200&fit=crop&crop=face',
  },
  {
    name: 'John',
    fullName: 'John Richardson',
    title: 'Property Consultant',
    photo: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&h=200&fit=crop&crop=face',
  },
];

// Get a random agent (consistent per session using sessionStorage)
export const getRandomAgent = () => {
  const stored = sessionStorage.getItem('jj_chat_agent');
  if (stored) {
    const parsed = JSON.parse(stored);
    return AGENTS.find(a => a.name === parsed.name) || AGENTS[0];
  }
  const agent = AGENTS[Math.floor(Math.random() * AGENTS.length)];
  sessionStorage.setItem('jj_chat_agent', JSON.stringify(agent));
  return agent;
};

// Legacy export for compatibility
export const AGENT = AGENTS[1]; // Sarah as default

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
