/**
 * User-Specific AI Assistants Configuration
 * Each user gets a unique assistant with different name and photo
 * This ensures personalized experience across the platform
 */

export interface UserAssistant {
  id: string;
  name: string;
  role: string;
  avatar: string;
  gender: 'male' | 'female';
  nationality: string;
  languages: string[];
  bio: string;
}

// Pool of available assistants - each user gets assigned one based on their user ID hash
export const ASSISTANT_POOL: UserAssistant[] = [
  {
    id: 'assistant-1',
    name: 'Sophie Williams',
    role: 'Personal Executive Assistant',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face',
    gender: 'female',
    nationality: 'British',
    languages: ['English', 'French'],
    bio: 'Your dedicated assistant ready to help with all tasks and communications.',
  },
  {
    id: 'assistant-2',
    name: 'Emma Richardson',
    role: 'Personal Executive Assistant',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face',
    gender: 'female',
    nationality: 'Australian',
    languages: ['English', 'Spanish'],
    bio: 'Here to ensure your workflow is seamless and efficient.',
  },
  {
    id: 'assistant-3',
    name: 'Olivia Bennett',
    role: 'Personal Executive Assistant',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=face',
    gender: 'female',
    nationality: 'Canadian',
    languages: ['English', 'German'],
    bio: 'Committed to providing top-tier support for your daily operations.',
  },
  {
    id: 'assistant-4',
    name: 'Charlotte Davis',
    role: 'Personal Executive Assistant',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&h=200&fit=crop&crop=face',
    gender: 'female',
    nationality: 'Irish',
    languages: ['English', 'Italian'],
    bio: 'Your trusted partner in managing priorities and communications.',
  },
  {
    id: 'assistant-5',
    name: 'Isabella Moore',
    role: 'Personal Executive Assistant',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop&crop=face',
    gender: 'female',
    nationality: 'American',
    languages: ['English', 'Portuguese'],
    bio: 'Dedicated to making your professional life more organized.',
  },
  {
    id: 'assistant-6',
    name: 'Mia Thompson',
    role: 'Personal Executive Assistant',
    avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=200&h=200&fit=crop&crop=face',
    gender: 'female',
    nationality: 'New Zealand',
    languages: ['English', 'Mandarin'],
    bio: 'Your personal aide for all administrative and executive tasks.',
  },
  {
    id: 'assistant-7',
    name: 'James Harrison',
    role: 'Personal Executive Assistant',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face',
    gender: 'male',
    nationality: 'British',
    languages: ['English', 'Arabic'],
    bio: 'Focused on delivering exceptional support and coordination.',
  },
  {
    id: 'assistant-8',
    name: 'Alexander Wright',
    role: 'Personal Executive Assistant',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face',
    gender: 'male',
    nationality: 'Scottish',
    languages: ['English', 'French'],
    bio: 'Here to streamline your operations and communications.',
  },
  {
    id: 'assistant-9',
    name: 'William Parker',
    role: 'Personal Executive Assistant',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face',
    gender: 'male',
    nationality: 'Welsh',
    languages: ['English', 'Spanish'],
    bio: 'Your reliable assistant for day-to-day task management.',
  },
  {
    id: 'assistant-10',
    name: 'Benjamin Cole',
    role: 'Personal Executive Assistant',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&h=200&fit=crop&crop=face',
    gender: 'male',
    nationality: 'South African',
    languages: ['English', 'Afrikaans'],
    bio: 'Committed to ensuring your success through organized support.',
  },
];

/**
 * Get a consistent assistant for a user based on their user ID
 * Uses simple hash to ensure same user always gets same assistant
 */
export function getUserAssistant(userId: string): UserAssistant {
  if (!userId) {
    return ASSISTANT_POOL[0];
  }
  
  // Simple hash function to get consistent index
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    const char = userId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  const index = Math.abs(hash) % ASSISTANT_POOL.length;
  return ASSISTANT_POOL[index];
}

/**
 * Get assistant by ID
 */
export function getAssistantById(assistantId: string): UserAssistant | undefined {
  return ASSISTANT_POOL.find(a => a.id === assistantId);
}
