import { useState } from "react";
import type { Folder } from "../types/Folder";
import type { Page } from "../types/Page";
import PageCreateDialog from "./PageCreateDialog";
import PageReader from "./PageReader";
import FileLibrary from "./FileLibrary";
import "./PageManagement.css";

interface Props {
    worldName: string | null;
    worldId: string | null;
    folder: Folder | null;
    folders: Folder[];
    pages: Page[];
    selectedPage: Page | null;
    isPagesLoading: boolean;
    pagesError: string | null;
    onSelectFolder: (folderId: string) => void;
    onSelectPage: (pageId: string) => void;
    onBackToFolder: () => void;
    onCreatePage: (
        title: string,
        content: string,
    ) => Promise<Page>;
    onReloadPages: () => void;
    onUpdatePage: (title: string, content: string) => Promise<void>;
    onMovePage: (folderId: string) => Promise<void>;
    onArchivePage: () => Promise<void>;
    onTrashPage: () => Promise<void>;
    onRestorePage: () => Promise<void>;
    onDeletePage: () => Promise<void>;
}

function getFolderPath(
    folder: Folder,
    folders: Folder[],
): Folder[] {
    const path: Folder[] = [];
    const visitedIds = new Set<string>();
    let currentFolder: Folder | undefined = folder;

    while (
        currentFolder &&
        !visitedIds.has(currentFolder.id)
    ) {
        path.unshift(currentFolder);
        visitedIds.add(currentFolder.id);

        currentFolder = currentFolder.parentFolderId
            ? folders.find(
                  (item) =>
                      item.id ===
                      currentFolder?.parentFolderId,
              )
            : undefined;
    }

    return path;
}

function getFolderIcon(folder: Folder): string {
    if (folder.type === 1) {
        return "▣";
    }

    if (folder.type === 2) {
        return "⌫";
    }

    return "◆";
}

function getPagesLabel(count: number): string {
    if (count === 1) {
        return "1 strona";
    }

    if (count > 1 && count < 5) {
        return `${count} strony`;
    }

    return `${count} stron`;
}

function getFoldersLabel(count: number): string {
    if (count === 1) {
        return "1 podfolder";
    }

    if (count > 1 && count < 5) {
        return `${count} podfoldery`;
    }

    return `${count} podfolderów`;
}

function getPageExcerpt(content: string): string {
    const normalizedContent = content
        .replace(/\s+/g, " ")
        .trim();

    if (!normalizedContent) {
        return "Strona nie ma jeszcze treści.";
    }

    if (normalizedContent.length <= 150) {
        return normalizedContent;
    }

    return `${normalizedContent.slice(0, 147)}...`;
}

export default function FolderContent({
    worldName,
    worldId,
    folder,
    folders,
    pages,
    selectedPage,
    isPagesLoading,
    pagesError,
    onSelectFolder,
    onSelectPage,
    onBackToFolder,
    onCreatePage,
    onReloadPages,
    onUpdatePage,
    onMovePage,
    onArchivePage,
    onTrashPage,
    onRestorePage,
    onDeletePage,
}: Props) {
    const [isCreatingPage, setIsCreatingPage] =
        useState(false);

    if (!worldName) {
        return (
            <section className="content-surface content-empty-state">
                <div className="empty-state-rune">✦</div>

                <span className="content-eyebrow">
                    Początek podróży
                </span>

                <h2>Wybierz świat</h2>

                <p>
                    Otwórz kronikę świata z panelu po lewej,
                    aby zobaczyć jego foldery i zapisane strony.
                </p>
            </section>
        );
    }

    if (!folder) {
        return (
            <section className="content-surface content-empty-state">
                <div className="empty-state-rune">⌘</div>

                <span className="content-eyebrow">
                    Biblioteka świata
                </span>

                <h2>Wybierz folder</h2>

                <p>
                    Wybierz dział kroniki z drzewa nawigacji.
                    Zobaczysz tutaj jego podfoldery i strony.
                </p>
            </section>
        );
    }

    if (selectedPage) {
        return (
            <PageReader
                worldName={worldName}
                folder={folder}
                folders={folders}
                page={selectedPage}
                onBack={onBackToFolder}
                onUpdate={onUpdatePage}
                onMove={onMovePage}
                onArchive={onArchivePage}
                onTrash={onTrashPage}
                onRestore={onRestorePage}
                onDelete={onDeletePage}
            />
        );
    }

    const path = getFolderPath(folder, folders);

    const childFolders = folders
        .filter(
            (item) =>
                item.parentFolderId === folder.id,
        )
        .sort((left, right) =>
            left.name.localeCompare(right.name, "pl"),
        );

    return (
        <section className="content-surface folder-content">
            <nav
                className="folder-breadcrumbs"
                aria-label="Ścieżka folderu"
            >
                <span className="breadcrumb-world">
                    {worldName}
                </span>

                {path.map((pathFolder) => (
                    <span
                        key={pathFolder.id}
                        className="breadcrumb-part"
                    >
                        <span className="breadcrumb-separator">
                            ›
                        </span>

                        <button
                            type="button"
                            onClick={() =>
                                onSelectFolder(
                                    pathFolder.id,
                                )
                            }
                        >
                            {pathFolder.name}
                        </button>
                    </span>
                ))}
            </nav>

            <header className="folder-content-header">
                <div className="folder-title-icon">
                    <span>{getFolderIcon(folder)}</span>
                </div>

                <div className="folder-title-copy">
                    <span className="content-eyebrow">
                        Kronika świata
                    </span>

                    <h1>{folder.name}</h1>

                    <div className="folder-content-summary">
                        <span>
                            {getFoldersLabel(
                                childFolders.length,
                            )}
                        </span>
                        <span aria-hidden="true">◆</span>
                        <span>
                            {isPagesLoading
                                ? "Wczytywanie stron..."
                                : getPagesLabel(
                                      pages.length,
                                  )}
                        </span>
                    </div>
                </div>
            </header>

            <div className="ornament-divider">
                <span>◆</span>
            </div>

            <section className="content-section content-section--folders">
                <div className="content-section-bar">
                    <div className="content-section-heading">
                        <span>Rozdziały</span>
                        <h2>Podfoldery</h2>
                    </div>

                    <span className="content-count-badge">
                        {childFolders.length}
                    </span>
                </div>

                {childFolders.length > 0 ? (
                    <div className="subfolder-grid">
                        {childFolders.map((childFolder) => (
                            <button
                                key={childFolder.id}
                                type="button"
                                className="subfolder-card"
                                onClick={() =>
                                    onSelectFolder(
                                        childFolder.id,
                                    )
                                }
                            >
                                <span className="subfolder-card-icon">
                                    {getFolderIcon(
                                        childFolder,
                                    )}
                                </span>

                                <span>
                                    {childFolder.name}
                                </span>

                                <span className="subfolder-card-arrow">
                                    ›
                                </span>
                            </button>
                        ))}
                    </div>
                ) : (
                    <div className="section-empty-state section-empty-state--compact">
                        <span aria-hidden="true">◇</span>
                        <div>
                            <strong>Brak podfolderów</strong>
                            <p>
                                Ten folder nie ma zagnieżdżonych
                                działów.
                            </p>
                        </div>
                    </div>
                )}
            </section>

            <section className="content-section content-section--pages">
                <div className="content-section-bar">
                    <div className="content-section-heading">
                        <span>Zapisy</span>
                        <h2>Strony</h2>
                    </div>

                    <div className="page-section-actions">
                        <span className="content-count-badge">
                            {isPagesLoading
                                ? "…"
                                : pages.length}
                        </span>

                        {folder.type === 0 && <button
                            type="button"
                            className="page-add-button"
                            onClick={() =>
                                setIsCreatingPage(true)
                            }
                        >
                            <span aria-hidden="true">＋</span>
                            Dodaj stronę
                        </button>}
                    </div>
                </div>

                {isPagesLoading ? (
                    <div
                        className="pages-status-state"
                        aria-live="polite"
                    >
                        <span aria-hidden="true">◇</span>
                        <strong>Wczytywanie stron</strong>
                        <p>
                            Otwieramy zapisy tego działu kroniki.
                        </p>
                    </div>
                ) : pagesError ? (
                    <div
                        className="pages-status-state pages-status-state--error"
                        role="alert"
                    >
                        <span aria-hidden="true">!</span>
                        <strong>Nie udało się wczytać stron</strong>
                        <p>{pagesError}</p>
                        <button
                            type="button"
                            onClick={onReloadPages}
                        >
                            Spróbuj ponownie
                        </button>
                    </div>
                ) : pages.length > 0 ? (
                    <div className="page-list">
                        {pages.map((page) => (
                            <button
                                key={page.id}
                                type="button"
                                className="page-card"
                                onClick={() =>
                                    onSelectPage(page.id)
                                }
                            >
                                <span className="page-card-icon">
                                    <span>◇</span>
                                </span>
                                <span className="page-card-copy">
                                    <strong>{page.title}</strong>
                                    <small>
                                        {getPageExcerpt(
                                            page.content,
                                        )}
                                    </small>
                                </span>
                                <span className="page-card-arrow">
                                    Czytaj ›
                                </span>
                            </button>
                        ))}
                    </div>
                ) : (
                    <div className="pages-status-state">
                        <span aria-hidden="true">◇</span>
                        <strong>
                            {folder.type === 0
                                ? "Ten rozdział czeka na zapis"
                                : folder.type === 1
                                  ? "Archiwum stron jest puste"
                                  : "Kosz stron jest pusty"}
                        </strong>
                        <p>
                            {folder.type === 0
                                ? "Dodaj pierwszą stronę, aby utrwalić historię, miejsce lub postać z tego folderu."
                                : "Nie ma tutaj stron oczekujących na przywrócenie."}
                        </p>
                        {folder.type === 0 && (
                            <button
                                type="button"
                                onClick={() =>
                                    setIsCreatingPage(true)
                                }
                            >
                                Dodaj pierwszą stronę
                            </button>
                        )}
                    </div>
                )}
            </section>

            {worldId && (
                <FileLibrary
                    worldId={worldId}
                    folder={folder}
                />
            )}

            {isCreatingPage && (
                <PageCreateDialog
                    folderName={folder.name}
                    onCreate={onCreatePage}
                    onClose={() =>
                        setIsCreatingPage(false)
                    }
                />
            )}
        </section>
    );
}
