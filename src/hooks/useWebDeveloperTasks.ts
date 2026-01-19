/**
 * USE WEB DEVELOPER TASKS HOOK
 * Hook for managing AI web developer tasks with approval workflow
 */

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import {
  type WebDeveloperTask,
  type WebDeveloperVersion,
  type TaskStatus,
  type TaskAssigner,
  getTasks,
  getTasksByStatus,
  createTask,
  approveTask,
  rejectTask,
  startTask,
  requestReview,
  completeTask,
  getVersions,
  createVersion,
  restoreVersion,
  canApprove,
  canAssign,
  canRestore,
} from '@/services/web-developer-task-service';

interface UseWebDeveloperTasksReturn {
  // State
  tasks: WebDeveloperTask[];
  versions: WebDeveloperVersion[];
  isLoading: boolean;
  error: string | null;
  
  // Task actions
  loadTasks: () => Promise<void>;
  loadTasksByStatus: (status: TaskStatus) => Promise<void>;
  addTask: (title: string, description?: string) => Promise<boolean>;
  approve: (taskId: string) => Promise<boolean>;
  reject: (taskId: string) => Promise<boolean>;
  start: (taskId: string) => Promise<boolean>;
  submitForReview: (taskId: string, changes: string[]) => Promise<boolean>;
  complete: (taskId: string, versionId?: string) => Promise<boolean>;
  
  // Version actions
  loadVersions: () => Promise<void>;
  saveVersion: (description: string) => Promise<boolean>;
  restore: (versionId: string) => Promise<boolean>;
  
  // Permission helpers
  canUserApprove: boolean;
  canUserAssign: boolean;
  canUserRestore: boolean;
}

export function useWebDeveloperTasks(
  userId?: string,
  userRole: 'owner' | 'assistant' | 'viewer' = 'viewer'
): UseWebDeveloperTasksReturn {
  const [tasks, setTasks] = useState<WebDeveloperTask[]>([]);
  const [versions, setVersions] = useState<WebDeveloperVersion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Permission checks
  const canUserApprove = canApprove(userRole);
  const canUserAssign = canAssign(userRole);
  const canUserRestore = canRestore(userRole);

  // Load tasks
  const loadTasks = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    const result = await getTasks();
    
    if (result.success) {
      setTasks(result.tasks);
    } else {
      setError(result.error || 'Failed to load tasks');
    }
    
    setIsLoading(false);
  }, []);

  // Load tasks by status
  const loadTasksByStatus = useCallback(async (status: TaskStatus) => {
    setIsLoading(true);
    setError(null);
    
    const result = await getTasksByStatus(status);
    
    if (result.success) {
      setTasks(result.tasks);
    } else {
      setError(result.error || 'Failed to load tasks');
    }
    
    setIsLoading(false);
  }, []);

  // Add task
  const addTask = useCallback(async (title: string, description?: string): Promise<boolean> => {
    if (!canUserAssign) {
      toast.error('You do not have permission to assign tasks');
      return false;
    }

    const assignedBy: TaskAssigner = userRole === 'owner' ? 'owner' : 'assistant';
    
    const result = await createTask({
      title,
      description,
      assignedBy,
      assignedByUserId: userId,
      isOwner: userRole === 'owner',
    });

    if (result.success) {
      if (userRole === 'owner') {
        toast.success('Task created and approved');
      } else {
        toast.info('Task submitted for Owner approval');
      }
      await loadTasks();
      return true;
    } else {
      toast.error(result.error || 'Failed to create task');
      return false;
    }
  }, [canUserAssign, userRole, userId, loadTasks]);

  // Approve task
  const approve = useCallback(async (taskId: string): Promise<boolean> => {
    if (!canUserApprove || !userId) {
      toast.error('Only Owner can approve tasks');
      return false;
    }

    const result = await approveTask(taskId, userId);

    if (result.success) {
      toast.success('Task approved! Development will begin.');
      await loadTasks();
      return true;
    } else {
      toast.error(result.error || 'Failed to approve task');
      return false;
    }
  }, [canUserApprove, userId, loadTasks]);

  // Reject task
  const reject = useCallback(async (taskId: string): Promise<boolean> => {
    if (!canUserApprove) {
      toast.error('Only Owner can reject tasks');
      return false;
    }

    const result = await rejectTask(taskId);

    if (result.success) {
      toast.info('Task rejected');
      await loadTasks();
      return true;
    } else {
      toast.error(result.error || 'Failed to reject task');
      return false;
    }
  }, [canUserApprove, loadTasks]);

  // Start task
  const start = useCallback(async (taskId: string): Promise<boolean> => {
    const result = await startTask(taskId);

    if (result.success) {
      toast.success('Task started');
      await loadTasks();
      return true;
    } else {
      toast.error(result.error || 'Failed to start task');
      return false;
    }
  }, [loadTasks]);

  // Submit for review
  const submitForReview = useCallback(async (taskId: string, changes: string[]): Promise<boolean> => {
    const result = await requestReview(taskId, changes);

    if (result.success) {
      toast.info('Changes submitted for review');
      await loadTasks();
      return true;
    } else {
      toast.error(result.error || 'Failed to submit for review');
      return false;
    }
  }, [loadTasks]);

  // Complete task
  const complete = useCallback(async (taskId: string, versionId?: string): Promise<boolean> => {
    if (!canUserApprove) {
      toast.error('Only Owner can approve changes');
      return false;
    }

    const result = await completeTask(taskId, versionId);

    if (result.success) {
      toast.success('Changes approved and deployed!');
      await loadTasks();
      return true;
    } else {
      toast.error(result.error || 'Failed to complete task');
      return false;
    }
  }, [canUserApprove, loadTasks]);

  // Load versions
  const loadVersions = useCallback(async () => {
    const result = await getVersions();
    
    if (result.success) {
      setVersions(result.versions);
    }
  }, []);

  // Save version
  const saveVersion = useCallback(async (description: string): Promise<boolean> => {
    const versionId = `v${Date.now().toString(36)}`;
    
    const result = await createVersion({
      versionId,
      description,
      createdByUserId: userId,
    });

    if (result.success) {
      toast.success(`Version ${versionId} saved`);
      await loadVersions();
      return true;
    } else {
      toast.error(result.error || 'Failed to save version');
      return false;
    }
  }, [userId, loadVersions]);

  // Restore version
  const restore = useCallback(async (versionId: string): Promise<boolean> => {
    if (!canUserRestore) {
      toast.error('Only Owner can restore versions');
      return false;
    }

    const result = await restoreVersion(versionId);

    if (result.success) {
      toast.success(`Restored to ${versionId}`);
      await loadVersions();
      return true;
    } else {
      toast.error(result.error || 'Failed to restore version');
      return false;
    }
  }, [canUserRestore, loadVersions]);

  // Load initial data
  useEffect(() => {
    loadTasks();
    loadVersions();
  }, [loadTasks, loadVersions]);

  return {
    tasks,
    versions,
    isLoading,
    error,
    loadTasks,
    loadTasksByStatus,
    addTask,
    approve,
    reject,
    start,
    submitForReview,
    complete,
    loadVersions,
    saveVersion,
    restore,
    canUserApprove,
    canUserAssign,
    canUserRestore,
  };
}