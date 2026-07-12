import { useState } from "react";
import type { Folder } from "../types/Folder";
import FolderTreeNode from "./FolderTreeNode";

interface Props {
    folders: Folder[];
    worldName: string | null;
    onCreateFolder: (
        name: string,
        parentFolderId: string | null,
    ) => Promise<void>;
    onRenameFolder: (
        folderId: string,
        name: string,
    ) => Promise<void>;
    onMoveFolder: (
        folderId: string,
        destinationFolderId: string | null,
    ) => Promise<void>;
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
            result.push({
                folder: child,
                level,
            });

            appendChildren(child.id, level + 1);
        }
    };

    appendChildren(null, 0);

    return result;
}

export default function FolderList({
    folders,
    worldName,
    onCreateFolder,
    onRenameFolder,
    onMoveFolder,
}: Props) {
    const [isCreating, setIsCreating] = useState(false);
    const [folderName, setFolderName] = useState("");
    const [parentFolderId, setParentFolderId] =
        useState<string>("");
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const rootFolders = folders
        .filter(
            (folder) =>
                folder.parentFolderId === null,
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

    const folderOptions = buildFolderOptions(folders);

    const handleSubmit = async (
        event: React.FormEvent<HTMLFormElement>,
    ) => {
        event.preventDefault();

        const trimmedName = folderName.trim();

        if (!trimmedName) {
            setError("Podaj nazwę folderu.");
            return;
        }

        try {
            setIsSaving(true);
            setError(null);

            await onCreateFolder(
                trimmedName,
                parentFolderId || null,
            );

            setFolderName("");
            setParentFolderId("");
            setIsCreating(false);
        } catch {
            setError(
                "Nie udało się utworzyć folderu.",
            );
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        setFolderName("");
        setParentFolderId("");
        setError(null);
        setIsCreating(false);
    };

    return (
        <section>
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "16px",
                    marginBottom: "16px",
                }}
            >
                <div>
                    <h2 style={{ margin: 0 }}>
                        Foldery
                    </h2>

                    {worldName && (
                        <p
                            style={{
                                margin: "4px 0 0",
                                color: "#666",
                            }}
                        >
                            Świat: {worldName}
                        </p>
                    )}
                </div>

                <button
                    type="button"
                    disabled={!worldName || isCreating}
                    onClick={() => setIsCreating(true)}
                    style={{
                        padding: "10px 14px",
                        cursor:
                            worldName && !isCreating
                                ? "pointer"
                                : "not-allowed",
                    }}
                >
                    ➕ Nowy folder
                </button>
            </div>

            {isCreating && (
                <form
                    onSubmit={handleSubmit}
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "12px",
                        padding: "16px",
                        marginBottom: "16px",
                        border: "1px solid #ccc",
                        borderRadius: "8px",
                        background: "#fafafa",
                    }}
                >
                    <div>
                        <label
                            htmlFor="folder-name"
                            style={{
                                display: "block",
                                marginBottom: "6px",
                            }}
                        >
                            Nazwa folderu
                        </label>

                        <input
                            id="folder-name"
                            type="text"
                            value={folderName}
                            onChange={(event) =>
                                setFolderName(
                                    event.target.value,
                                )
                            }
                            placeholder="Np. Miasta"
                            autoFocus
                            disabled={isSaving}
                            style={{
                                width: "100%",
                                padding: "10px",
                                border:
                                    "1px solid #bbb",
                                borderRadius: "6px",
                                boxSizing:
                                    "border-box",
                            }}
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="parent-folder"
                            style={{
                                display: "block",
                                marginBottom: "6px",
                            }}
                        >
                            Utwórz w
                        </label>

                        <select
                            id="parent-folder"
                            value={parentFolderId}
                            onChange={(event) =>
                                setParentFolderId(
                                    event.target.value,
                                )
                            }
                            disabled={isSaving}
                            style={{
                                width: "100%",
                                padding: "10px",
                                border:
                                    "1px solid #bbb",
                                borderRadius: "6px",
                            }}
                        >
                            <option value="">
                                🌍 Główny poziom świata
                            </option>

                            {folderOptions.map(
                                ({
                                    folder,
                                    level,
                                }) => {
                                    const icon =
                                        folder.type === 1
                                            ? "📦"
                                            : folder.type ===
                                                2
                                              ? "🗑️"
                                              : "📁";

                                    return (
                                        <option
                                            key={
                                                folder.id
                                            }
                                            value={
                                                folder.id
                                            }
                                        >
                                            {"　".repeat(
                                                level,
                                            )}
                                            {icon}{" "}
                                            {folder.name}
                                        </option>
                                    );
                                },
                            )}
                        </select>
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

                    <div
                        style={{
                            display: "flex",
                            gap: "8px",
                        }}
                    >
                        <button
                            type="submit"
                            disabled={isSaving}
                        >
                            {isSaving
                                ? "Zapisywanie..."
                                : "Utwórz"}
                        </button>

                        <button
                            type="button"
                            onClick={handleCancel}
                            disabled={isSaving}
                        >
                            Anuluj
                        </button>
                    </div>
                </form>
            )}

            {!worldName ? (
                <p style={{ color: "#666" }}>
                    Wybierz świat z listy po lewej stronie.
                </p>
            ) : rootFolders.length === 0 ? (
                <p style={{ color: "#666" }}>
                    Ten świat nie ma jeszcze folderów.
                </p>
            ) : (
                <ul
                    style={{
                        listStyle: "none",
                        padding: 0,
                        margin: 0,
                    }}
                >
                    {rootFolders.map((folder) => (
                        <FolderTreeNode
                            key={folder.id}
                            folder={folder}
                            folders={folders}
                            level={0}
                            onRenameFolder={
                                onRenameFolder
                            }
                            onMoveFolder={
                                onMoveFolder
                            }
                        />
                    ))}
                </ul>
            )}
        </section>
    );
}