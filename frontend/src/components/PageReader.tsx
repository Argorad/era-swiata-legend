import { useState } from "react";
import type { Folder } from "../types/Folder";
import type { Page } from "../types/Page";
import {
    PageDeleteDialog,
    PageEditDialog,
    PageMoveDialog,
} from "./PageActionDialogs";
import "./PageManagement.css";

interface Props {
    worldName: string;
    folder: Folder;
    folders: Folder[];
    page: Page;
    canEdit: boolean;
    onBack: () => void;
    onUpdate: (title: string, content: string) => Promise<void>;
    onMove: (folderId: string) => Promise<void>;
    onArchive: () => Promise<void>;
    onTrash: () => Promise<void>;
    onRestore: () => Promise<void>;
    onDelete: () => Promise<void>;
}

export default function PageReader({
    worldName,
    folder,
    folders,
    page,
    canEdit,
    onBack,
    onUpdate,
    onMove,
    onArchive,
    onTrash,
    onRestore,
    onDelete,
}: Props) {
    const [dialog, setDialog] = useState<"edit" | "move" | "delete" | null>(null);
    const [isActionRunning, setIsActionRunning] = useState(false);
    const [actionError, setActionError] = useState<string | null>(null);
    const isArchive = folder.type === 1;
    const isTrash = folder.type === 2;

    const runAction = async (action: () => Promise<void>) => {
        try {
            setIsActionRunning(true);
            setActionError(null);
            await action();
        } catch {
            setActionError("Nie udało się wykonać operacji na stronie.");
        } finally {
            setIsActionRunning(false);
        }
    };

    return (
        <article className="content-surface page-reader">
            <nav className="page-reader-breadcrumbs" aria-label="Położenie strony">
                <span>{worldName}</span><span aria-hidden="true">›</span>
                <button type="button" onClick={onBack}>{folder.name}</button>
                <span aria-hidden="true">›</span><strong>{page.title}</strong>
            </nav>

            <div className="page-reader-toolbar">
                <button type="button" className="page-reader-back" onClick={onBack}><span aria-hidden="true">←</span> Wróć do folderu</button>
                <div className="page-reader-actions">
                    {canEdit && !isArchive && !isTrash && <>
                        <button type="button" onClick={() => setDialog("edit")}>Edytuj</button>
                        <button type="button" onClick={() => setDialog("move")}>Przenieś</button>
                        <button type="button" onClick={() => void runAction(onArchive)} disabled={isActionRunning}>Archiwizuj</button>
                        <button type="button" className="danger-action" onClick={() => void runAction(onTrash)} disabled={isActionRunning}>Do kosza</button>
                    </>}
                    {canEdit && (isArchive || isTrash) && <button type="button" onClick={() => void runAction(onRestore)} disabled={isActionRunning}>Przywróć</button>}
                    {canEdit && isArchive && <button type="button" className="danger-action" onClick={() => void runAction(onTrash)} disabled={isActionRunning}>Do kosza</button>}
                    {canEdit && isTrash && <button type="button" className="danger-action" onClick={() => setDialog("delete")}>Usuń trwale</button>}
                </div>
            </div>

            {actionError && <p className="page-action-error" role="alert">{actionError}</p>}

            <header className="page-reader-header">
                <span className="content-eyebrow">Strona kroniki</span>
                <h1>{page.title}</h1>
                <p>Folder: <strong>{folder.name}</strong></p>
            </header>

            <div className="ornament-divider"><span>◇</span></div>

            {page.content.trim() ? (
                <div className="page-reader-content">{page.content}</div>
            ) : (
                <div className="page-reader-empty">
                    <span aria-hidden="true">◇</span>
                    <strong>Ta strona jest jeszcze pusta</strong>
                    <p>Tytuł został zapisany, ale strona nie ma jeszcze treści.</p>
                </div>
            )}

            {dialog === "edit" && <PageEditDialog page={page} onSave={onUpdate} onClose={() => setDialog(null)} />}
            {dialog === "move" && <PageMoveDialog page={page} folders={folders} onMove={onMove} onClose={() => setDialog(null)} />}
            {dialog === "delete" && <PageDeleteDialog pageTitle={page.title} onDelete={onDelete} onClose={() => setDialog(null)} />}
        </article>
    );
}
