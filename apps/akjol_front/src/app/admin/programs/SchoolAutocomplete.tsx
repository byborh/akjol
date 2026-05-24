"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Search, Building2 } from "lucide-react";

export type SchoolSuggestion = {
  uai: string;
  name: string;
  city: string;
  postalCode: string | null;
  region: string | null;
  type: string | null;
  websiteUrl: string | null;
};

/**
 * Autocomplete sur la table `schools` (5 843 lignes).
 * Sur sélection, pré-remplit name, city, uai, type, website.
 * Permet aussi de saisir un nom libre (si l'école n'est pas dans l'Annuaire,
 * ex: nouveau bootcamp, IUT non importé).
 */
export function SchoolAutocomplete({
  name,
  city,
  uai,
  onPick,
  onClear,
}: {
  name: string;
  city: string;
  uai: string;
  onPick: (school: SchoolSuggestion) => void;
  onClear: () => void;
}) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<SchoolSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  // useId pour générer des IDs uniques (combobox + listbox + options) :
  // pattern ARIA 1.2, indispensable au lecteur d'écran pour relier l'input
  // à la liste et à l'option active via aria-activedescendant.
  const listboxId = useId();
  const optionIdPrefix = useId();

  const linked = Boolean(uai);

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
          `/api/admin/schools/search?q=${encodeURIComponent(q.trim())}`,
          { signal: ctrl.signal },
        );
        if (!res.ok) return;
        const data = (await res.json()) as { items: SchoolSuggestion[] };
        setResults(data.items);
        setActiveIndex(data.items.length > 0 ? 0 : -1);
        setOpen(true);
      } catch {
        // aborted
      } finally {
        setLoading(false);
      }
    }, 180);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [q]);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (linked) {
    return (
      <div className="flex items-center justify-between gap-3 px-3 py-2.5 rounded border border-green-300 bg-green-50">
        <div className="flex items-center gap-2 min-w-0">
          <Building2 size={14} className="text-green-700 flex-shrink-0" />
          <div className="min-w-0">
            <div className="text-sm text-gray-900 truncate">{name}</div>
            <div className="text-[11px] text-gray-600">
              {city}
              {uai && <> · UAI <code>{uai}</code></>}
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={onClear}
          className="text-xs text-gray-600 hover:text-gray-900 px-2 py-1 rounded hover:bg-gray-100"
        >
          Changer
        </button>
      </div>
    );
  }

  function selectAt(idx: number) {
    const s = results[idx];
    if (!s) return;
    onPick(s);
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
      if (open && activeIndex >= 0) {
        e.preventDefault();
        selectAt(activeIndex);
      }
    } else if (e.key === "Escape") {
      if (open) {
        e.preventDefault();
        setOpen(false);
      }
    }
  }

  return (
    <div ref={containerRef} className="relative">
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
          placeholder="Tape le nom d'une école (Magendie, IUT Lyon, Epita…)"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-activedescendant={
            open && activeIndex >= 0 ? `${optionIdPrefix}-opt-${activeIndex}` : undefined
          }
          className="w-full pl-8 pr-3 py-2 bg-gray-50 border border-gray-200 rounded text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-500"
        />
      </div>

      {open && (
        <div
          id={listboxId}
          role="listbox"
          aria-label="Suggestions d'écoles"
          className="absolute left-0 right-0 mt-1 max-h-[280px] overflow-y-auto bg-white border border-gray-300 rounded-md shadow-xl z-10"
        >
          {loading && (
            <div className="px-3 py-2 text-xs text-gray-500" role="status">
              Recherche…
            </div>
          )}
          {!loading && results.length === 0 && q.trim().length >= 2 && (
            <div className="px-3 py-2 text-xs text-gray-500" role="status">
              Aucune école trouvée. Saisis les champs à la main ci-dessous.
            </div>
          )}
          {!loading &&
            results.map((s, idx) => {
              const active = idx === activeIndex;
              return (
                <button
                  key={s.uai}
                  id={`${optionIdPrefix}-opt-${idx}`}
                  role="option"
                  aria-selected={active}
                  type="button"
                  onMouseEnter={() => setActiveIndex(idx)}
                  onClick={() => selectAt(idx)}
                  className={`block w-full text-left px-3 py-2 border-b border-gray-100 last:border-b-0 ${
                    active ? "bg-gray-100" : "hover:bg-gray-50"
                  }`}
                >
                  <div className="text-sm text-gray-900 truncate">{s.name}</div>
                  <div className="text-[11px] text-gray-500 flex gap-2 mt-0.5">
                    <span>{s.city}</span>
                    {s.type && (
                      <>
                        <span>·</span>
                        <span>{s.type}</span>
                      </>
                    )}
                    <span>·</span>
                    <span className="font-mono">UAI {s.uai}</span>
                  </div>
                </button>
              );
            })}
        </div>
      )}
      <p className="mt-1 text-[10px] text-gray-400">
        Tu peux aussi remplir manuellement les champs ci-dessous si l'école n'est pas dans
        l'annuaire (UAI vide = saisie libre).
      </p>
    </div>
  );
}
