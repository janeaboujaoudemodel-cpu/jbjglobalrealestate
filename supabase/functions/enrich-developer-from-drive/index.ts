// Google Drive developer enrichment — public-folder scanner.
// Owner/admin or service-role internal calls only.
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const DRIVE_KEY = Deno.env.get("GOOGLE_DRIVE_API_KEY") || "";
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY") || "";

type DriveFile = {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  webViewLink?: string;
  webContentLink?: string;
  modifiedTime?: string;
  parents?: string[];
};

type ExtractedProject = {
  name: string;
  area_name?: string;
  description?: string;
  source_file_ids?: string[];
};

const norm = (s: string) => String(s ?? "").trim().toLowerCase().replace(/[_\-]+/g, " ").replace(/\s+/g, " ");
const slugify = (s: string) => norm(s).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 90);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) return json({ error: "unauthorized" }, 401);

    const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    if (token !== SERVICE_KEY) {
      const userClient = createClient(SUPABASE_URL, ANON_KEY, {
        global: { headers: { Authorization: authHeader } },
        auth: { persistSession: false },
      });
      const { data: { user } } = await userClient.auth.getUser();
      if (!user) return json({ error: "unauthorized" }, 401);
      const { data: roles } = await admin
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .in("role", ["owner", "admin"]);
      if (!roles?.length) return json({ error: "forbidden" }, 403);
    }

    const body = await req.json().catch(() => ({}));
    const developerId = String(body?.developer_id ?? "").trim();
    const jobId = String(body?.job_id ?? "").trim();
    if (!developerId && !jobId) return json({ error: "developer_id or job_id required" }, 400);

    const { dev, job } = await loadDeveloperAndJob(admin, developerId, jobId);
    if (!dev) return json({ error: "developer not found" }, 404);
    if (!dev.google_drive_url) return json({ error: "no google_drive_url on this developer" }, 400);

    const folderId = extractFolderId(dev.google_drive_url);
    if (!folderId) return json({ error: "could not parse Drive folder id from URL" }, 400);

    const activeJob = job ?? await createJob(admin, dev.id, dev.google_drive_url);
    await markRunning(admin, dev.id, activeJob.id);

    if (!DRIVE_KEY) {
      await markFailed(admin, dev.id, activeJob.id, "GOOGLE_DRIVE_API_KEY is not configured");
      return json({ ok: false, job_id: activeJob.id, needs_credential: true, error: "GOOGLE_DRIVE_API_KEY is not configured" }, 500);
    }

    const files = await listDriveTree(folderId, 0, new Set<string>());
    const usefulFiles = files.filter((f) => !f.mimeType.includes("folder"));
    const documentsCreated = await upsertDeveloperDocuments(admin, dev.id, usefulFiles);
    const projects = await extractProjects(dev.name, usefulFiles);
    const projectsCreated = await upsertProjectsAndDocuments(admin, dev, projects, usefulFiles);

    await admin
      .from("developer_drive_jobs")
      .update({
        status: "done",
        discovered_projects: projectsCreated,
        discovered_documents: documentsCreated,
        error: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", activeJob.id);
    await admin
      .from("developers")
      .update({
        drive_enrichment_status: "done",
        drive_last_synced_at: new Date().toISOString(),
      })
      .eq("id", dev.id);

    return json({ ok: true, job_id: activeJob.id, files_scanned: usefulFiles.length, documents_created: documentsCreated, projects_created: projectsCreated });
  } catch (e) {
    console.error("enrich-developer-from-drive", e);
    return json({ error: (e as Error).message }, 500);
  }
});

async function loadDeveloperAndJob(admin: any, developerId: string, jobId: string) {
  if (jobId) {
    const { data: job } = await admin.from("developer_drive_jobs").select("*").eq("id", jobId).maybeSingle();
    if (!job) return { dev: null, job: null };
    const { data: dev } = await admin.from("developers").select("id,name,slug,google_drive_url").eq("id", job.developer_id).maybeSingle();
    return { dev, job };
  }
  const { data: dev } = await admin.from("developers").select("id,name,slug,google_drive_url").eq("id", developerId).maybeSingle();
  return { dev, job: null };
}

async function createJob(admin: any, developerId: string, folderUrl: string) {
  const { data, error } = await admin
    .from("developer_drive_jobs")
    .insert({ developer_id: developerId, folder_url: folderUrl, status: "queued" })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return data;
}

async function markRunning(admin: any, developerId: string, jobId: string) {
  await admin.from("developer_drive_jobs").update({ status: "running", error: null, updated_at: new Date().toISOString() }).eq("id", jobId);
  await admin.from("developers").update({ drive_enrichment_status: "running" }).eq("id", developerId);
}

async function markFailed(admin: any, developerId: string, jobId: string, error: string) {
  await admin.from("developer_drive_jobs").update({ status: "failed", error, updated_at: new Date().toISOString() }).eq("id", jobId);
  await admin.from("developers").update({ drive_enrichment_status: "failed" }).eq("id", developerId);
}

function extractFolderId(url: string): string | null {
  const m = url.match(/\/folders\/([A-Za-z0-9_-]+)/) || url.match(/[?&]id=([A-Za-z0-9_-]+)/) || url.match(/\/file\/d\/([A-Za-z0-9_-]+)/);
  return m?.[1] ?? null;
}

async function listDriveTree(folderId: string, depth: number, seen: Set<string>): Promise<DriveFile[]> {
  if (depth > 3 || seen.has(folderId)) return [];
  seen.add(folderId);
  const direct = await listDriveFolder(folderId);
  const nested: DriveFile[] = [];
  for (const f of direct.filter((x) => x.mimeType === "application/vnd.google-apps.folder").slice(0, 40)) {
    nested.push(...await listDriveTree(f.id, depth + 1, seen));
  }
  return [...direct, ...nested].slice(0, 500);
}

async function listDriveFolder(folderId: string): Promise<DriveFile[]> {
  const out: DriveFile[] = [];
  let pageToken = "";
  do {
    const params = new URLSearchParams({
      key: DRIVE_KEY,
      q: `'${folderId}' in parents and trashed=false`,
      fields: "nextPageToken,files(id,name,mimeType,size,webViewLink,webContentLink,modifiedTime,parents)",
      pageSize: "1000",
      supportsAllDrives: "true",
      includeItemsFromAllDrives: "true",
    });
    if (pageToken) params.set("pageToken", pageToken);
    const res = await fetch(`https://www.googleapis.com/drive/v3/files?${params.toString()}`);
    if (!res.ok) throw new Error(`Drive list failed [${res.status}]: ${await res.text()}`);
    const data = await res.json();
    out.push(...(data.files ?? []));
    pageToken = data.nextPageToken ?? "";
  } while (pageToken && out.length < 500);
  return out;
}

async function upsertDeveloperDocuments(admin: any, developerId: string, files: DriveFile[]) {
  const urls = files.map(publicUrl).filter(Boolean);
  const { data: existing } = await admin.from("developer_documents").select("file_url").eq("developer_id", developerId).in("file_url", urls);
  const existingUrls = new Set((existing ?? []).map((r: any) => r.file_url));
  const rows = files
    .filter((f) => publicUrl(f) && !existingUrls.has(publicUrl(f)))
    .map((f) => ({
      developer_id: developerId,
      doc_type: classifyDoc(f),
      file_url: publicUrl(f),
      file_name: f.name,
      file_size: f.size ? Number(f.size) || null : null,
      is_public: true,
      extracted_at: new Date().toISOString(),
    }));
  if (!rows.length) return 0;
  const { error } = await admin.from("developer_documents").insert(rows);
  if (error) throw new Error(error.message);
  return rows.length;
}

async function extractProjects(developerName: string, files: DriveFile[]): Promise<ExtractedProject[]> {
  const brochureFiles = files.filter((f) => /brochure|factsheet|fact sheet|presentation|profile|masterplan|floor|payment|launch|project/i.test(f.name)).slice(0, 120);
  if (LOVABLE_API_KEY && brochureFiles.length) {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "Extract real estate project names from Google Drive file metadata. Return only strict JSON: {\"projects\":[{\"name\":string,\"area_name\":string|null,\"description\":string|null,\"source_file_ids\":string[]}]} . Do not invent projects." },
          { role: "user", content: JSON.stringify({ developerName, files: brochureFiles.map((f) => ({ id: f.id, name: f.name, mimeType: f.mimeType })) }) },
        ],
        temperature: 0.1,
      }),
    });
    if (response.ok) {
      const data = await response.json();
      const content = data?.choices?.[0]?.message?.content ?? "";
      const parsed = safeJson(content);
      if (Array.isArray(parsed?.projects)) return cleanProjects(parsed.projects);
    }
  }
  return heuristicProjects(brochureFiles, developerName);
}

function heuristicProjects(files: DriveFile[], developerName: string): ExtractedProject[] {
  const devTokens = norm(developerName).split(" ").filter((x) => x.length > 2);
  const out = new Map<string, ExtractedProject>();
  for (const f of files) {
    const base = f.name.replace(/\.[a-z0-9]{2,5}$/i, "").replace(/\b(brochure|factsheet|fact sheet|presentation|floor plans?|payment plan|masterplan|profile|company|launch|final|copy|pdf)\b/gi, " ").replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
    if (!base || base.length < 3) continue;
    const cleaned = base.split(" ").filter((t) => !devTokens.includes(norm(t))).join(" ").trim() || base;
    if (cleaned.length < 3 || /company profile/i.test(f.name)) continue;
    const key = slugify(cleaned);
    if (!out.has(key)) out.set(key, { name: titleCase(cleaned), source_file_ids: [f.id], description: `Drive-sourced project material from ${f.name}.` });
    else out.get(key)!.source_file_ids!.push(f.id);
  }
  return Array.from(out.values()).slice(0, 80);
}

async function upsertProjectsAndDocuments(admin: any, dev: any, projects: ExtractedProject[], files: DriveFile[]) {
  let created = 0;
  const filesById = new Map(files.map((f) => [f.id, f]));
  for (const p of projects) {
    if (!p.name || p.name.length < 2) continue;
    const { data: existing } = await admin
      .from("projects")
      .select("id")
      .eq("developer_id", dev.id)
      .ilike("name", p.name)
      .limit(1)
      .maybeSingle();
    const projectSlug = slugify(`${p.name}-${dev.slug || dev.name}`);
    const projectId = existing?.id ?? (await insertProject(admin, dev, p, projectSlug));
    if (!existing?.id) created++;
    const sourceFiles = (p.source_file_ids ?? []).map((id) => filesById.get(id)).filter(Boolean) as DriveFile[];
    await attachProjectDocuments(admin, projectId, sourceFiles.length ? sourceFiles : files.filter((f) => norm(f.name).includes(norm(p.name).split(" ")[0])).slice(0, 3));
  }
  return created;
}

async function insertProject(admin: any, dev: any, p: ExtractedProject, slug: string) {
  const { data, error } = await admin
    .from("projects")
    .insert({
      name: p.name,
      slug,
      developer_id: dev.id,
      developer_name: dev.name,
      area_name: p.area_name || null,
      location: p.area_name || null,
      description: p.description || `Imported from ${dev.name} Google Drive materials.`,
      source_url: dev.google_drive_url,
      import_source: "google_drive",
      created_source: "developer_drive_ai",
      is_published: false,
      is_offplan: true,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return data.id;
}

async function attachProjectDocuments(admin: any, projectId: string, files: DriveFile[]) {
  for (const f of files) {
    const url = publicUrl(f);
    if (!url) continue;
    const { data: existing } = await admin.from("project_documents").select("id").eq("project_id", projectId).eq("file_url", url).limit(1).maybeSingle();
    if (existing?.id) continue;
    await admin.from("project_documents").insert({
      project_id: projectId,
      document_type: classifyDoc(f),
      file_url: url,
      file_name: f.name,
      file_size: f.size ? Number(f.size) || null : null,
      is_visible: true,
      allow_download: true,
      display_title: f.name,
      data_source: "google_drive",
    });
  }
}

function cleanProjects(input: any[]): ExtractedProject[] {
  const out = new Map<string, ExtractedProject>();
  for (const raw of input) {
    const name = String(raw?.name ?? "").trim();
    if (!name || name.length < 2) continue;
    out.set(slugify(name), {
      name: titleCase(name),
      area_name: raw?.area_name ? String(raw.area_name).trim() : undefined,
      description: raw?.description ? String(raw.description).trim() : undefined,
      source_file_ids: Array.isArray(raw?.source_file_ids) ? raw.source_file_ids.map(String) : [],
    });
  }
  return Array.from(out.values());
}

function safeJson(text: string) {
  try { return JSON.parse(text); } catch (_) {}
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try { return JSON.parse(match[0]); } catch (_) { return null; }
}

function classifyDoc(f: DriveFile) {
  const n = norm(f.name);
  if (n.includes("brochure")) return "brochure";
  if (n.includes("floor")) return "floor_plan";
  if (n.includes("payment")) return "payment_plan";
  if (n.includes("profile") || n.includes("company")) return "company_profile";
  return "marketing_material";
}

function publicUrl(f: DriveFile) {
  return f.webViewLink || (f.id ? `https://drive.google.com/file/d/${f.id}/view` : "");
}

function titleCase(value: string) {
  return value.toLowerCase().replace(/\b\w/g, (m) => m.toUpperCase()).replace(/\b(Ae|Uae|Jbr|Damac|Emaar)\b/g, (m) => m.toUpperCase());
}

function json(o: unknown, status = 200) {
  return new Response(JSON.stringify(o), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}