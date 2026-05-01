import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type IngestionStatus =
  | "pending"
  | "processing"
  | "auto_matched"
  | "needs_review"
  | "unmatched"
  | "merged"
  | "skipped"
  | "error";

export interface IngestionJob {
  id: string;
  user_id: string | null;
  source_url: string | null;
  source_kind: string | null;
  source_type: string | null;
  status: IngestionStatus | string;
  file_path: string | null;
  file_name: string | null;
  file_size: number | null;
  mime_type: string | null;
  duration_seconds: number | null;
  page_count: number | null;
  detected_doc_type: string | null;
  detected_developer_id: string | null;
  detected_developer_name: string | null;
  developer_confidence: number | null;
  matched_project_id: string | null;
  matched_project_name: string | null;
  match_confidence: number | null;
  ai_summary: string | null;
  merge_target: any;
  merged_at: string | null;
  merged_by: string | null;
  created_at: string;
}

export function useMediaIngestion() {
  const [jobs, setJobs] = useState<IngestionJob[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("material_ingestion_jobs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) {
      toast.error("Failed to load ingestion queue");
    } else {
      setJobs((data as any[]) ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchJobs();
    const channel = supabase
      .channel("media-ingestion-jobs")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "material_ingestion_jobs" },
        () => fetchJobs(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchJobs]);

  const uploadFiles = useCallback(
    async (files: File[]) => {
      const { data: userResp } = await supabase.auth.getUser();
      const userId = userResp?.user?.id;
      if (!userId) {
        toast.error("You must be signed in");
        return;
      }
      setBusy(true);
      const created: string[] = [];
      for (const file of files) {
        const ts = Date.now();
        const safe = file.name.replace(/[^A-Za-z0-9._-]/g, "_");
        const path = `${userId}/${ts}-${safe}`;
        const { error: upErr } = await supabase.storage
          .from("ingestion-staging")
          .upload(path, file, { upsert: false });
        if (upErr) {
          toast.error(`Upload failed: ${file.name}`);
          continue;
        }
        const insertRow: any = {
          user_id: userId,
          file_path: path,
          file_name: file.name,
          file_size: file.size,
          mime_type: file.type || null,
          source_kind: "upload",
          source_type: file.type?.startsWith("video/")
            ? "video"
            : file.type?.includes("pdf")
              ? "pdf"
              : "file",
          status: "pending",
        };
        const { data, error } = await supabase
          .from("material_ingestion_jobs")
          .insert(insertRow)
          .select("id")
          .single();
        if (!error && data?.id) created.push(data.id);
      }
      setBusy(false);
      if (created.length) {
        toast.success(`Uploaded ${created.length} file(s). AI is matching…`);
        await classify(created);
        await fetchJobs();
      }
    },
    [fetchJobs],
  );

  const addLinks = useCallback(
    async (urls: string[]) => {
      const { data: userResp } = await supabase.auth.getUser();
      const userId = userResp?.user?.id;
      if (!userId) return;
      const created: string[] = [];
      for (const url of urls) {
        const linkRow: any = {
          user_id: userId,
          source_url: url,
          source_kind: "link",
          source_type: "link",
          status: "pending",
        };
        const { data, error } = await supabase
          .from("material_ingestion_jobs")
          .insert(linkRow)
          .select("id")
          .single();
        if (!error && data?.id) created.push(data.id);
      }
      if (created.length) {
        toast.success(`Queued ${created.length} link(s)`);
        await classify(created);
        await fetchJobs();
      }
    },
    [fetchJobs],
  );

  const classify = useCallback(async (jobIds: string[]) => {
    if (!jobIds.length) return;
    const { error } = await supabase.functions.invoke("media-ingestion-classify", {
      body: { job_ids: jobIds },
    });
    if (error) toast.error("AI matching failed");
  }, []);

  const approveAndMerge = useCallback(
    async (jobIds: string[]) => {
      if (!jobIds.length) return;
      setBusy(true);
      const { error } = await supabase.functions.invoke("media-ingestion-merge", {
        body: { job_ids: jobIds },
      });
      setBusy(false);
      if (error) toast.error("Merge failed");
      else toast.success(`Merged ${jobIds.length} item(s) into listings`);
      await fetchJobs();
    },
    [fetchJobs],
  );

  const rollback = useCallback(
    async (jobIds: string[]) => {
      if (!jobIds.length) return;
      setBusy(true);
      const { error } = await supabase.functions.invoke("media-ingestion-rollback", {
        body: { job_ids: jobIds },
      });
      setBusy(false);
      if (error) toast.error("Rollback failed");
      else toast.success(`Rolled back ${jobIds.length} merge(s)`);
      await fetchJobs();
    },
    [fetchJobs],
  );

  const skip = useCallback(
    async (jobIds: string[]) => {
      const { error } = await supabase
        .from("material_ingestion_jobs")
        .update({ status: "skipped" })
        .in("id", jobIds);
      if (error) toast.error("Skip failed");
      else toast.success(`Skipped ${jobIds.length} item(s)`);
      await fetchJobs();
    },
    [fetchJobs],
  );

  const remove = useCallback(
    async (jobIds: string[]) => {
      // Remove storage files first
      const { data: rows } = await supabase
        .from("material_ingestion_jobs")
        .select("id, file_path")
        .in("id", jobIds);
      const paths = (rows ?? []).map((r) => r.file_path).filter(Boolean) as string[];
      if (paths.length) {
        await supabase.storage.from("ingestion-staging").remove(paths);
      }
      const { error } = await supabase
        .from("material_ingestion_jobs")
        .delete()
        .in("id", jobIds);
      if (error) toast.error("Delete failed");
      else toast.success(`Deleted ${jobIds.length} item(s)`);
      await fetchJobs();
    },
    [fetchJobs],
  );

  const duplicate = useCallback(
    async (jobIds: string[]) => {
      const { data: rows } = await supabase
        .from("material_ingestion_jobs")
        .select("*")
        .in("id", jobIds);
      if (!rows?.length) return;
      const inserts = rows.map((r) => {
        const { id, created_at, completed_at, merged_at, merged_by, ...rest } = r as any;
        return { ...rest, status: "needs_review" };
      });
      const { error } = await supabase.from("material_ingestion_jobs").insert(inserts);
      if (error) toast.error("Duplicate failed");
      else toast.success(`Duplicated ${jobIds.length} item(s)`);
      await fetchJobs();
    },
    [fetchJobs],
  );

  const reassign = useCallback(
    async (
      jobIds: string[],
      patch: {
        matched_project_id?: string | null;
        matched_project_name?: string | null;
        detected_developer_id?: string | null;
        detected_developer_name?: string | null;
        detected_doc_type?: string | null;
      },
    ) => {
      const update: any = { ...patch };
      if (patch.matched_project_id) {
        update.match_confidence = 1;
        update.status = "needs_review";
      }
      const { error } = await supabase
        .from("material_ingestion_jobs")
        .update(update)
        .in("id", jobIds);
      if (error) toast.error("Reassign failed");
      else toast.success(`Updated ${jobIds.length} item(s)`);
      await fetchJobs();
    },
    [fetchJobs],
  );

  return {
    jobs,
    loading,
    busy,
    fetchJobs,
    uploadFiles,
    addLinks,
    classify,
    approveAndMerge,
    rollback,
    skip,
    remove,
    duplicate,
    reassign,
  };
}
