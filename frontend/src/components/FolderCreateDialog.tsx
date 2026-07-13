import { useEffect, useState } from "react";
import type { Folder } from "../types/Folder";

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
        <div
            role="presentation"
            onMouseDown={(event) => {
                if (
                    event.target === event.currentTarget &&
                    !isSaving
                ) {
                    onClose();
                }
            }}
            style={{
                position: "fixed",
                inset: 0,
                zIndex: 100,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "20px",
                background: "rgba(0, 0, 0, 0.45)",
            }}
        >
            <form
                role="dialog"
                aria-modal="true"
                aria-labelledby="create-folder-title"
                onSubmit={handleSubmit}
                style={{
                    width: "100%",
                    maxWidth: "500px",
                    padding: "24px",
                    borderRadius: "12px",
                    background: "white",
                    boxShadow:
                        "0 20px 60px rgba(0, 0, 0, 0.3)",
                }}
            >
                <h3
                    id="create-folder-title"
                    style={{ margin: "0 0 8px" }}
                >
                    {parentFolder
                        ? "Nowy podfolder"
                        : "Nowy folder"}
                </h3>

                {parentFolder && (
                    <p
                        style={{
                            margin: "0 0 20px",
                            color: "#555",
                        }}
                    >
                        Folder nadrzędny:{" "}
                        <strong>{parentFolder.name}</strong>
                    </p>
                )}

                <label
                    htmlFor="new-folder-name"
                    style={{
                        display: "block",
                        marginBottom: "8px",
                        fontWeight: 600,
                    }}
                >
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
                    style={{
                        width: "100%",
                        padding: "11px",
                        marginBottom: "16px",
                        border: "1px solid #bbb",
                        borderRadius: "6px",
                    }}
                />

                <label
                    htmlFor="new-folder-parent"
                    style={{
                        display: "block",
                        marginBottom: "8px",
                        fontWeight: 600,
                    }}
                >
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
                    style={{
                        width: "100%",
                        padding: "11px",
                        marginBottom: "16px",
                        border: "1px solid #bbb",
                        borderRadius: "6px",
                    }}
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
                        style={{
                            margin: "0 0 16px",
                            color: "#b00020",
                        }}
                    >
                        {error}
                    </p>
                )}

                <div
                    style={{
                        display: "flex",
                        justifyContent: "flex-end",
                        gap: "8px",
                    }}
                >
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSaving}
                    >
                        Anuluj
                    </button>

                    <button
                        type="submit"
                        disabled={isSaving}
                    >
                        {isSaving
                            ? "Zapisywanie..."
                            : "Utwórz"}
                    </button>
                </div>
            </form>
        </div>
    );
}