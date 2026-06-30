/**
 * Owner Books Library — attach/upload books, AI auto-generates chapter
 * structure, owner can edit/restyle/delete. Brokers see published rows.
 */
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Upload, Loader2, Eye, Trash2, RefreshCcw, Lock } from "lucide-react";
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

// Per-book color palettes — gives each cover its own identity, library-shelf feel.
const BOOK_PALETTES = [
  { spine: "#5b1216", cover: "#8a1c22", cover2: "#5b1216", foil: "#e8c878" }, // oxblood
  { spine: "#0b2545", cover: "#13315c", cover2: "#0b2545", foil: "#e8c878" }, // navy
  { spine: "#1f3b2c", cover: "#2f5d44", cover2: "#1f3b2c", foil: "#e8c878" }, // forest
  { spine: "#2a1a3f", cover: "#46295a", cover2: "#2a1a3f", foil: "#e8c878" }, // aubergine
  { spine: "#3a1f0f", cover: "#5b3320", cover2: "#3a1f0f", foil: "#e8c878" }, // cognac
  { spine: "#1a1a1a", cover: "#2b2b2b", cover2: "#1a1a1a", foil: "#c9a84c" }, // obsidian
  { spine: "#5a4528", cover: "#7a5e34", cover2: "#5a4528", foil: "#f0d78c" }, // bronze
  { spine: "#0e3b3a", cover: "#185856", cover2: "#0e3b3a", foil: "#e8c878" }, // teal
  { spine: "#6a1e3a", cover: "#8c2a4f", cover2: "#6a1e3a", foil: "#e8c878" }, // burgundy
];

const BOOK_3D_CSS = `
.book-3d-wrap { perspective: 1600px; padding: 8px 0 18px; display:flex; justify-content:center; }
.book-3d {
  position: relative;
  width: 78%;
  aspect-ratio: 5 / 7;
  transform-style: preserve-3d;
  transform: rotateY(-22deg) rotateX(4deg);
  transition: transform .55s cubic-bezier(.2,.7,.2,1);
  filter: drop-shadow(22px 28px 28px rgba(20,12,4,.32)) drop-shadow(2px 4px 6px rgba(20,12,4,.18));
}
.book-3d-wrap:hover .book-3d { transform: rotateY(-8deg) rotateX(2deg) translateY(-3px); }
.book-3d__cover {
  position:absolute; inset:0;
  background:
    radial-gradient(120% 80% at 30% 20%, rgba(255,255,255,.10), transparent 55%),
    linear-gradient(135deg, var(--cover) 0%, var(--cover2) 100%);
  border-radius: 3px 8px 8px 3px;
  box-shadow: inset 0 0 0 1px rgba(0,0,0,.35), inset 0 0 22px rgba(0,0,0,.35);
  overflow:hidden;
}
.book-3d__pages {
  position:absolute; top:2%; right:-1.2%; bottom:2%; width: 12px;
  background: repeating-linear-gradient(to bottom, #f5ecd8 0 1px, #e6d8b6 1px 2px);
  transform: translateZ(-12px) rotateY(8deg);
  border-radius: 1px;
  box-shadow: inset -2px 0 4px rgba(0,0,0,.18);
}
.book-3d__spineEdge {
  position:absolute; top:0; left:0; bottom:0; width: 14px;
  background: linear-gradient(90deg, rgba(0,0,0,.55), rgba(0,0,0,.18) 60%, transparent);
  border-right: 1px solid rgba(0,0,0,.4);
}
.book-3d__gloss {
  position:absolute; inset:0;
  background: linear-gradient(105deg, transparent 30%, rgba(255,255,255,.16) 42%, transparent 55%);
  pointer-events:none;
}
.book-3d__frame {
  position:absolute; inset: 9% 8% 9% 11%;
  border: 1px solid color-mix(in srgb, var(--foil) 70%, transparent);
  border-radius: 2px;
  padding: 14px 12px;
  display:flex; flex-direction:column;
  color: var(--foil);
  text-shadow: 0 1px 0 rgba(0,0,0,.45);
  font-family: 'Inter', sans-serif;
}
.book-3d__eyebrow { font-size: 9px; letter-spacing: .28em; text-transform: uppercase; opacity:.9; }
.book-3d__title {
  margin-top: 12px; font-size: 17px; line-height: 1.18; font-weight: 700;
  letter-spacing: .01em;
  display:-webkit-box; -webkit-line-clamp:4; -webkit-box-orient:vertical; overflow:hidden;
}
.book-3d__rule { margin-top:auto; height:1px; background: currentColor; opacity:.7; }
.book-3d__author { margin-top: 8px; font-size: 10px; letter-spacing:.22em; text-transform:uppercase; opacity:.9; }
.book-3d__lock {
  position:absolute; top:8%; right:8%; width: 26px; height: 26px; border-radius: 999px;
  display:grid; place-items:center;
  background: radial-gradient(circle at 35% 30%, #fff2c4 0%, var(--foil) 45%, #8a6a25 100%);
  box-shadow: inset 0 0 0 1px rgba(255,244,210,.55), 0 2px 4px rgba(0,0,0,.45);
  color: #3a2a08;
  z-index: 3;
}
`;



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
      <style>{BOOK_3D_CSS}</style>
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
              className="bg-[#0A0A0A] hover:bg-[#1F1F1F] text-white allow-white"
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12 pt-4">
            {visible.map((b, i) => {
              const palette = BOOK_PALETTES[i % BOOK_PALETTES.length];
              return (
              <div key={b.id} className="flex flex-col gap-3">
                <div className="book-3d-wrap">
                  <div
                    className="book-3d"
                    style={{
                      ['--spine' as any]: palette.spine,
                      ['--cover' as any]: palette.cover,
                      ['--cover2' as any]: palette.cover2,
                      ['--foil' as any]: palette.foil,
                    }}
                  >
                    <div className="book-3d__pages" />
                    <div className="book-3d__cover">
                      <div className="book-3d__lock" aria-label="Owner-only book">
                        <Lock size={12} strokeWidth={2.6} />
                      </div>
                      <div className="book-3d__frame">
                        <div className="book-3d__title">{b.title}</div>
                        <div className="book-3d__rule" />
                        <div className="book-3d__author">JBJ Global</div>
                      </div>
                      <div className="book-3d__spineEdge" />
                      <div className="book-3d__gloss" />
                    </div>
                  </div>
                </div>
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
            );})}
          </div>
        )}
      </div>
    </div>
  );
}
