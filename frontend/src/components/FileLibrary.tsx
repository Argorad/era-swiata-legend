import { useEffect, useRef, useState } from "react";
import { api } from "../services/api";
import type { FileAttachment } from "../types/FileAttachment";
import type { Folder } from "../types/Folder";

interface Props {
    worldId: string;
    folder: Folder;
    canEdit: boolean;
}

function formatSize(size: number): string {
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export default function FileLibrary({ worldId, folder, canEdit }: Props) {
    const [files, setFiles] = useState<FileAttachment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const loadFiles = async () => {
        try {
            setIsLoading(true);
            const response = await api.get<FileAttachment[]>(
                `/worlds/${worldId}/folders/${folder.id}/files`,
            );
            setFiles(response.data);
            setError(null);
        } catch {
            setError("Nie udało się pobrać plików.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        let isCurrent = true;

        api.get<FileAttachment[]>(
            `/worlds/${worldId}/folders/${folder.id}/files`,
        )
            .then((response) => {
                if (!isCurrent) return;
                setFiles(response.data);
                setError(null);
            })
            .catch(() => {
                if (isCurrent) {
                    setError("Nie udało się pobrać plików.");
                }
            })
            .finally(() => {
                if (isCurrent) setIsLoading(false);
            });

        return () => {
            isCurrent = false;
        };
    }, [worldId, folder.id]);

    const upload = async (file: File) => {
        const formData = new FormData();
        formData.append("file", file);
        try {
            setIsUploading(true);
            setError(null);
            const response = await api.post<FileAttachment>(
                `/worlds/${worldId}/folders/${folder.id}/files`,
                formData,
            );
            setFiles((current) => [...current, response.data].sort((a, b) => a.originalName.localeCompare(b.originalName, "pl")));
        } catch {
            setError("Nie udało się dodać pliku. Sprawdź typ i limit 20 MB.");
        } finally {
            setIsUploading(false);
            if (inputRef.current) inputRef.current.value = "";
        }
    };

    const download = async (file: FileAttachment) => {
        try {
            const response = await api.get(
                `/worlds/${worldId}/files/${file.id}/download`,
                { responseType: "blob" },
            );
            const url = URL.createObjectURL(response.data);
            const anchor = document.createElement("a");
            anchor.href = url;
            anchor.download = file.originalName;
            anchor.click();
            URL.revokeObjectURL(url);
        } catch {
            setError("Nie udało się pobrać pliku.");
        }
    };

    const trash = async (file: FileAttachment) => {
        if (!window.confirm(`Przenieść plik „${file.originalName}” do kosza?`)) return;
        try {
            await api.patch(`/worlds/${worldId}/files/${file.id}/trash`);
            setFiles((current) => current.filter((item) => item.id !== file.id));
        } catch {
            setError("Nie udało się przenieść pliku do kosza.");
        }
    };

    const restore = async (file: FileAttachment) => {
        try {
            await api.patch(`/worlds/${worldId}/files/${file.id}/restore`, { destinationFolderId: null });
            setFiles((current) => current.filter((item) => item.id !== file.id));
        } catch {
            setError("Nie udało się przywrócić pliku.");
        }
    };

    return (
        <section className="content-section file-library">
            <div className="content-section-bar">
                <div className="content-section-heading"><span>Materiały</span><h2>Pliki</h2></div>
                <div className="page-section-actions">
                    <span className="content-count-badge">{isLoading ? "…" : files.length}</span>
                    {canEdit && folder.type === 0 && <label className={`file-upload-button${isUploading ? " is-disabled" : ""}`}>
                        {isUploading ? "Dodawanie..." : "＋ Dodaj plik"}
                        <input ref={inputRef} type="file" disabled={isUploading} accept=".pdf,.txt,.md,.png,.jpg,.jpeg,.webp,.gif,.docx,.xlsx" onChange={(event) => { const file = event.target.files?.[0]; if (file) void upload(file); }} />
                    </label>}
                </div>
            </div>
            {error && <div className="pages-status-state pages-status-state--error" role="alert"><strong>Błąd plików</strong><p>{error}</p><button type="button" onClick={() => void loadFiles()}>Spróbuj ponownie</button></div>}
            {!error && isLoading && <div className="pages-status-state"><strong>Wczytywanie plików...</strong></div>}
            {!error && !isLoading && files.length === 0 && <div className="section-empty-state"><span>▧</span><div><strong>Brak plików</strong><p>Dodaj mapy, ilustracje lub dokumenty związane z tym folderem.</p></div></div>}
            {!error && !isLoading && files.length > 0 && <div className="file-list">{files.map((file) => <article key={file.id} className="file-card"><span className="file-card-icon">▧</span><div><strong>{file.originalName}</strong><small>{formatSize(file.size)} · {file.contentType}</small></div><div className="file-card-actions"><button type="button" onClick={() => void download(file)}>Pobierz</button>{canEdit && (folder.type === 2 ? <button type="button" onClick={() => void restore(file)}>Przywróć</button> : <button type="button" className="danger-action" onClick={() => void trash(file)}>Do kosza</button>)}</div></article>)}</div>}
        </section>
    );
}
