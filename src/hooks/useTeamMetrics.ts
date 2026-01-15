// Hook to calculate accurate team metrics from team-members config
import { useMemo } from 'react';
import { allTeamMembers, teamByDepartment } from '@/config/team-members';

export interface TeamMetrics {
  totalMembers: number;
  totalDepartments: number;
  totalLanguages: number;
  totalNationalities: number;
  languages: string[];
  nationalities: string[];
  departments: string[];
}

export function useTeamMetrics(): TeamMetrics {
  return useMemo(() => {
    // Calculate total team members (excluding AI Tools)
    const totalMembers = allTeamMembers.length;
    
    // Calculate unique departments from teamByDepartment keys
    const departments = Object.keys(teamByDepartment);
    const totalDepartments = departments.length;
    
    // Collect all unique languages from all team members
    const allLanguages = new Set<string>();
    allTeamMembers.forEach(member => {
      if (member.languages) {
        member.languages.forEach(lang => allLanguages.add(lang));
      }
    });
    const languages = Array.from(allLanguages).sort();
    const totalLanguages = languages.length;
    
    // Collect all unique nationalities from all team members
    const allNationalities = new Set<string>();
    allTeamMembers.forEach(member => {
      if (member.nationality) {
        // Handle compound nationalities like "Lebanese Canadian"
        const nats = member.nationality.split(/\s+/);
        nats.forEach(nat => {
          if (nat && nat.length > 2) {
            allNationalities.add(member.nationality);
          }
        });
      }
    });
    const nationalities = Array.from(allNationalities).sort();
    const totalNationalities = nationalities.length;
    
    return {
      totalMembers,
      totalDepartments,
      totalLanguages,
      totalNationalities,
      languages,
      nationalities,
      departments,
    };
  }, []);
}

export default useTeamMetrics;
