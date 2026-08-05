/**
 * SavedSearches — account view for filters saved from the /properties filter
 * header. Reads the same local store as SavedFilterMenu.
 */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Bookmark, ChevronRight, Trash2 } from "lucide-react";
import {
  listSavedFilters,
  removeSavedFilter,
  type SavedFilter,
} from "@/lib/savedFilters";

export default function SavedSearches() {
  const [saved, setSaved] = useState<SavedFilter[]>([]);

  useEffect(() => {
    const sync = () => setSaved(listSavedFilters());
    sync();
    window.addEventListener("jbjSavedFiltersChange", sync);
    return () => window.removeEventListener("jbjSavedFiltersChange", sync);
  }, []);

  return (
    <main className="min-h-screen bg-[#FDFBF7] py-12">
      <div className="container mx-auto px-4 max-w-3xl">
        <header className="mb-8">
          <p className="text-[11.5px] font-semibold uppercase tracking-[0.12em] text-[#1A1A1A]/60">
            My account
          </p>
          <h1 className="text-3xl font-bold text-[#1A1A1A] mt-1">Saved filters</h1>
          <p className="text-sm text-[#1A1A1A]/70 mt-2">
            Re-open any search you saved from the property filter.
          </p>
        </header>

        {saved.length === 0 ? (
          <div
            className="rounded-2xl p-8 text-center"
            style={{ background: "#FFFDF9", border: "1px solid rgba(184,149,85,0.40)" }}
          >
            <Bookmark className="w-6 h-6 mx-auto mb-3" style={{ color: "#042C1C" }} />
            <p className="text-sm text-[#1A1A1A]/75">
              You have no saved filters yet. Use{" "}
              <Link to="/properties" className="font-semibold underline">
                Save filter
              </Link>{" "}
              on the property search to store one.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {saved.map((f) => (
              <li
                key={f.id}
                className="flex items-center gap-3 rounded-xl px-4 py-3"
                style={{ background: "#FFFDF9", border: "1px solid rgba(184,149,85,0.40)" }}
              >
                <Link
                  to={`/properties?${f.query}`}
                  className="flex-1 min-w-0 flex items-center justify-between gap-3"
                >
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-[#1A1A1A] truncate">
                      {f.name}
                    </span>
                    <span className="block text-[11.5px] text-[#1A1A1A]/60">
                      Saved {new Date(f.createdAt).toLocaleDateString()}
                    </span>
                  </span>
                  <ChevronRight className="w-4 h-4 shrink-0" style={{ color: "#042C1C" }} />
                </Link>
                <button
                  type="button"
                  aria-label={`Delete ${f.name}`}
                  onClick={() => removeSavedFilter(f.id)}
                  className="shrink-0 w-9 h-9 rounded-lg inline-flex items-center justify-center hover:bg-[#F7F2EA]"
                >
                  <Trash2 className="w-4 h-4" style={{ color: "#042C1C" }} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
