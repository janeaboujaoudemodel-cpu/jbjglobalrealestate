/**
 * Owner Books Library — attach/upload books, AI auto-generates chapter
 * structure, owner can edit/restyle/delete. Brokers see published rows.
 */
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Upload, Loader2, Eye, Trash2, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

type Book = {
  id: string;
  book_number: number;
  title: string;
  description: string | null;
  is_published: boolean;
  ai_generated_chapter_count: number | null;
  source_file_name: string | null;
  deleted_at: string | null;
  created_at: string;
};

// Schema uses `is_restricted` (true = draft/locked). We expose this in the UI
// as `is_published` (the inverse) for clarity.
type BookRow = {
  id: string;
  book_number: number;
  title: string;
  description: string | null;
  is_restricted: boolean | null;
  ai_generated_chapter_count: number | null;
  source_file_name: string | null;
  deleted_at: string | null;
  created_at: string | null;
};


async function fileToText(file: File): Promise<string> {
  const name = file.name.toLowerCase();
  if (name.endsWith(".txt") || name.endsWith(".md")) {
    return await file.text();
  }
  if (name.endsWith(".pdf")) {
    // CDN imports kept as runtime-only strings so TS does not try to resolve them.
    const pdfUrl = "https://esm.sh/pdfjs-dist@4.0.379/build/pdf.mjs";
    const pdfjs: any = await import(/* @vite-ignore */ pdfUrl);
    pdfjs.GlobalWorkerOptions.workerSrc =
      "https://esm.sh/pdfjs-dist@4.0.379/build/pdf.worker.mjs";
    const buf = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument({ data: buf }).promise;
    let text = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      text +=
        "\n\n" +
        content.items
          .map((it: any) => ("str" in it ? (it as { str: string }).str : ""))
          .join(" ");
    }
    return text;
  }
  if (name.endsWith(".docx")) {
    const mammothUrl = "https://esm.sh/mammoth@1.7.0/mammoth.browser.min.js";
    const mammoth: any = await import(/* @vite-ignore */ mammothUrl);
    const buf = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer: buf });
    return result.value;
  }

  if (name.endsWith(".epub")) {
    throw new Error("EPUB parsing is queued — please convert to PDF or DOCX for now.");
  }
  throw new Error("Unsupported file type. Use PDF, DOCX, MD or TXT.");
}

export default function OwnerBooks() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [showDeleted, setShowDeleted] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("broker_education_books")
      .select(
        "id, book_number, title, description, is_restricted, ai_generated_chapter_count, source_file_name, deleted_at, created_at",
      )
      .order("created_at", { ascending: false });
    const rows = (data ?? []) as unknown as BookRow[];
    setBooks(
      rows.map((r) => ({
        id: r.id,
        book_number: r.book_number,
        title: r.title,
        description: r.description,
        is_published: !r.is_restricted,
        ai_generated_chapter_count: r.ai_generated_chapter_count,
        source_file_name: r.source_file_name,
        deleted_at: r.deleted_at,
        created_at: r.created_at ?? "",
      })),
    );
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const onUpload = async (file: File) => {
    setBusy(true);
    try {
      toast({ title: "Extracting text…", description: file.name });
      const rawText = await fileToText(file);

      // Upload original to storage
      const path = `${Date.now()}-${file.name.replace(/[^\w.\-]/g, "_")}`;
      const { error: upErr } = await supabase.storage
        .from("owner-books")
        .upload(path, file, { contentType: file.type });
      let sourceFileUrl: string | null = null;
      if (!upErr) {
        const { data } = supabase.storage.from("owner-books").getPublicUrl(path);
        sourceFileUrl = data.publicUrl;
      }

      toast({ title: "Structuring with AI…", description: "This can take ~30s." });
      const { data: { session } } = await supabase.auth.getSession();
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/owner-book-ingest`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token ?? ""}`,
          },
          body: JSON.stringify({
            rawText,
            sourceFileUrl,
            sourceFileName: file.name,
            sourceMime: file.type,
            sourceSizeBytes: file.size,
          }),
        },
      );
      const json = await resp.json();
      if (!resp.ok) throw new Error(json.error ?? "Ingest failed");
      toast({
        title: "Book added",
        description: `${json.chapters} chapters structured.`,
      });
      await load();
    } catch (e) {
      toast({
        title: "Couldn't attach book",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const softDelete = async (id: string) => {
    await supabase
      .from("broker_education_books")
      .update({ deleted_at: new Date().toISOString(), is_restricted: true })
      .eq("id", id);
    await load();
  };
  const restore = async (id: string) => {
    await supabase
      .from("broker_education_books")
      .update({ deleted_at: null })
      .eq("id", id);
    await load();
  };
  const togglePublish = async (b: Book) => {
    await supabase
      .from("broker_education_books")
      .update({ is_restricted: b.is_published })
      .eq("id", b.id);
    await load();
  };

  const renameInline = async (id: string, title: string) => {
    await supabase
      .from("broker_education_books")
      .update({ title, sync_filename: false })
      .eq("id", id);
  };

  const visible = books.filter((b) =>
    showDeleted ? !!b.deleted_at : !b.deleted_at,
  );

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      <div className="container mx-auto px-6 py-10 max-w-6xl">
        <div className="flex items-end justify-between mb-8 gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-semibold text-[#1A1A1A] tracking-tight">
              Books Library
            </h1>
            <p className="text-sm text-[#1A1A1A]/70 mt-1">
              Attach PDF / DOCX / MD / TXT files. JBJ Web Developer auto-builds
              a cover, table of contents and chapter summaries.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-[#1A1A1A]/80">
              <Switch checked={showDeleted} onCheckedChange={setShowDeleted} />
              Recently deleted
            </label>
            <Button
              onClick={() => fileRef.current?.click()}
              disabled={busy}
              className="bg-[#102540] hover:bg-[#1a3d63] text-white allow-white"
              data-no-contrast-guard
            >
              {busy ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Upload className="w-4 h-4 mr-2" />
              )}
              Attach book
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.docx,.md,.txt,application/pdf,text/plain,text/markdown,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onUpload(f);
              }}
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-[#B89555]" />
          </div>
        ) : visible.length === 0 ? (
          <div className="border border-[#B89555]/30 rounded-2xl p-10 text-center bg-[#F7F2EA]" data-gold-hairline>
            <BookOpen className="w-8 h-8 mx-auto text-[#B89555] mb-2" />
            <p className="text-sm text-[#1A1A1A]/70">
              {showDeleted ? "Nothing in the trash." : "No books yet — attach your first file."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {visible.map((b) => (
              <div
                key={b.id}
                className="rounded-2xl border border-[#B89555]/25 bg-[#F7F2EA] p-4 flex flex-col gap-3"
                data-gold-hairline
              >
                <div className="aspect-[5/7] rounded-lg bg-[#FBF6EC] border border-[#B89555]/30 flex items-end p-4">
                  <div>
                    <div className="text-[10px] uppercase tracking-widest text-[#1A1A1A]/60 mb-1">
                      Book {b.book_number}
                    </div>
                    <div className="text-base font-semibold text-[#1A1A1A] line-clamp-3">
                      {b.title}
                    </div>
                  </div>
                </div>
                <Input
                  defaultValue={b.title}
                  onBlur={(e) => {
                    if (e.target.value !== b.title) renameInline(b.id, e.target.value);
                  }}
                  className="text-sm bg-white border-[#B89555]/30"
                />
                <div className="text-[11px] text-[#1A1A1A]/60 flex items-center gap-2">
                  <span>{b.ai_generated_chapter_count ?? 0} chapters</span>
                  {b.source_file_name && (
                    <>
                      <span>·</span>
                      <span className="truncate">{b.source_file_name}</span>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Button asChild size="sm" variant="ghost" className="text-[#1A1A1A] h-8 px-2">
                    <Link to={`/broker/learning/book/${b.id}`}>
                      <Eye className="w-3.5 h-3.5 mr-1" /> Preview
                    </Link>
                  </Button>
                  {!b.deleted_at ? (
                    <>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => togglePublish(b)}
                        className="h-8 px-2 text-[#1A1A1A]"
                      >
                        {b.is_published ? "Unpublish" : "Publish"}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => softDelete(b.id)}
                        className="h-8 px-2 text-red-700 hover:bg-red-50 ml-auto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </>
                  ) : (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => restore(b.id)}
                      className="h-8 px-2 text-[#1A1A1A] ml-auto"
                    >
                      <RefreshCcw className="w-3.5 h-3.5 mr-1" /> Restore
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
