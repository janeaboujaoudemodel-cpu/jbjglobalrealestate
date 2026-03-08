/**
 * Employee Utilities - JBJ Global Real Estate
 * Helper functions for employee-related features
 * 
 * LOCKED_GLOBAL = TRUE
 */

import { TeamMember } from '@/config/team-members';
import { differenceInDays, parseISO, format } from 'date-fns';

// ============================================
// NEW JOINER DETECTION
// ============================================

const NEW_JOINER_DAYS = 14; // 2 weeks

/**
 * Check if employee is a new joiner (within 2 weeks of join date)
 */
export function isNewJoiner(member: TeamMember): boolean {
  if (!member.joinDate) return false;
  
  try {
    const joinDate = parseISO(member.joinDate);
    const today = new Date();
    const daysSinceJoining = differenceInDays(today, joinDate);
    
    return daysSinceJoining >= 0 && daysSinceJoining <= NEW_JOINER_DAYS;
  } catch {
    return false;
  }
}

/**
 * Get days since employee joined
 */
export function getDaysSinceJoining(member: TeamMember): number | null {
  if (!member.joinDate) return null;
  
  try {
    const joinDate = parseISO(member.joinDate);
    return differenceInDays(new Date(), joinDate);
  } catch {
    return null;
  }
}

/**
 * Format join date for display
 */
export function formatJoinDate(member: TeamMember): string {
  if (!member.joinDate) return 'Not available';
  
  try {
    const joinDate = parseISO(member.joinDate);
    return format(joinDate, 'MMMM dd, yyyy');
  } catch {
    return 'Not available';
  }
}

/**
 * Get new joiner badge label
 */
export function getNewJoinerLabel(member: TeamMember): string | null {
  if (!isNewJoiner(member)) return null;
  
  const days = getDaysSinceJoining(member);
  if (days === null) return null;
  
  if (days === 0) return 'Joined Today!';
  if (days === 1) return 'Joined Yesterday';
  if (days <= 7) return 'New This Week';
  return 'New Joiner';
}

// ============================================
// TENURE CALCULATION
// ============================================

/**
 * Get tenure label (e.g., "2 years, 3 months")
 */
export function getTenureLabel(member: TeamMember): string {
  if (!member.joinDate) return 'Not available';
  
  try {
    const joinDate = parseISO(member.joinDate);
    const today = new Date();
    const days = differenceInDays(today, joinDate);
    
    if (days < 0) return 'Starting soon';
    if (days === 0) return 'Joined today';
    if (days < 30) return `${days} day${days !== 1 ? 's' : ''}`;
    
    const months = Math.floor(days / 30);
    if (months < 12) return `${months} month${months !== 1 ? 's' : ''}`;
    
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    
    if (remainingMonths === 0) {
      return `${years} year${years !== 1 ? 's' : ''}`;
    }
    
    return `${years} year${years !== 1 ? 's' : ''}, ${remainingMonths} month${remainingMonths !== 1 ? 's' : ''}`;
  } catch {
    return 'Not available';
  }
}

// ============================================
// EMPLOYEE CLASSIFICATION
// ============================================

/**
 * Check if employee is a real human (not AI)
 */
export function isRealEmployee(member: TeamMember): boolean {
  return member.isAI === false;
}

/**
 * Check if employee is AI persona
 */
export function isAIPersona(member: TeamMember): boolean {
  return member.isAI === true;
}

/**
 * Get employee type label
 */
export function getEmployeeTypeLabel(member: TeamMember): string {
  if (member.id === 'jane-bou-jaoude') return 'Founder & CEO';
  if (member.isAI === false) return 'Employee';
  return 'Team Member';
}

// ============================================
// HIERARCHY HELPERS
// ============================================

/**
 * Check if employee is in leadership position
 */
export function isLeadership(member: TeamMember): boolean {
  if (!member.hierarchyLevel) return false;
  return member.hierarchyLevel <= 3;
}

/**
 * Check if employee is department head
 */
export function isDepartmentHead(member: TeamMember): boolean {
  const headKeywords = ['director', 'head', 'manager', 'lead', 'chief'];
  const lowerRole = member.role.toLowerCase();
  return headKeywords.some(keyword => lowerRole.includes(keyword)) && 
         (member.hierarchyLevel === undefined || member.hierarchyLevel <= 4);
}

/**
 * Check if employee can conduct interviews
 */
export function canConductInterviews(member: TeamMember): boolean {
  return member.canConductInterviews === true;
}

// ============================================
// CONTACT DISPLAY
// ============================================

/**
 * Get formatted languages display
 */
export function formatLanguages(member: TeamMember, maxDisplay: number = 3): string {
  if (!member.languages || member.languages.length === 0) return 'English';
  
  if (member.languages.length <= maxDisplay) {
    return member.languages.join(', ');
  }
  
  const displayed = member.languages.slice(0, maxDisplay);
  const remaining = member.languages.length - maxDisplay;
  return `${displayed.join(', ')} +${remaining}`;
}

/**
 * Get initials from name
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// ============================================
// STATUS HELPERS
// ============================================

/**
 * Get status color class
 */
export function getStatusColorClass(status?: 'online' | 'away' | 'offline'): string {
  switch (status) {
    case 'online':
      return 'bg-green-500';
    case 'away':
      return 'bg-amber-500';
    case 'offline':
      return 'bg-zinc-500';
    default:
      return 'bg-zinc-500';
  }
}

/**
 * Get status label
 */
export function getStatusLabel(status?: 'online' | 'away' | 'offline'): string {
  switch (status) {
    case 'online':
      return 'Online';
    case 'away':
      return 'Away';
    case 'offline':
      return 'Offline';
    default:
      return 'Unknown';
  }
}
