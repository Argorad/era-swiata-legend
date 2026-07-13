import { useEffect, useState } from "react";
import type { Folder } from "../types/Folder";
import ModalPortal from "./ModalPortal";

interface Props {
    folders: Folder[];
    initialParentFolderId: string | null;
    onCreate: (
        name: string,
        parentFolderId: string | null,
    ) => Promise<Folder>;
    onCreated: (folder: Folder) => void;
    onClose: () => void;
}

interface FolderOption {
    folder: Folder;
    level: number;
}

function buildFolderOptions(
    folders: Folder[],
): FolderOption[] {
    const result: FolderOption[] = [];

    const appendChildren = (
        parentFolderId: string | null,
        level: number,
    ) => {
        const children = folders
            .filter(
                (folder) =>
                    folder.parentFolderId ===
                    parentFolderId,
            )
            .sort((left, right) => {
                if (left.type !== right.type) {
                    return left.type - right.type;
                }

                return left.name.localeCompare(
                    right.name,
                    "pl",
                );
            });

        for (const child of children) {
            result.push({ folder: child, level });
            appendChildren(child.id, level + 1);
        }
    };

    appendChildren(null, 0);

    return result;
}

export default function FolderCreateDialog({
    folders,
    initialParentFolderId,
    onCreate,
    onCreated,
    onClose,
}: Props) {
    const [name, setName] = useState("");
    const [parentFolderId, setParentFolderId] =
        useState(initialParentFolderId ?? "");
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const folderOptions = buildFolderOptions(folders);
    const parentFolder = folders.find(
        (folder) => folder.id === initialParentFolderId,
    );

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape" && !isSaving) {
                onClose();
            }
        };

        window.addEventListener("keydown", handleKeyDown);

        return () =>
            window.removeEventListener(
                "keydown",
                handleKeyDown,
            );
    }, [isSaving, onClose]);

    const handleSubmit = async (
        event: React.FormEvent<HTMLFormElement>,
    ) => {
        event.preventDefault();

        const trimmedName = name.trim();

        if (!trimmedName) {
            setError("Podaj nazwę folderu.");
            return;
        }

        try {
            setIsSaving(true);
            setError(null);

            const createdFolder = await onCreate(
                trimmedName,
                parentFolderId || null,
            );

            onCreated(createdFolder);
        } catch {
            setError("Nie udało się utworzyć folderu.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <ModalPortal>
            <div
                className="fantasy-dialog-backdrop"
                role="presentation"
                onMouseDown={(event) => {
                    if (
                        event.target === event.currentTarget &&
                        !isSaving
                    ) {
                        onClose();
                    }
                }}
            >
                <form
                    className="fantasy-dialog"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="create-folder-title"
                    onSubmit={handleSubmit}
                >
                    <div className="fantasy-dialog-ornament">
                        <span>◆</span>
                    </div>

                <span className="fantasy-dialog-kicker">
                    Nowy rozdział
                </span>

                <h3 id="create-folder-title">
                    {parentFolder
                        ? "Nowy podfolder"
                        : "Nowy folder"}
                </h3>

                {parentFolder && (
                    <p className="fantasy-dialog-description">
                        Folder nadrzędny:{" "}
                        <strong>{parentFolder.name}</strong>
                    </p>
                )}

                <label htmlFor="new-folder-name">
                    Nazwa folderu
                </label>

                <input
                    id="new-folder-name"
                    type="text"
                    value={name}
                    onChange={(event) => {
                        setName(event.target.value);
                        setError(null);
                    }}
                    placeholder="Np. Miasta"
                    autoFocus
                    disabled={isSaving}
                />

                <label htmlFor="new-folder-parent">
                    Utwórz w
                </label>

                <select
                    id="new-folder-parent"
                    value={parentFolderId}
                    onChange={(event) => {
                        setParentFolderId(event.target.value);
                        setError(null);
                    }}
                    disabled={isSaving}
                >
                    <option value="">
                        🌍 Główny poziom świata
                    </option>

                    {folderOptions.map(
                        ({ folder, level }) => {
                            const icon =
                                folder.type === 1
                                    ? "📦"
                                    : folder.type === 2
                                      ? "🗑️"
                                      : "📁";

                            return (
                                <option
                                    key={folder.id}
                                    value={folder.id}
                                >
                                    {"　".repeat(level)}
                                    {icon} {folder.name}
                                </option>
                            );
                        },
                    )}
                </select>

                {error && (
                    <p
                        className="fantasy-dialog-error"
                        role="alert"
                    >
                        {error}
                    </p>
                )}

                <div className="fantasy-dialog-actions">
                    <button
                        type="button"
                        className="fantasy-button fantasy-button--ghost"
                        onClick={onClose}
                        disabled={isSaving}
                    >
                        Anuluj
                    </button>

                    <button
                        type="submit"
                        className="fantasy-button fantasy-button--primary"
                        disabled={isSaving}
                    >
                        {isSaving
                            ? "Zapisywanie..."
                            : "Utwórz"}
                    </button>
                </div>
                </form>
            </div>
        </ModalPortal>
    );
}
