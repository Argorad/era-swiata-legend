import { useState } from "react";
import type { Folder } from "../types/Folder";
import type { Page } from "../types/Page";
import ModalPortal from "./ModalPortal";

interface EditProps {
    page: Page;
    onSave: (title: string, content: string) => Promise<void>;
    onClose: () => void;
}

export function PageEditDialog({
    page,
    onSave,
    onClose,
}: EditProps) {
    const [title, setTitle] = useState(page.title);
    const [content, setContent] = useState(page.content);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const submit = async (event: React.FormEvent) => {
        event.preventDefault();

        if (!title.trim()) {
            setError("Tytuł strony jest wymagany.");
            return;
        }

        try {
            setIsSaving(true);
            setError(null);
            await onSave(title.trim(), content.trim());
            onClose();
        } catch {
            setError("Nie udało się zapisać zmian strony.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <ModalPortal>
            <div className="page-dialog-backdrop">
                <form className="page-dialog" onSubmit={submit}>
                    <span className="page-dialog-kicker">Edycja</span>
                    <h3>Edytuj stronę</h3>
                    <label htmlFor="edit-page-title">Tytuł</label>
                    <input
                        id="edit-page-title"
                        value={title}
                        maxLength={300}
                        onChange={(event) => setTitle(event.target.value)}
                        disabled={isSaving}
                        autoFocus
                    />
                    <label htmlFor="edit-page-content">Treść</label>
                    <textarea
                        id="edit-page-content"
                        value={content}
                        rows={12}
                        onChange={(event) => setContent(event.target.value)}
                        disabled={isSaving}
                    />
                    {error && <p className="page-dialog-error">{error}</p>}
                    <div className="page-dialog-actions">
                        <button type="button" className="page-button page-button--ghost" onClick={onClose} disabled={isSaving}>Anuluj</button>
                        <button type="submit" className="page-button page-button--primary" disabled={isSaving}>{isSaving ? "Zapisywanie..." : "Zapisz"}</button>
                    </div>
                </form>
            </div>
        </ModalPortal>
    );
}

interface MoveProps {
    page: Page;
    folders: Folder[];
    onMove: (folderId: string) => Promise<void>;
    onClose: () => void;
}

export function PageMoveDialog({
    page,
    folders,
    onMove,
    onClose,
}: MoveProps) {
    const normalFolders = folders.filter((folder) => folder.type === 0);
    const [folderId, setFolderId] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const submit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!folderId) {
            setError("Wybierz folder docelowy.");
            return;
        }
        try {
            setIsSaving(true);
            await onMove(folderId);
            onClose();
        } catch {
            setError("Nie udało się przenieść strony.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <ModalPortal>
            <div className="page-dialog-backdrop">
                <form className="page-dialog page-dialog--compact" onSubmit={submit}>
                    <span className="page-dialog-kicker">Zmiana położenia</span>
                    <h3>Przenieś stronę</h3>
                    <p className="page-dialog-description"><strong>{page.title}</strong></p>
                    <label htmlFor="move-page-folder">Folder docelowy</label>
                    <select id="move-page-folder" value={folderId} onChange={(event) => setFolderId(event.target.value)} disabled={isSaving}>
                        <option value="">Wybierz folder</option>
                        {normalFolders.filter((folder) => folder.id !== page.folderId).map((folder) => <option key={folder.id} value={folder.id}>{folder.name}</option>)}
                    </select>
                    {error && <p className="page-dialog-error">{error}</p>}
                    <div className="page-dialog-actions">
                        <button type="button" className="page-button page-button--ghost" onClick={onClose} disabled={isSaving}>Anuluj</button>
                        <button type="submit" className="page-button page-button--primary" disabled={isSaving || !folderId}>{isSaving ? "Przenoszenie..." : "Przenieś"}</button>
                    </div>
                </form>
            </div>
        </ModalPortal>
    );
}

interface DeleteProps {
    pageTitle: string;
    onDelete: () => Promise<void>;
    onClose: () => void;
}

export function PageDeleteDialog({ pageTitle, onDelete, onClose }: DeleteProps) {
    const [confirmation, setConfirmation] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const submit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (confirmation !== "USUŃ") return;
        try {
            setIsSaving(true);
            await onDelete();
            onClose();
        } catch {
            setError("Nie udało się trwale usunąć strony.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <ModalPortal>
            <div className="page-dialog-backdrop">
                <form className="page-dialog page-dialog--compact" onSubmit={submit}>
                    <span className="page-dialog-kicker">Operacja nieodwracalna</span>
                    <h3>Trwale usuń stronę</h3>
                    <p className="danger-copy">Strona <strong>{pageTitle}</strong> zostanie usunięta bez możliwości przywrócenia. Wpisz <strong>USUŃ</strong>, aby potwierdzić.</p>
                    <label htmlFor="delete-page-confirmation">Potwierdzenie</label>
                    <input id="delete-page-confirmation" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} disabled={isSaving} autoComplete="off" />
                    {error && <p className="page-dialog-error">{error}</p>}
                    <div className="page-dialog-actions">
                        <button type="button" className="page-button page-button--ghost" onClick={onClose} disabled={isSaving}>Anuluj</button>
                        <button type="submit" className="page-button page-button--danger" disabled={isSaving || confirmation !== "USUŃ"}>{isSaving ? "Usuwanie..." : "Usuń trwale"}</button>
                    </div>
                </form>
            </div>
        </ModalPortal>
    );
}
