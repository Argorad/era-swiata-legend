import { useState } from "react";
import type { Folder } from "../types/Folder";
import FolderActions from "./FolderActions";

interface Props {
    folder: Folder;
    onRenameFolder: (
        folderId: string,
        name: string,
    ) => Promise<void>;
}

export default function FolderItem({
    folder,
    onRenameFolder,
}: Props) {
    const [isRenaming, setIsRenaming] = useState(false);
    const [name, setName] = useState(folder.name);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isArchive = folder.type === 1;
    const isTrash = folder.type === 2;
    const isSystemFolder = isArchive || isTrash;

    const icon = isArchive
        ? "📦"
        : isTrash
          ? "🗑️"
          : "📁";

    const handleStartRename = () => {
        if (isSystemFolder) {
            return;
        }

        setName(folder.name);
        setError(null);
        setIsRenaming(true);
    };

    const handleCancel = () => {
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

        try {
            setIsSaving(true);
            setError(null);

            await onRenameFolder(
                folder.id,
                trimmedName,
            );

            setIsRenaming(false);
        } catch {
            setError("Nie udało się zmienić nazwy folderu.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleKeyDown = (
        event: React.KeyboardEvent<HTMLInputElement>,
    ) => {
        if (event.key === "Enter") {
            event.preventDefault();
            void handleSave();
        }

        if (event.key === "Escape") {
            handleCancel();
        }
    };

    return (
        <li
            style={{
                padding: "12px 14px",
                marginBottom: "8px",
                border: "1px solid #ccc",
                borderRadius: "8px",
                background: isSystemFolder
                    ? "#f7f7f7"
                    : "white",
            }}
        >
            {isRenaming ? (
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "8px",
                    }}
                >
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
                                setName(event.target.value)
                            }
                            onKeyDown={handleKeyDown}
                            autoFocus
                            disabled={isSaving}
                            style={{
                                flex: 1,
                                minWidth: 0,
                                padding: "10px",
                                border: "1px solid #bbb",
                                borderRadius: "6px",
                            }}
                        />

                        <button
                            type="button"
                            onClick={() => void handleSave()}
                            disabled={isSaving}
                        >
                            {isSaving ? "..." : "💾"}
                        </button>

                        <button
                            type="button"
                            onClick={handleCancel}
                            disabled={isSaving}
                        >
                            ❌
                        </button>
                    </div>

                    {error && (
                        <p
                            style={{
                                margin: 0,
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
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: "12px",
                    }}
                >
                    <span
                        style={{
                            minWidth: 0,
                            overflowWrap: "anywhere",
                            fontWeight: isSystemFolder
                                ? 600
                                : 400,
                        }}
                    >
                        {icon} {folder.name}
                    </span>

                    {!isSystemFolder && (
                        <FolderActions
                            onRename={handleStartRename}
                        />
                    )}
                </div>
            )}
        </li>
    );
}