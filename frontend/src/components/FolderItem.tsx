import { useState } from "react";
import type { Folder } from "../types/Folder";
import FolderActions from "./FolderActions";
import MoveFolderDialog from "./MoveFolderDialog";

interface Props {
    folder: Folder;
    folders: Folder[];
    onRenameFolder: (
        folderId: string,
        name: string,
    ) => Promise<void>;
    onMoveFolder: (
        folderId: string,
        destinationFolderId: string | null,
    ) => Promise<void>;
}

export default function FolderItem({
    folder,
    folders,
    onRenameFolder,
    onMoveFolder,
}: Props) {
    const [isRenaming, setIsRenaming] = useState(false);
    const [isMoving, setIsMoving] = useState(false);
    const [name, setName] = useState(folder.name);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isSystemFolder =
        folder.type === 1 || folder.type === 2;

    const archiveFolder = folders.find(
        (item) => item.type === 1,
    );

    const trashFolder = folders.find(
        (item) => item.type === 2,
    );

    const icon =
        folder.type === 1
            ? "📦"
            : folder.type === 2
              ? "🗑️"
              : "📁";

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
            setError("Nazwa folderu jest wymagana.");
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
        if (!archiveFolder) {
            return;
        }

        if (folder.parentFolderId === archiveFolder.id) {
            return;
        }

        await onMoveFolder(
            folder.id,
            archiveFolder.id,
        );
    };

    const moveToTrash = async () => {
        if (!trashFolder) {
            return;
        }

        if (folder.parentFolderId === trashFolder.id) {
            return;
        }

        const confirmed = window.confirm(
            `Przenieść folder „${folder.name}” wraz z całą zawartością do kosza?`,
        );

        if (!confirmed) {
            return;
        }

        await onMoveFolder(
            folder.id,
            trashFolder.id,
        );
    };

    return (
        <>
            <div
                style={{
                    minHeight: "50px",
                    display: "flex",
                    alignItems: "center",
                    padding: "6px 10px",
                    marginBottom: "6px",
                    border: "1px solid #d5d5d5",
                    borderRadius: "7px",
                    background: "white",
                    boxSizing: "border-box",
                }}
            >
                {isRenaming ? (
                    <div style={{ width: "100%" }}>
                        <div
                            style={{
                                display: "flex",
                                gap: "8px",
                            }}
                        >
                            <input
                                type="text"
                                value={name}
                                onChange={(event) =>
                                    setName(
                                        event.target.value,
                                    )
                                }
                                onKeyDown={(event) => {
                                    if (
                                        event.key === "Enter"
                                    ) {
                                        event.preventDefault();
                                        void handleSave();
                                    }

                                    if (
                                        event.key === "Escape"
                                    ) {
                                        handleCancelRename();
                                    }
                                }}
                                autoFocus
                                disabled={isSaving}
                                style={{
                                    flex: 1,
                                    minWidth: 0,
                                    padding: "9px",
                                    border:
                                        "1px solid #bbb",
                                    borderRadius: "6px",
                                }}
                            />

                            <button
                                type="button"
                                onClick={() =>
                                    void handleSave()
                                }
                                disabled={isSaving}
                            >
                                {isSaving ? "..." : "💾"}
                            </button>

                            <button
                                type="button"
                                onClick={handleCancelRename}
                                disabled={isSaving}
                            >
                                ❌
                            </button>
                        </div>

                        {error && (
                            <p
                                style={{
                                    margin: "8px 0 0",
                                    color: "#b00020",
                                }}
                            >
                                {error}
                            </p>
                        )}
                    </div>
                ) : (
                    <div
                        style={{
                            width: "100%",
                            display: "flex",
                            justifyContent:
                                "space-between",
                            alignItems: "center",
                            gap: "12px",
                        }}
                    >
                        <span
                            style={{
                                minWidth: 0,
                                overflowWrap: "anywhere",
                            }}
                        >
                            {icon} {folder.name}
                        </span>

                        {!isSystemFolder && (
                            <FolderActions
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
                    </div>
                )}
            </div>

            {isMoving && (
                <MoveFolderDialog
                    folder={folder}
                    folders={folders}
                    onMove={onMoveFolder}
                    onClose={() => setIsMoving(false)}
                />
            )}
        </>
    );
}