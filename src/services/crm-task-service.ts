/**
 * CRM Task Service - JBJ Global Real Estate
 * Manages tasks for CRM users (Founder, Admin accounts)
 */

import { supabase } from "@/integrations/supabase/client";

export interface CRMTask {
  id?: string;
  title: string;
  description: string;
  category: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  dueDate?: string;
  assignedTo?: string;
  createdBy?: string;
  tags?: string[];
}

// ============================================
// PREDEFINED TASKS FOR FOUNDER
// ============================================

export const FOUNDER_TASKS: CRMTask[] = [
  // INTEGRATION TASKS
  {
    title: 'Phone Number Verification Integration',
    description: 'Implement phone number verification for user registration and login. Users should verify both email and phone number before accessing the platform.',
    category: 'Integration',
    priority: 'high',
    status: 'pending',
    tags: ['authentication', 'security', 'twilio'],
  },
  {
    title: 'Twilio or WhatsApp Business API Integration',
    description: 'Integrate Twilio or WhatsApp Business API for sending messages, receiving messages, and enabling AI personas to communicate with real users via WhatsApp.',
    category: 'Integration',
    priority: 'high',
    status: 'pending',
    tags: ['whatsapp', 'twilio', 'communication'],
  },
  {
    title: 'Virtual Phone Numbers Per Country for Personas',
    description: 'Set up virtual phone numbers for each AI persona based on their nationality. UK personas get +44 numbers, UAE personas get +971 numbers, etc.',
    category: 'Integration',
    priority: 'medium',
    status: 'pending',
    tags: ['personas', 'phone', 'virtual-numbers'],
  },
  {
    title: 'Edge Function for Message Routing to Persona Brains',
    description: 'Create edge function to route incoming messages (WhatsApp, SMS) to the appropriate AI persona brain for response generation.',
    category: 'Development',
    priority: 'high',
    status: 'pending',
    tags: ['edge-function', 'ai', 'routing'],
  },
  
  // PERSONA TRAINING TASKS
  {
    title: 'Complete AI Persona Training for All Employees',
    description: 'Ensure all AI personas are trained on: real estate knowledge, company policies, their specific role, reporting structure, and human-like behavior.',
    category: 'AI Training',
    priority: 'high',
    status: 'in_progress',
    tags: ['ai', 'training', 'personas'],
  },
  {
    title: 'Set Up Developer Briefing Coordination System',
    description: 'Enable Amanda Clarke (Founder\'s Assistant) to arrange developer briefings by contacting developer sales reps via WhatsApp.',
    category: 'Operations',
    priority: 'medium',
    status: 'pending',
    tags: ['developer', 'briefing', 'coordination'],
  },
  {
    title: 'Create Developer Sales Rep Directory',
    description: 'Generate Excel sheet with all developers and their sales representatives. Enable Amanda to contact them for briefings.',
    category: 'Operations',
    priority: 'medium',
    status: 'pending',
    tags: ['developer', 'directory', 'contacts'],
  },
  
  // REPORTING TASKS
  {
    title: 'Implement Daily Report Collection System',
    description: 'Set up automated daily report collection from all department heads to Amanda Clarke, then consolidated report to Founder.',
    category: 'Reporting',
    priority: 'high',
    status: 'pending',
    tags: ['reports', 'automation', 'daily'],
  },
  {
    title: 'Create Report Filtering Dashboard',
    description: 'Build dashboard to filter and download reports by: date range, month, year, department, employee name.',
    category: 'Development',
    priority: 'medium',
    status: 'pending',
    tags: ['dashboard', 'reports', 'filtering'],
  },
  
  // TEAM STRUCTURE TASKS
  {
    title: 'Configure Sales Team Group Structure',
    description: 'Divide sales agents into 3 groups under Adaeze Okonkwo, Emily Richardson, and Emma Hartley. Michael Anderson leads all.',
    category: 'Team',
    priority: 'high',
    status: 'in_progress',
    tags: ['sales', 'groups', 'structure'],
  },
  {
    title: 'Set Up Team Communication Groups',
    description: 'Create communication groups: each manager\'s team, all sales, sales leadership, company leadership. Founder in all groups.',
    category: 'Communication',
    priority: 'high',
    status: 'pending',
    tags: ['groups', 'communication', 'teams'],
  },
  
  // DOCUMENT TRACKING
  {
    title: 'Implement Global Form Tracking',
    description: 'Track all form submissions across the website with user details, timestamp, and form type.',
    category: 'Analytics',
    priority: 'medium',
    status: 'pending',
    tags: ['forms', 'tracking', 'analytics'],
  },
  {
    title: 'Implement Document Download/Upload Tracking',
    description: 'Track all document downloads and uploads with user details, file type, and timestamp.',
    category: 'Analytics',
    priority: 'medium',
    status: 'pending',
    tags: ['documents', 'tracking', 'analytics'],
  },
  
  // WELCOME EMAIL
  {
    title: 'Implement Welcome Email System',
    description: 'Send personalized welcome emails to new users upon registration with onboarding information.',
    category: 'Communication',
    priority: 'medium',
    status: 'pending',
    tags: ['email', 'welcome', 'onboarding'],
  },
  
  // SECURITY & COMPLIANCE
  {
    title: 'Implement Cover Story Training for All Personas',
    description: 'Train all AI personas on cover stories: remote work explanation, why not at briefings, how they know the market.',
    category: 'AI Training',
    priority: 'high',
    status: 'in_progress',
    tags: ['ai', 'cover-story', 'training'],
  },
];

// ============================================
// TASK SERVICE FUNCTIONS
// ============================================

export async function createFounderTasks(userId: string): Promise<void> {
  try {
    const tasksToInsert = FOUNDER_TASKS.map(task => ({
      user_id: userId,
      title: task.title,
      description: task.description,
      category: task.category,
      priority: task.priority,
      status: task.status,
      due_date: task.dueDate || null,
    }));

    const { error } = await supabase
      .from('admin_tasks')
      .insert(tasksToInsert);

    if (error) {
      console.error('Error creating founder tasks:', error);
      throw error;
    }

    console.log('Founder tasks created successfully');
  } catch (error) {
    console.error('Failed to create founder tasks:', error);
    throw error;
  }
}

export async function syncTasksToAdmin(founderUserId: string, adminUserId: string): Promise<void> {
  try {
    // Get founder's tasks
    const { data: founderTasks, error: fetchError } = await supabase
      .from('admin_tasks')
      .select('*')
      .eq('user_id', founderUserId);

    if (fetchError) throw fetchError;

    // Create matching tasks for admin
    if (founderTasks && founderTasks.length > 0) {
      const adminTasks = founderTasks.map(task => ({
        ...task,
        id: undefined, // Let DB generate new ID
        user_id: adminUserId,
      }));

      const { error: insertError } = await supabase
        .from('admin_tasks')
        .upsert(adminTasks, { onConflict: 'id' });

      if (insertError) throw insertError;
    }

    console.log('Tasks synced to admin account');
  } catch (error) {
    console.error('Failed to sync tasks to admin:', error);
    throw error;
  }
}

export async function getTasksByCategory(userId: string, category: string): Promise<CRMTask[]> {
  const { data, error } = await supabase
    .from('admin_tasks')
    .select('*')
    .eq('user_id', userId)
    .eq('category', category)
    .order('priority', { ascending: false });

  if (error) throw error;
  return (data as unknown as CRMTask[]) || [];
}

export async function updateTaskStatus(
  taskId: string, 
  status: CRMTask['status']
): Promise<void> {
  const { error } = await supabase
    .from('admin_tasks')
    .update({ 
      status, 
      completed_at: status === 'completed' ? new Date().toISOString() : null 
    })
    .eq('id', taskId);

  if (error) throw error;
}

export async function getTaskSummary(userId: string) {
  const { data, error } = await supabase
    .from('admin_tasks')
    .select('status, category')
    .eq('user_id', userId);

  if (error) throw error;

  const summary = {
    total: data?.length || 0,
    pending: data?.filter(t => t.status === 'pending').length || 0,
    inProgress: data?.filter(t => t.status === 'in_progress').length || 0,
    completed: data?.filter(t => t.status === 'completed').length || 0,
    blocked: data?.filter(t => t.status === 'blocked').length || 0,
    byCategory: {} as Record<string, number>,
  };

  data?.forEach(task => {
    summary.byCategory[task.category] = (summary.byCategory[task.category] || 0) + 1;
  });

  return summary;
}

export default {
  FOUNDER_TASKS,
  createFounderTasks,
  syncTasksToAdmin,
  getTasksByCategory,
  updateTaskStatus,
  getTaskSummary,
};
