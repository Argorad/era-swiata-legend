import { useEffect, useState } from "react";
import { api } from "../services/api";
import type { SearchResult } from "../types/SearchResult";

interface Props {
    activeWorldId: string | null;
    onNavigate: (result: SearchResult) => void;
}

const labels: Record<SearchResult["type"], string> = {
    world: "Świat",
    folder: "Folder",
    page: "Strona",
    file: "Plik",
};

export default function GlobalSearch({ activeWorldId, onNavigate }: Props) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        if (query.trim().length < 2) {
            return;
        }

        const controller = new AbortController();
        const timeout = window.setTimeout(async () => {
            try {
                setIsLoading(true);
                const response = await api.get<SearchResult[]>("/search", {
                    params: { query: query.trim() },
                    signal: controller.signal,
                });
                setResults(response.data);
                setError(null);
            } catch {
                if (!controller.signal.aborted) {
                    setError("Nie udało się wykonać wyszukiwania.");
                }
            } finally {
                if (!controller.signal.aborted) setIsLoading(false);
            }
        }, 300);

        return () => {
            window.clearTimeout(timeout);
            controller.abort();
        };
    }, [query, activeWorldId]);

    return (
        <div className="global-search">
            <label htmlFor="global-search-input" className="sr-only">Szukaj w wiedzy</label>
            <input id="global-search-input" type="search" value={query} placeholder="Szukaj w kronikach..." onFocus={() => setIsOpen(true)} onChange={(event) => { const value = event.target.value; setQuery(value); setIsOpen(true); if (value.trim().length < 2) { setResults([]); setError(null); } }} />
            {query && <button type="button" className="search-clear" aria-label="Wyczyść wyszukiwanie" onClick={() => { setQuery(""); setIsOpen(false); }}>×</button>}
            {isOpen && query.trim().length >= 2 && <div className="search-results" role="listbox">
                {isLoading && <p className="search-state">Wyszukiwanie...</p>}
                {error && <p className="search-state search-state--error">{error}</p>}
                {!isLoading && !error && results.length === 0 && <p className="search-state">Brak pasujących wyników.</p>}
                {!isLoading && !error && results.map((result) => <button key={`${result.type}-${result.id}`} type="button" className="search-result" onClick={() => { onNavigate(result); setIsOpen(false); }}>
                    <span className={`search-result-type search-result-type--${result.type}`}>{labels[result.type]}</span>
                    <span className="search-result-copy"><strong>{result.name}</strong><small>{result.breadcrumb}</small>{result.excerpt && <em>{result.excerpt}</em>}</span>
                </button>)}
            </div>}
        </div>
    );
}
