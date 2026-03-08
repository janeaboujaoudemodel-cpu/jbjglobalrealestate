/**
 * UNIFIED LISTING APPROVAL WORKFLOW
 * 
 * This configuration defines the standardized approval workflow for ALL property listings
 * including both Rental (Landlord) and Sale (Seller) listings.
 * 
 * Workflow Structure:
 * 1. Admin Review - Operations Manager reviews for completeness and compliance
 * 2. Leadership Review - Managing Director (highest after Founder) strategic approval
 * 3. Executive Assistant Review - Founder's EA final vetting before owner
 * 4. Final Approval - Founder & CEO gives final go-live authorization
 */

// Import team member photos for workflow visualization
import sarahMitchellListingAdmin from '@/assets/team/sarah-mitchell-listing-admin.png';
import davidThorntonMd from '@/assets/team/david-thornton-md-40s-realistic.png';
import amandaClarkeExecutiveAssistant from '@/assets/team/amanda-clarke-executive-assistant.png';
import janeBouJaoudeCeo from '@/assets/ceo/jane-ceo-black-suit-original.jpg';

export type ListingType = 'rental' | 'sale';

export interface ApprovalStep {
  step: number;
  name: string;
  role: string;
  approverName: string;
  approverTitle: string;
  approverDepartment: string;
  approverPhoto: string;
  approverEmail: string;
  approverLanguages: string[];
  approverNationality: string;
  approverExperience: string;
  approverBio: string;
  joinedDate: string;
  hierarchyLevel: number;
}

/**
 * UNIFIED APPROVAL WORKFLOW
 * Used for both Rental Listings and Seller Listings
 * 
 * Step 1: Admin Review (Operations Manager)
 * Step 2: Leadership Review (Managing Director - highest leadership after Founder)
 * Step 3: Executive Assistant Review (Founder's EA - Amanda Clarke)
 * Step 4: Final Approval (Founder & CEO)
 */
export const UNIFIED_APPROVAL_WORKFLOW: ApprovalStep[] = [
  {
    step: 1,
    name: 'Admin Review',
    role: 'admin',
    approverName: 'Sarah Mitchell',
    approverTitle: 'Operations Manager',
    approverDepartment: 'Operations',
    approverPhoto: sarahMitchellListingAdmin,
    approverEmail: 'sarah@jbj.ae',
    approverLanguages: ['English', 'Arabic'],
    approverNationality: 'British',
    approverExperience: '8 years in real estate operations',
    approverBio: 'Sarah leads our operations team with a focus on ensuring quality and compliance across all property listings. She reviews submissions for completeness, accuracy, and adherence to JBJ standards.',
    joinedDate: '2019-03-15',
    hierarchyLevel: 4,
  },
  {
    step: 2,
    name: 'Leadership Review',
    role: 'leadership',
    approverName: 'David Thornton',
    approverTitle: 'Managing Director',
    approverDepartment: 'Executive',
    approverPhoto: davidThorntonMd,
    approverEmail: 'david@jbj.ae',
    approverLanguages: ['English'],
    approverNationality: 'British',
    approverExperience: '12+ years in executive real estate management',
    approverBio: 'David oversees operations and performance across all global divisions. As Managing Director, he ensures strategic alignment of all listings with JBJ\'s brand standards and market positioning.',
    joinedDate: '2018-01-10',
    hierarchyLevel: 2,
  },
  {
    step: 3,
    name: 'Executive Review',
    role: 'executive_assistant',
    approverName: 'Amanda Clarke',
    approverTitle: 'Executive Assistant to CEO',
    approverDepartment: 'Executive Office',
    approverPhoto: amandaClarkeExecutiveAssistant,
    approverEmail: 'amanda@jbj.ae',
    approverLanguages: ['English', 'Spanish'],
    approverNationality: 'American',
    approverExperience: '7 years in executive administration',
    approverBio: 'Amanda serves as the trusted right-hand of Miss Jane, coordinating all executive matters. She ensures all listings meet the highest standards before final approval.',
    joinedDate: '2018-01-10',
    hierarchyLevel: 4,
  },
  {
    step: 4,
    name: 'Final Approval',
    role: 'founder',
    approverName: 'Jane Bou Jaoude',
    approverTitle: 'Founder & CEO',
    approverDepartment: 'Executive',
    approverPhoto: janeBouJaoudeCeo,
    approverEmail: 'janeabujaudenails@gmail.com',
    approverLanguages: ['English', 'Arabic', 'French', 'Spanish'],
    approverNationality: 'Lebanese',
    approverExperience: '12+ years in luxury real estate',
    approverBio: 'Jane founded JBJ Global Real Estate with a vision to revolutionize the luxury property market in the UAE. Every listing receives her personal final approval.',
    joinedDate: '2017-01-01',
    hierarchyLevel: 1,
  },
];

/**
 * Get workflow for a specific listing type
 * Currently both types use the same workflow, but this allows future customization
 */
export function getApprovalWorkflow(listingType: ListingType): ApprovalStep[] {
  return UNIFIED_APPROVAL_WORKFLOW;
}

/**
 * Get step by role
 */
export function getStepByRole(role: string): ApprovalStep | undefined {
  return UNIFIED_APPROVAL_WORKFLOW.find(step => step.role === role);
}

/**
 * Get next step after current
 */
export function getNextStep(currentStep: number): ApprovalStep | undefined {
  return UNIFIED_APPROVAL_WORKFLOW.find(step => step.step === currentStep + 1);
}

/**
 * Check if all steps are complete
 */
export function isWorkflowComplete(approvedSteps: number[]): boolean {
  return UNIFIED_APPROVAL_WORKFLOW.every(step => approvedSteps.includes(step.step));
}

/**
 * Get total number of steps
 */
export function getTotalSteps(): number {
  return UNIFIED_APPROVAL_WORKFLOW.length;
}

/**
 * Role to step mapping for quick lookup
 */
export const ROLE_TO_STEP_MAP: Record<string, number> = {
  admin: 1,
  leadership: 2,
  executive_assistant: 3,
  founder: 4,
};

/**
 * Step to database column mapping
 */
export const STEP_TO_DB_COLUMN_MAP: Record<number, { approvedAt: string; approvedBy: string }> = {
  1: { approvedAt: 'admin_approved_at', approvedBy: 'admin_approved_by' },
  2: { approvedAt: 'leadership_approved_at', approvedBy: 'leadership_approved_by' },
  3: { approvedAt: 'assistant_approved_at', approvedBy: 'assistant_approved_by' },
  4: { approvedAt: 'founder_approved_at', approvedBy: 'founder_approved_by' },
};

// For backwards compatibility - re-export as the old name
export const APPROVAL_WORKFLOW = UNIFIED_APPROVAL_WORKFLOW;

export default UNIFIED_APPROVAL_WORKFLOW;
