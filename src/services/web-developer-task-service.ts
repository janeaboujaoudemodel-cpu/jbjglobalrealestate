/**
 * WEB DEVELOPER TASK SERVICE
 * JBJ GLOBAL REAL ESTATE | BUY · SELL · RENT
 * 
 * Service for managing AI web developer tasks with owner-gated approval workflow.
 * Tasks require Owner/Founder approval before execution.
 */

import { supabase } from '@/integrations/supabase/client';

export type TaskStatus = 
  | 'pending_approval' 
  | 'approved' 
  | 'in_progress' 
  | 'completed' 
  | 'review_needed' 
  | 'rejected';

export type TaskAssigner = 'owner' | 'assistant';

export interface WebDeveloperTask {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  assigned_by: TaskAssigner;
  assigned_by_user_id: string | null;
  approved_by_user_id: string | null;
  created_at: string;
  approved_at: string | null;
  completed_at: string | null;
  updated_at: string;
  changes: string[];
  version_id: string | null;
  metadata: Record<string, unknown>;
}

export interface WebDeveloperVersion {
  id: string;
  version_id: string;
  description: string | null;
  created_at: string;
  created_by_user_id: string | null;
  snapshot: Record<string, unknown>;
  is_current: boolean;
}

// ============================================================
// TASK OPERATIONS
// ============================================================

/**
 * Create a new development task
 */
export async function createTask(params: {
  title: string;
  description?: string;
  assignedBy: TaskAssigner;
  assignedByUserId?: string;
  isOwner?: boolean;
}): Promise<{ success: boolean; task?: WebDeveloperTask; error?: string }> {
  try {
    // If owner creates task, it's automatically approved
    const status: TaskStatus = params.isOwner ? 'approved' : 'pending_approval';
    const approvedAt = params.isOwner ? new Date().toISOString() : null;
    const approvedByUserId = params.isOwner ? params.assignedByUserId : null;

    const { data, error } = await supabase
      .from('web_developer_tasks')
      .insert({
        title: params.title,
        description: params.description || null,
        status,
        assigned_by: params.assignedBy,
        assigned_by_user_id: params.assignedByUserId || null,
        approved_by_user_id: approvedByUserId,
        approved_at: approvedAt,
        changes: [],
        metadata: {},
      })
      .select()
      .single();

    if (error) throw error;

    return { 
      success: true, 
      task: {
        ...data,
        changes: data.changes as string[] || [],
        metadata: data.metadata as Record<string, unknown> || {},
      } as WebDeveloperTask 
    };
  } catch (error) {
    console.error('Error creating task:', error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Approve a pending task (Owner only)
 */
export async function approveTask(
  taskId: string, 
  approverUserId: string
): Promise<{ success: boolean; task?: WebDeveloperTask; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('web_developer_tasks')
      .update({
        status: 'approved' as TaskStatus,
        approved_by_user_id: approverUserId,
        approved_at: new Date().toISOString(),
      })
      .eq('id', taskId)
      .eq('status', 'pending_approval')
      .select()
      .single();

    if (error) throw error;

    return { 
      success: true, 
      task: {
        ...data,
        changes: data.changes as string[] || [],
        metadata: data.metadata as Record<string, unknown> || {},
      } as WebDeveloperTask 
    };
  } catch (error) {
    console.error('Error approving task:', error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Reject a pending task (Owner only)
 */
export async function rejectTask(
  taskId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('web_developer_tasks')
      .update({ status: 'rejected' as TaskStatus })
      .eq('id', taskId)
      .eq('status', 'pending_approval');

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Error rejecting task:', error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Start working on an approved task
 */
export async function startTask(
  taskId: string
): Promise<{ success: boolean; task?: WebDeveloperTask; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('web_developer_tasks')
      .update({ status: 'in_progress' as TaskStatus })
      .eq('id', taskId)
      .eq('status', 'approved')
      .select()
      .single();

    if (error) throw error;

    return { 
      success: true, 
      task: {
        ...data,
        changes: data.changes as string[] || [],
        metadata: data.metadata as Record<string, unknown> || {},
      } as WebDeveloperTask 
    };
  } catch (error) {
    console.error('Error starting task:', error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Mark task as needing review
 */
export async function requestReview(
  taskId: string,
  changes: string[]
): Promise<{ success: boolean; task?: WebDeveloperTask; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('web_developer_tasks')
      .update({ 
        status: 'review_needed' as TaskStatus,
        changes,
      })
      .eq('id', taskId)
      .eq('status', 'in_progress')
      .select()
      .single();

    if (error) throw error;

    return { 
      success: true, 
      task: {
        ...data,
        changes: data.changes as string[] || [],
        metadata: data.metadata as Record<string, unknown> || {},
      } as WebDeveloperTask 
    };
  } catch (error) {
    console.error('Error requesting review:', error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Complete a task after review approval
 */
export async function completeTask(
  taskId: string,
  versionId?: string
): Promise<{ success: boolean; task?: WebDeveloperTask; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('web_developer_tasks')
      .update({ 
        status: 'completed' as TaskStatus,
        completed_at: new Date().toISOString(),
        version_id: versionId || null,
      })
      .eq('id', taskId)
      .select()
      .single();

    if (error) throw error;

    return { 
      success: true, 
      task: {
        ...data,
        changes: data.changes as string[] || [],
        metadata: data.metadata as Record<string, unknown> || {},
      } as WebDeveloperTask 
    };
  } catch (error) {
    console.error('Error completing task:', error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Get all tasks
 */
export async function getTasks(): Promise<{ 
  success: boolean; 
  tasks: WebDeveloperTask[]; 
  error?: string 
}> {
  try {
    const { data, error } = await supabase
      .from('web_developer_tasks')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return { 
      success: true, 
      tasks: (data || []).map(task => ({
        ...task,
        changes: task.changes as string[] || [],
        metadata: task.metadata as Record<string, unknown> || {},
      })) as WebDeveloperTask[]
    };
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return { success: false, tasks: [], error: (error as Error).message };
  }
}

/**
 * Get tasks by status
 */
export async function getTasksByStatus(
  status: TaskStatus
): Promise<{ success: boolean; tasks: WebDeveloperTask[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('web_developer_tasks')
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return { 
      success: true, 
      tasks: (data || []).map(task => ({
        ...task,
        changes: task.changes as string[] || [],
        metadata: task.metadata as Record<string, unknown> || {},
      })) as WebDeveloperTask[]
    };
  } catch (error) {
    console.error('Error fetching tasks by status:', error);
    return { success: false, tasks: [], error: (error as Error).message };
  }
}

// ============================================================
// VERSION OPERATIONS
// ============================================================

/**
 * Create a new version snapshot
 */
export async function createVersion(params: {
  versionId: string;
  description?: string;
  createdByUserId?: string;
  snapshot?: Record<string, unknown>;
}): Promise<{ success: boolean; version?: WebDeveloperVersion; error?: string }> {
  try {
    // Set current version to false for all existing versions
    await supabase
      .from('web_developer_versions')
      .update({ is_current: false })
      .eq('is_current', true);

    const { data, error } = await supabase
      .from('web_developer_versions')
      .insert([{
        version_id: params.versionId,
        description: params.description || null,
        created_by_user_id: params.createdByUserId || null,
        snapshot: (params.snapshot || {}) as Record<string, string | number | boolean | null>,
        is_current: true,
      }])
      .select()
      .single();

    if (error) throw error;

    return { 
      success: true, 
      version: {
        ...data,
        snapshot: data.snapshot as Record<string, unknown> || {},
      } as WebDeveloperVersion 
    };
  } catch (error) {
    console.error('Error creating version:', error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Get all versions
 */
export async function getVersions(): Promise<{ 
  success: boolean; 
  versions: WebDeveloperVersion[]; 
  error?: string 
}> {
  try {
    const { data, error } = await supabase
      .from('web_developer_versions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return { 
      success: true, 
      versions: (data || []).map(v => ({
        ...v,
        snapshot: v.snapshot as Record<string, unknown> || {},
      })) as WebDeveloperVersion[]
    };
  } catch (error) {
    console.error('Error fetching versions:', error);
    return { success: false, versions: [], error: (error as Error).message };
  }
}

/**
 * Restore to a specific version
 */
export async function restoreVersion(
  versionId: string
): Promise<{ success: boolean; version?: WebDeveloperVersion; error?: string }> {
  try {
    // Set all versions to not current
    await supabase
      .from('web_developer_versions')
      .update({ is_current: false })
      .eq('is_current', true);

    // Set target version as current
    const { data, error } = await supabase
      .from('web_developer_versions')
      .update({ is_current: true })
      .eq('version_id', versionId)
      .select()
      .single();

    if (error) throw error;

    return { 
      success: true, 
      version: {
        ...data,
        snapshot: data.snapshot as Record<string, unknown> || {},
      } as WebDeveloperVersion 
    };
  } catch (error) {
    console.error('Error restoring version:', error);
    return { success: false, error: (error as Error).message };
  }
}

// ============================================================
// GOVERNANCE HELPERS
// ============================================================

/**
 * Check if user can approve tasks
 */
export function canApprove(role: 'owner' | 'assistant' | 'viewer'): boolean {
  return role === 'owner';
}

/**
 * Check if user can assign tasks
 */
export function canAssign(role: 'owner' | 'assistant' | 'viewer'): boolean {
  return role === 'owner' || role === 'assistant';
}

/**
 * Check if user can restore versions
 */
export function canRestore(role: 'owner' | 'assistant' | 'viewer'): boolean {
  return role === 'owner';
}