/**
 * SavedFilterMenu — "Save filter" control that lives inside the /properties
 * filter header. Saves the current search locally and lets the visitor
 * re-apply or delete any saved search from the same popover.
 */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BookmarkPlus, Check, Trash2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import {
  listSavedFilters,
  removeSavedFilter,
  saveFilter,
  type SavedFilter,
} from "@/lib/savedFilters";
import { describeSearch, type PropertySearch } from "@/lib/propertySearch";

interface Props {
  search: PropertySearch;
}

export default function SavedFilterMenu({ search }: Props) {
  const navigate = useNavigate();
  const [saved, setSaved] = useState<SavedFilter[]>([]);
  const [name, setName] = useState("");

  useEffect(() => {
    const sync = () => setSaved(listSavedFilters());
    sync();
    window.addEventListener("jbjSavedFiltersChange", sync);
    return () => window.removeEventListener("jbjSavedFiltersChange", sync);
  }, []);

  const commit = () => {
    saveFilter(name || describeSearch(search), search);
    setName("");
    toast.success("Filter saved — find it here or in your account menu.");
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          data-no-contrast-guard
          aria-label="Save this filter"
          className="inline-flex items-center justify-center gap-2 h-11 px-4 rounded-xl text-[13px] sm:text-sm font-semibold"
          style={{
            background: "#FFFDF9",
            border: "1px solid rgba(15,29,24,0.20)",
            color: "#1A1A1A",
          }}
        >
          <BookmarkPlus className="w-4 h-4" strokeWidth={2.2} style={{ color: "#042C1C" }} />
          <span style={{ color: "#1A1A1A", WebkitTextFillColor: "#1A1A1A" }}>Save filter</span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-[min(92vw,22rem)] p-3 z-[80]"
        style={{ background: "#FFFDF9", border: "1px solid rgba(184,149,85,0.45)", color: "#1A1A1A" }}
      >
        <p className="text-[11.5px] font-semibold uppercase tracking-[0.08em] mb-2" style={{ color: "rgba(26,26,26,0.6)" }}>
          Save current search
        </p>
        <div className="flex items-center gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name this search…"
            className="flex-1 min-w-0 h-10 px-3 rounded-lg text-[13px] outline-none"
            style={{ background: "#FFFFFF", border: "1px solid rgba(15,29,24,0.18)", color: "#1A1A1A" }}
          />
          <button
            type="button"
            onClick={commit}
            data-surface="emerald"
            data-no-contrast-guard
            className="h-10 px-3 rounded-lg text-[13px] font-semibold inline-flex items-center gap-1.5"
            style={{
              backgroundImage: "linear-gradient(135deg,#064E3B 0%,#042c1c 55%,#000 100%)",
              color: "#FFFFFF",
            }}
          >
            <Check className="w-4 h-4" style={{ color: "#FFFFFF", stroke: "#FFFFFF" }} />
            Save
          </button>
        </div>

        {saved.length > 0 && (
          <>
            <div className="h-px my-3" style={{ background: "rgba(184,149,85,0.35)" }} />
            <p className="text-[11.5px] font-semibold uppercase tracking-[0.08em] mb-2" style={{ color: "rgba(26,26,26,0.6)" }}>
              Saved filters
            </p>
            <ul className="space-y-1 max-h-64 overflow-y-auto">
              {saved.map((f) => (
                <li key={f.id} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => navigate(`/properties?${f.query}`)}
                    className="flex-1 min-w-0 text-left px-2.5 py-2 rounded-lg text-[13px] font-medium hover:bg-[#F7F2EA] truncate"
                    style={{ color: "#1A1A1A" }}
                  >
                    {f.name}
                  </button>
                  <button
                    type="button"
                    aria-label={`Delete ${f.name}`}
                    onClick={() => removeSavedFilter(f.id)}
                    className="shrink-0 w-8 h-8 rounded-lg inline-flex items-center justify-center hover:bg-[#F7F2EA]"
                  >
                    <Trash2 className="w-4 h-4" style={{ color: "#042C1C" }} />
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
