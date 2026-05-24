"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Search, Sparkles, X } from "lucide-react";

export type OnisepRaw = {
  id: string;
  title: string;
  level: string;
  formationCode: string;
  formationLabel: string;
  sourceUrl: string | null;
  sourceId: string;
  durationYears: number;
  description: string;
};

/**
 * Critère #2 de l'Admin : recherche dans les 5 829 fiches ONISEP brutes
 * (is_curated=false) pour pré-remplir un nouveau program. Debounce 200ms,
 * 30 résultats max, click → callback parent.
 */
export function OnisepPrefill({ onSelect }: { onSelect: (raw: OnisepRaw) => void }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<OnisepRaw[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();
  const optionIdPrefix = useId();

  useEffect(() => {
    if (q.trim().length < 2) {
      setResults([]);
      return;
    }
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/admin/programs/onisep-search?q=${encodeURIComponent(q.trim())}`,
          { signal: ctrl.signal },
        );
        if (!res.ok) return;
        const data = (await res.json()) as { items: OnisepRaw[] };
        setResults(data.items);
        setActiveIndex(data.items.length > 0 ? 0 : -1);
        setOpen(true);
      } catch {
        // aborted or network — ignore
      } finally {
        setLoading(false);
      }
    }, 200);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [q]);

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function pick(raw: OnisepRaw) {
    onSelect(raw);
    setQ("");
    setResults([]);
    setOpen(false);
    setActiveIndex(-1);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      if (results.length === 0) return;
      e.preventDefault();
      setOpen(true);
      setActiveIndex((i) => (i + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      if (results.length === 0) return;
      e.preventDefault();
      setActiveIndex((i) => (i <= 0 ? results.length - 1 : i - 1));
    } else if (e.key === "Enter") {
      if (open && activeIndex >= 0 && results[activeIndex]) {
        e.preventDefault();
        pick(results[activeIndex]);
      }
    } else if (e.key === "Escape") {
      if (open) {
        e.preventDefault();
        setOpen(false);
      }
    }
  }

  return (
    <div
      ref={containerRef}
      className="relative rounded-md border border-[#ee7768]/40 bg-orange-50 p-3"
    >
      <div className="flex items-center gap-2 mb-2">
        <Sparkles size={14} aria-hidden="true" className="text-[#ee7768]" />
        <span className="text-xs font-medium text-gray-800">
          Pré-remplir depuis ONISEP
        </span>
        <span className="text-[10px] text-gray-500 ml-auto">5 829 fiches brutes disponibles</span>
      </div>
      <div className="relative">
        <Search
          size={14}
          aria-hidden="true"
          className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => setOpen(results.length > 0)}
          onKeyDown={onKeyDown}
          placeholder="Tape un libellé ONISEP (ex: BTS Services Informatiques)…"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-activedescendant={
            open && activeIndex >= 0 ? `${optionIdPrefix}-opt-${activeIndex}` : undefined
          }
          className="w-full pl-8 pr-8 py-1.5 bg-white border border-gray-200 rounded text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-500"
        />
        {q && (
          <button
            type="button"
            onClick={() => {
              setQ("");
              setResults([]);
              setOpen(false);
              setActiveIndex(-1);
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-900"
            aria-label="Effacer la recherche"
          >
            <X size={12} aria-hidden="true" />
          </button>
        )}
      </div>

      {open && (
        <div
          id={listboxId}
          role="listbox"
          aria-label="Suggestions ONISEP"
          className="absolute left-3 right-3 mt-1 max-h-[300px] overflow-y-auto bg-white border border-gray-300 rounded-md shadow-xl z-10"
        >
          {loading && (
            <div className="px-3 py-2 text-xs text-gray-500" role="status">
              Recherche…
            </div>
          )}
          {!loading && results.length === 0 && q.trim().length >= 2 && (
            <div className="px-3 py-2 text-xs text-gray-500" role="status">
              Aucun résultat.
            </div>
          )}
          {!loading &&
            results.map((r, idx) => {
              const active = idx === activeIndex;
              return (
                <button
                  key={r.id}
                  id={`${optionIdPrefix}-opt-${idx}`}
                  role="option"
                  aria-selected={active}
                  type="button"
                  onMouseEnter={() => setActiveIndex(idx)}
                  onClick={() => pick(r)}
                  className={`block w-full text-left px-3 py-2 border-b border-gray-100 last:border-b-0 ${
                    active ? "bg-gray-100" : "hover:bg-gray-50"
                  }`}
                >
                  <div className="text-sm text-gray-900 truncate">{r.title}</div>
                  <div className="text-[11px] text-gray-500 flex gap-2 mt-0.5">
                    <span className="font-mono">{r.formationCode}</span>
                    <span>·</span>
                    <span>{r.level}</span>
                    {r.sourceUrl && (
                      <>
                        <span>·</span>
                        <span className="truncate max-w-[200px]">{r.sourceUrl}</span>
                      </>
                    )}
                  </div>
                </button>
              );
            })}
        </div>
      )}
      <p className="mt-2 text-[10px] text-gray-400">
        Sélectionne une fiche ONISEP : titre, niveau, code et libellé formation s'auto-rempliront.
        Tu compléteras le reste à la main.
      </p>
    </div>
  );
}
