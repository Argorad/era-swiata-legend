import { useState } from "react";
import type { Folder } from "../types/Folder";
import FolderActions from "./FolderActions";
import MoveFolderDialog from "./MoveFolderDialog";

interface Props {
    folder: Folder;
    folders: Folder[];
    isSelected: boolean;
    onSelectFolder: (folderId: string) => void;
    onCreateSubfolder: (
        parentFolderId: string,
    ) => void;
    onRenameFolder: (
        folderId: string,
        name: string,
    ) => Promise<void>;
    onMoveFolder: (
        folderId: string,
        destinationFolderId: string | null,
    ) => Promise<void>;
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

export default function FolderItem({
    folder,
    folders,
    isSelected,
    onSelectFolder,
    onCreateSubfolder,
    onRenameFolder,
    onMoveFolder,
}: Props) {
    const [isRenaming, setIsRenaming] =
        useState(false);
    const [isMoving, setIsMoving] =
        useState(false);
    const [name, setName] =
        useState(folder.name);
    const [isSaving, setIsSaving] =
        useState(false);
    const [error, setError] =
        useState<string | null>(null);

    const isSystemFolder =
        folder.type === 1 || folder.type === 2;

    const archiveFolder = folders.find(
        (item) => item.type === 1,
    );

    const trashFolder = folders.find(
        (item) => item.type === 2,
    );

    const handleStartRename = () => {
        setName(folder.name);
        setError(null);
        setIsRenaming(true);
    };

    const handleCancelRename = () => {
        setName(folder.name);
        setError(null);
        setIsRenaming(false);
    };

    const handleSave = async () => {
        const trimmedName = name.trim();

        if (!trimmedName) {
            setError(
                "Nazwa folderu jest wymagana.",
            );
            return;
        }

        if (trimmedName === folder.name) {
            setIsRenaming(false);
            return;
        }

        try {
            setIsSaving(true);
            setError(null);

            await onRenameFolder(
                folder.id,
                trimmedName,
            );

            setIsRenaming(false);
        } catch {
            setError(
                "Nie udało się zmienić nazwy folderu.",
            );
        } finally {
            setIsSaving(false);
        }
    };

    const moveToArchive = async () => {
        if (
            !archiveFolder ||
            folder.parentFolderId ===
                archiveFolder.id
        ) {
            return;
        }

        await onMoveFolder(
            folder.id,
            archiveFolder.id,
        );
    };

    const moveToTrash = async () => {
        if (
            !trashFolder ||
            folder.parentFolderId ===
                trashFolder.id
        ) {
            return;
        }

        const confirmed = window.confirm(
            `Przenieść folder „${folder.name}” wraz z całą zawartością do kosza?`,
        );

        if (confirmed) {
            await onMoveFolder(
                folder.id,
                trashFolder.id,
            );
        }
    };

    const rowClassName = [
        "folder-row",
        isSelected
            ? "folder-row--selected"
            : "",
        isSystemFolder
            ? "folder-row--system"
            : "",
    ]
        .filter(Boolean)
        .join(" ");

    return (
        <>
            <div className={rowClassName}>
                {isRenaming ? (
                    <div className="folder-rename">
                        <div className="folder-rename-controls">
                            <input
                                type="text"
                                value={name}
                                onChange={(event) =>
                                    setName(
                                        event.target
                                            .value,
                                    )
                                }
                                onKeyDown={(
                                    event,
                                ) => {
                                    if (
                                        event.key ===
                                        "Enter"
                                    ) {
                                        event.preventDefault();
                                        void handleSave();
                                    }

                                    if (
                                        event.key ===
                                        "Escape"
                                    ) {
                                        handleCancelRename();
                                    }
                                }}
                                autoFocus
                                disabled={isSaving}
                            />

                            <button
                                type="button"
                                onClick={() =>
                                    void handleSave()
                                }
                                disabled={isSaving}
                                aria-label="Zapisz nazwę"
                            >
                                {isSaving
                                    ? "…"
                                    : "✓"}
                            </button>

                            <button
                                type="button"
                                onClick={
                                    handleCancelRename
                                }
                                disabled={isSaving}
                                aria-label="Anuluj zmianę nazwy"
                            >
                                ×
                            </button>
                        </div>

                        {error && (
                            <p className="folder-inline-error">
                                {error}
                            </p>
                        )}
                    </div>
                ) : (
                    <>
                        <button
                            type="button"
                            className="folder-name-button"
                            onClick={() =>
                                onSelectFolder(
                                    folder.id,
                                )
                            }
                        >
                            <span className="folder-name-icon">
                                {getFolderIcon(
                                    folder,
                                )}
                            </span>

                            <span>
                                {folder.name}
                            </span>
                        </button>

                        {!isSystemFolder && (
                            <FolderActions
                                onCreateSubfolder={() =>
                                    onCreateSubfolder(
                                        folder.id,
                                    )
                                }
                                onRename={
                                    handleStartRename
                                }
                                onMove={() =>
                                    setIsMoving(true)
                                }
                                onArchive={() =>
                                    void moveToArchive()
                                }
                                onTrash={() =>
                                    void moveToTrash()
                                }
                            />
                        )}
                    </>
                )}
            </div>

            {isMoving && (
                <MoveFolderDialog
                    folder={folder}
                    folders={folders}
                    onMove={onMoveFolder}
                    onClose={() =>
                        setIsMoving(false)
                    }
                />
            )}
        </>
    );
}