/**
 * Sales Hierarchy Classification System
 * AUTO_SYNC_HIERARCHY = TRUE
 * LOCKED_GLOBAL = TRUE
 * 
 * Automatically classifies Sales department employees into hierarchy categories
 * based on job titles. Synchronized across /team, /crm/employees, /dashboard, /team-communication
 */

export type SalesHierarchyCategory =
  | 'Vice President of Sales'
  | 'Head of Sales'
  | 'Sales Director / Regional Manager'
  | 'Sales Manager'
  | 'Senior Property Consultant / Senior Sales Executive'
  | 'Property Consultant / Sales Executive'
  | 'Junior Sales Consultant / Associate'
  | 'Sales Coordinator / Administrative Support'
  | 'Uncategorized';

export interface SalesHierarchyLevel {
  category: SalesHierarchyCategory;
  level: number; // 1 = highest (VP), 8 = lowest (Coordinator)
  displayOrder: number;
}

// Mapping of hierarchy categories to their display order and level
export const SALES_HIERARCHY_LEVELS: Record<SalesHierarchyCategory, SalesHierarchyLevel> = {
  'Vice President of Sales': { category: 'Vice President of Sales', level: 1, displayOrder: 1 },
  'Head of Sales': { category: 'Head of Sales', level: 2, displayOrder: 2 },
  'Sales Director / Regional Manager': { category: 'Sales Director / Regional Manager', level: 3, displayOrder: 3 },
  'Sales Manager': { category: 'Sales Manager', level: 4, displayOrder: 4 },
  'Senior Property Consultant / Senior Sales Executive': { category: 'Senior Property Consultant / Senior Sales Executive', level: 5, displayOrder: 5 },
  'Property Consultant / Sales Executive': { category: 'Property Consultant / Sales Executive', level: 6, displayOrder: 6 },
  'Junior Sales Consultant / Associate': { category: 'Junior Sales Consultant / Associate', level: 7, displayOrder: 7 },
  'Sales Coordinator / Administrative Support': { category: 'Sales Coordinator / Administrative Support', level: 8, displayOrder: 8 },
  'Uncategorized': { category: 'Uncategorized', level: 99, displayOrder: 99 },
};

/**
 * Classifies a Sales employee into their hierarchy category based on job title
 * 
 * Rules:
 * 1. "Vice President" → Vice President of Sales
 * 2. "Head of Sales" → Head of Sales
 * 3. "Director" or "Regional Manager" → Sales Director / Regional Manager
 * 4. "Manager" (without Director) → Sales Manager
 * 5. "Senior" → Senior Property Consultant / Senior Sales Executive
 * 6. "Consultant" or "Executive" (without Senior) → Property Consultant / Sales Executive
 * 7. "Associate" or "Junior" → Junior Sales Consultant / Associate
 * 8. "Coordinator" or "Assistant" → Sales Coordinator / Administrative Support
 */
export function classifySalesRole(title: string): SalesHierarchyCategory {
  const normalizedTitle = title.toLowerCase().trim();

  // Rule 1: Vice President
  if (normalizedTitle.includes('vice president') || normalizedTitle.includes('vp of sales')) {
    return 'Vice President of Sales';
  }

  // Rule 2: Head of Sales
  if (normalizedTitle.includes('head of sales')) {
    return 'Head of Sales';
  }

  // Rule 3: Director or Regional Manager
  if (normalizedTitle.includes('director') || normalizedTitle.includes('regional manager')) {
    return 'Sales Director / Regional Manager';
  }

  // Rule 4: Manager (without Director)
  if (normalizedTitle.includes('manager') && !normalizedTitle.includes('director')) {
    return 'Sales Manager';
  }

  // Rule 5: Senior roles
  if (normalizedTitle.includes('senior')) {
    return 'Senior Property Consultant / Senior Sales Executive';
  }

  // Rule 7: Associate or Junior (check before general Consultant/Executive)
  if (normalizedTitle.includes('associate') || normalizedTitle.includes('junior')) {
    return 'Junior Sales Consultant / Associate';
  }

  // Rule 8: Coordinator or Assistant
  if (normalizedTitle.includes('coordinator') || normalizedTitle.includes('assistant')) {
    return 'Sales Coordinator / Administrative Support';
  }

  // Rule 6: Consultant or Executive (without Senior)
  if (normalizedTitle.includes('consultant') || normalizedTitle.includes('executive')) {
    return 'Property Consultant / Sales Executive';
  }

  // Default fallback
  return 'Uncategorized';
}

/**
 * Gets the hierarchy level number for a Sales role
 * Lower numbers = higher seniority
 */
export function getSalesHierarchyLevel(title: string): number {
  const category = classifySalesRole(title);
  return SALES_HIERARCHY_LEVELS[category].level;
}

/**
 * Sorts Sales team members by hierarchy level (highest first)
 * Within the same level, "Senior" titles come before non-senior
 */
export function sortSalesByHierarchy<T extends { role: string }>(members: T[]): T[] {
  return [...members].sort((a, b) => {
    const levelA = getSalesHierarchyLevel(a.role);
    const levelB = getSalesHierarchyLevel(b.role);
    
    // First sort by hierarchy level
    if (levelA !== levelB) {
      return levelA - levelB;
    }
    
    // Within same level, prioritize "Senior" titles
    const aIsSenior = a.role.toLowerCase().includes('senior');
    const bIsSenior = b.role.toLowerCase().includes('senior');
    
    if (aIsSenior && !bIsSenior) return -1;
    if (!aIsSenior && bIsSenior) return 1;
    
    return 0;
  });
}

/**
 * Groups Sales team members by their hierarchy category
 */
export function groupSalesByCategory<T extends { role: string }>(
  members: T[]
): Map<SalesHierarchyCategory, T[]> {
  const groups = new Map<SalesHierarchyCategory, T[]>();

  // Initialize all categories
  Object.keys(SALES_HIERARCHY_LEVELS).forEach((category) => {
    groups.set(category as SalesHierarchyCategory, []);
  });

  // Classify each member
  members.forEach((member) => {
    const category = classifySalesRole(member.role);
    const categoryMembers = groups.get(category) || [];
    categoryMembers.push(member);
    groups.set(category, categoryMembers);
  });

  return groups;
}

/**
 * Returns all hierarchy categories in display order (highest to lowest)
 */
export function getSalesHierarchyCategories(): SalesHierarchyCategory[] {
  return Object.values(SALES_HIERARCHY_LEVELS)
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .map((level) => level.category);
}

/**
 * Validates that all Sales members have been properly classified
 * Returns array of any unclassified members
 */
export function validateSalesClassification<T extends { role: string; name: string }>(
  members: T[]
): { member: T; category: SalesHierarchyCategory }[] {
  const uncategorized: { member: T; category: SalesHierarchyCategory }[] = [];

  members.forEach((member) => {
    const category = classifySalesRole(member.role);
    if (category === 'Uncategorized') {
      uncategorized.push({ member, category });
    }
  });

  return uncategorized;
}
