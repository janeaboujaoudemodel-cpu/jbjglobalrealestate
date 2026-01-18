// Chat message word filter for JBJ Video Meet
// Prevents sharing of contact information in chat (except for owner)

const BLOCKED_PATTERNS = [
  // Phone patterns
  /\+?\d{1,4}[\s\-]?\(?\d{1,4}\)?[\s\-]?\d{1,4}[\s\-]?\d{1,9}/g,
  /\b\d{10,15}\b/g,
  // Email patterns
  /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi,
  // Common request phrases
  /send\s+(me\s+)?(your\s+)?(number|phone|email|contact|whatsapp)/gi,
  /give\s+(me\s+)?(your\s+)?(number|phone|email|contact|whatsapp)/gi,
  /what('?s|\s+is)\s+(your\s+)?(number|phone|email|contact|whatsapp)/gi,
  /share\s+(your\s+)?(number|phone|email|contact|whatsapp)/gi,
  /my\s+(number|phone|email|whatsapp)\s+is/gi,
  /call\s+me\s+(at|on)/gi,
  /message\s+me\s+(at|on)/gi,
  /whatsapp\s+me/gi,
  /contact\s+me\s+(at|on|via)/gi,
];

const VIOLATION_MESSAGE = '⚠️ Sharing contact information is not allowed in this meeting. Please use the official channels.';

export interface FilterResult {
  isBlocked: boolean;
  filteredMessage: string;
  violationType?: 'phone' | 'email' | 'contact_request';
}

export const filterChatMessage = (
  message: string, 
  isOwner: boolean = false
): FilterResult => {
  // Owner can send anything
  if (isOwner) {
    return {
      isBlocked: false,
      filteredMessage: message
    };
  }

  // Check against all blocked patterns
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(message)) {
      // Determine violation type
      let violationType: FilterResult['violationType'] = 'contact_request';
      if (message.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi)) {
        violationType = 'email';
      } else if (message.match(/\+?\d{1,4}[\s\-]?\(?\d{1,4}\)?[\s\-]?\d{1,4}[\s\-]?\d{1,9}/g)) {
        violationType = 'phone';
      }

      return {
        isBlocked: true,
        filteredMessage: VIOLATION_MESSAGE,
        violationType
      };
    }
    // Reset regex lastIndex for global patterns
    pattern.lastIndex = 0;
  }

  return {
    isBlocked: false,
    filteredMessage: message
  };
};

export const getViolationWarning = (type: FilterResult['violationType']): string => {
  switch (type) {
    case 'phone':
      return 'Phone numbers cannot be shared in this chat.';
    case 'email':
      return 'Email addresses cannot be shared in this chat.';
    case 'contact_request':
      return 'Requests for contact information are not allowed.';
    default:
      return 'This action is restricted in this meeting.';
  }
};
