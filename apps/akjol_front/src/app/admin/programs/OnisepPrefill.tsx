"use client";

import { useEffect, useRef, useState } from "react";
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
  const containerRef = useRef<HTMLDivElement>(null);

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
  }

  return (
    <div
      ref={containerRef}
      className="relative rounded-md border border-[#ee7768]/40 bg-orange-50 p-3"
    >
      <div className="flex items-center gap-2 mb-2">
        <Sparkles size={14} className="text-[#ee7768]" />
        <span className="text-xs font-medium text-gray-800">
          Pré-remplir depuis ONISEP
        </span>
        <span className="text-[10px] text-gray-500 ml-auto">5 829 fiches brutes disponibles</span>
      </div>
      <div className="relative">
        <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => setOpen(results.length > 0)}
          placeholder="Tape un libellé ONISEP (ex: BTS Services Informatiques)…"
          className="w-full pl-8 pr-8 py-1.5 bg-white border border-gray-200 rounded text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-500"
        />
        {q && (
          <button
            type="button"
            onClick={() => {
              setQ("");
              setResults([]);
              setOpen(false);
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-900"
            aria-label="Effacer"
          >
            <X size={12} />
          </button>
        )}
      </div>

      {open && (
        <div className="absolute left-3 right-3 mt-1 max-h-[300px] overflow-y-auto bg-white border border-gray-300 rounded-md shadow-xl z-10">
          {loading && (
            <div className="px-3 py-2 text-xs text-gray-500">Recherche…</div>
          )}
          {!loading && results.length === 0 && q.trim().length >= 2 && (
            <div className="px-3 py-2 text-xs text-gray-500">Aucun résultat.</div>
          )}
          {!loading &&
            results.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => pick(r)}
                className="block w-full text-left px-3 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
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
            ))}
        </div>
      )}
      <p className="mt-2 text-[10px] text-gray-400">
        Sélectionne une fiche ONISEP : titre, niveau, code et libellé formation s'auto-rempliront.
        Tu compléteras le reste à la main.
      </p>
    </div>
  );
}
