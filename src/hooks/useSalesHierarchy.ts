import { useMemo } from 'react';
import { salesTeam, TeamMember } from '@/config/team-members';
import {
  classifySalesRole,
  getSalesHierarchyLevel,
  sortSalesByHierarchy,
  groupSalesByCategory,
  getSalesHierarchyCategories,
  SalesHierarchyCategory,
  SALES_HIERARCHY_LEVELS,
} from '@/utils/salesHierarchyClassification';

export interface ClassifiedSalesMember extends TeamMember {
  hierarchyCategory: SalesHierarchyCategory;
  hierarchyCategoryLevel: number;
}

/**
 * Hook to get classified Sales department members with hierarchy categories
 * AUTO_SYNC_HIERARCHY = TRUE
 * LOCKED_GLOBAL = TRUE
 * 
 * Synchronized across /team, /crm/employees, /dashboard, /team-communication
 */
export function useSalesHierarchy() {
  // Classify all sales team members
  const classifiedMembers = useMemo<ClassifiedSalesMember[]>(() => {
    return salesTeam.map((member) => ({
      ...member,
      hierarchyCategory: classifySalesRole(member.role),
      hierarchyCategoryLevel: getSalesHierarchyLevel(member.role),
    }));
  }, []);

  // Sort by hierarchy
  const sortedMembers = useMemo(() => {
    return sortSalesByHierarchy(classifiedMembers);
  }, [classifiedMembers]);

  // Group by category
  const groupedByCategory = useMemo(() => {
    return groupSalesByCategory(classifiedMembers);
  }, [classifiedMembers]);

  // Get category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<SalesHierarchyCategory, number> = {} as Record<SalesHierarchyCategory, number>;
    getSalesHierarchyCategories().forEach((category) => {
      counts[category] = groupedByCategory.get(category)?.length || 0;
    });
    return counts;
  }, [groupedByCategory]);

  // Get members by specific category
  const getMembersByCategory = (category: SalesHierarchyCategory): ClassifiedSalesMember[] => {
    return (groupedByCategory.get(category) || []) as ClassifiedSalesMember[];
  };

  // Get all categories with members (non-empty)
  const activeCategories = useMemo(() => {
    return getSalesHierarchyCategories().filter(
      (category) => (groupedByCategory.get(category)?.length || 0) > 0
    );
  }, [groupedByCategory]);

  return {
    // All classified members
    members: classifiedMembers,
    // Sorted by hierarchy (highest first)
    sortedMembers,
    // Grouped by hierarchy category
    groupedByCategory,
    // Category counts
    categoryCounts,
    // Get members by specific category
    getMembersByCategory,
    // All hierarchy categories in order
    allCategories: getSalesHierarchyCategories(),
    // Only categories that have members
    activeCategories,
    // Hierarchy levels reference
    hierarchyLevels: SALES_HIERARCHY_LEVELS,
    // Total count
    totalCount: classifiedMembers.length,
  };
}

export default useSalesHierarchy;
