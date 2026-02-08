/**
 * useSyncJobs - Hook for persistent sync job management
 * 
 * Sync jobs are persisted in the database, not UI state.
 * Jobs survive page refresh, tab close, and logout.
 */

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

export interface SyncJob {
  id: string;
  job_type: string; // 'reelly_quick' | 'reelly_full' | 'provident'
  status: 'pending' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';
  total_pages: number;
  current_page: number;
  started_at: string | null;
  paused_at: string | null;
  completed_at: string | null;
  created_by: string | null;
  stats_created: number;
  stats_updated: number;
  stats_skipped: number;
  stats_errors: number;
  stats_images: number;
  stats_extracted: number;
  created_at: string;
  updated_at: string;
  error_log: string[];
  next_cursor: string | null;
}

export interface SyncJobStats {
  requested: number;
  fetched: number;
  created: number;
  updated: number;
  skipped: number;
  failed: number;
  pending_retry: number;
}

export interface LiveCounts {
  reelly_total_api: number | null;
  reelly_pending_queue: number;
  reelly_approved: number;
  provident_pending_queue: number;
  provident_approved: number;
  last_updated: string;
}

export function useSyncJobs() {
  const [activeJob, setActiveJob] = useState<SyncJob | null>(null);
  const [recentJobs, setRecentJobs] = useState<SyncJob[]>([]);
  const [liveCounts, setLiveCounts] = useState<LiveCounts | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();

  // Fetch live counts from database
  const fetchLiveCounts = useCallback(async () => {
    try {
      // Get Reelly pending count
      const { count: reelyPending } = await supabase
        .from("pending_project_imports")
        .select("id", { count: "exact", head: true })
        .ilike("source_url", "%reelly%")
        .eq("status", "pending");

      // Get Reelly approved count
      const { count: reellyApproved } = await supabase
        .from("pending_project_imports")
        .select("id", { count: "exact", head: true })
        .ilike("source_url", "%reelly%")
        .eq("status", "approved");

      // Get Provident pending count
      const { count: providentPending } = await supabase
        .from("pending_project_imports")
        .select("id", { count: "exact", head: true })
        .not("source_url", "ilike", "%reelly%")
        .eq("status", "pending");

      // Get Provident approved count  
      const { count: providentApproved } = await supabase
        .from("pending_project_imports")
        .select("id", { count: "exact", head: true })
        .not("source_url", "ilike", "%reelly%")
        .eq("status", "approved");

      setLiveCounts({
        reelly_total_api: null, // Set when API test is run
        reelly_pending_queue: reelyPending || 0,
        reelly_approved: reellyApproved || 0,
        provident_pending_queue: providentPending || 0,
        provident_approved: providentApproved || 0,
        last_updated: new Date().toISOString(),
      });
    } catch (err) {
      console.error("Error fetching live counts:", err);
    }
  }, []);

  // Fetch active/recent jobs from database
  const fetchJobs = useCallback(async () => {
    try {
      // Get active job (running or paused)
      const { data: active } = await supabase
        .from("sync_jobs")
        .select("*")
        .in("status", ["running", "paused", "pending"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (active) {
        setActiveJob(active as unknown as SyncJob);
      } else {
        setActiveJob(null);
      }

      // Get recent completed jobs
      const { data: recent } = await supabase
        .from("sync_jobs")
        .select("*")
        .in("status", ["completed", "failed", "cancelled"])
        .order("completed_at", { ascending: false })
        .limit(10);

      setRecentJobs((recent || []) as unknown as SyncJob[]);
    } catch (err) {
      console.error("Error fetching sync jobs:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Create a new sync job
  const createJob = useCallback(async (
    jobType: 'reelly_quick' | 'reelly_full' | 'provident',
    totalExpected: number
  ): Promise<SyncJob | null> => {
    try {
      const { data: user } = await supabase.auth.getUser();
      
      // CRITICAL FIX: Set source column based on job type for proper job resumption
      const source = jobType.startsWith('reelly') ? 'reelly' : 'provident';
      
      const { data, error } = await supabase
        .from("sync_jobs")
        .insert({
          job_type: jobType,
          source: source, // FIX: This was missing, causing "No resumable job found" errors
          status: "running",
          total_pages: totalExpected,
          current_page: 0,
          started_at: new Date().toISOString(),
          created_by: user?.user?.id || null,
          stats_created: 0,
          stats_updated: 0,
          stats_skipped: 0,
          stats_images: 0,
          stats_extracted: 0,
        })
        .select()
        .single();

      if (error) throw error;
      
      const job = data as unknown as SyncJob;
      setActiveJob(job);
      return job;
    } catch (err) {
      console.error("Error creating sync job:", err);
      return null;
    }
  }, []);

  // Update job progress
  const updateJobProgress = useCallback(async (
    jobId: string,
    updates: Partial<Pick<SyncJob, 
      'current_page' | 'stats_created' | 'stats_updated' | 'stats_skipped' | 
      'stats_errors' | 'stats_images' | 'next_cursor'
    >>
  ) => {
    try {
      const { data, error } = await supabase
        .from("sync_jobs")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", jobId)
        .select()
        .single();

      if (error) throw error;
      setActiveJob(data as unknown as SyncJob);
    } catch (err) {
      console.error("Error updating job progress:", err);
    }
  }, []);

  // Complete a job
  const completeJob = useCallback(async (
    jobId: string,
    status: 'completed' | 'failed' | 'cancelled',
    finalStats?: Partial<SyncJob>
  ) => {
    try {
      const { data, error } = await supabase
        .from("sync_jobs")
        .update({
          status,
          completed_at: new Date().toISOString(),
          ...finalStats,
        })
        .eq("id", jobId)
        .select()
        .single();

      if (error) throw error;
      
      setActiveJob(null);
      fetchJobs(); // Refresh job list
      fetchLiveCounts(); // Refresh counts
      queryClient.invalidateQueries({ queryKey: ["pending-imports"] });
    } catch (err) {
      console.error("Error completing job:", err);
    }
  }, [fetchJobs, fetchLiveCounts, queryClient]);

  // Pause active job
  const pauseJob = useCallback(async (jobId: string) => {
    try {
      const { data, error } = await supabase
        .from("sync_jobs")
        .update({
          status: "paused",
          paused_at: new Date().toISOString(),
        })
        .eq("id", jobId)
        .select()
        .single();

      if (error) throw error;
      setActiveJob(data as unknown as SyncJob);
    } catch (err) {
      console.error("Error pausing job:", err);
    }
  }, []);

  // Resume paused job
  const resumeJob = useCallback(async (jobId: string) => {
    try {
      const { data, error } = await supabase
        .from("sync_jobs")
        .update({
          status: "running",
          paused_at: null,
        })
        .eq("id", jobId)
        .select()
        .single();

      if (error) throw error;
      setActiveJob(data as unknown as SyncJob);
      return data as unknown as SyncJob;
    } catch (err) {
      console.error("Error resuming job:", err);
      return null;
    }
  }, []);

  // Cancel active job
  const cancelJob = useCallback(async (jobId: string) => {
    await completeJob(jobId, 'cancelled');
  }, [completeJob]);

  // Clear completed jobs
  const clearCompletedJobs = useCallback(async () => {
    try {
      await supabase
        .from("sync_jobs")
        .delete()
        .in("status", ["completed", "failed", "cancelled"]);
      
      setRecentJobs([]);
    } catch (err) {
      console.error("Error clearing jobs:", err);
    }
  }, []);

  // Set API total (from test connection)
  const setApiTotal = useCallback((total: number) => {
    setLiveCounts(prev => prev ? {
      ...prev,
      reelly_total_api: total,
      last_updated: new Date().toISOString(),
    } : {
      reelly_total_api: total,
      reelly_pending_queue: 0,
      reelly_approved: 0,
      provident_pending_queue: 0,
      provident_approved: 0,
      last_updated: new Date().toISOString(),
    });
  }, []);

  // Initial load and polling
  useEffect(() => {
    fetchJobs();
    fetchLiveCounts();

    // Poll for updates every 5 seconds when job is active
    const interval = setInterval(() => {
      if (activeJob) {
        fetchJobs();
        fetchLiveCounts();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [fetchJobs, fetchLiveCounts, activeJob]);

  return {
    activeJob,
    recentJobs,
    liveCounts,
    isLoading,
    createJob,
    updateJobProgress,
    completeJob,
    pauseJob,
    resumeJob,
    cancelJob,
    clearCompletedJobs,
    setApiTotal,
    refreshCounts: fetchLiveCounts,
    refreshJobs: fetchJobs,
  };
}
