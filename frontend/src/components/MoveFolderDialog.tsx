import { useState } from "react";
import type { Folder } from "../types/Folder";

interface Props {
    folder: Folder;
    folders: Folder[];
    onMove: (
        folderId: string,
        destinationFolderId: string | null,
    ) => Promise<void>;
    onClose: () => void;
}

interface FolderOption {
    folder: Folder;
    level: number;
}

function getDescendantIds(
    folderId: string,
    folders: Folder[],
): Set<string> {
    const descendantIds = new Set<string>();

    const collectChildren = (parentId: string) => {
        const children = folders.filter(
            (item) => item.parentFolderId === parentId,
        );

        for (const child of children) {
            descendantIds.add(child.id);
            collectChildren(child.id);
        }
    };

    collectChildren(folderId);

    return descendantIds;
}

function buildFolderOptions(
    folders: Folder[],
    excludedIds: Set<string>,
): FolderOption[] {
    const result: FolderOption[] = [];

    const appendChildren = (
        parentFolderId: string | null,
        level: number,
    ) => {
        const children = folders
            .filter(
                (item) =>
                    item.parentFolderId ===
                        parentFolderId &&
                    !excludedIds.has(item.id),
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

export default function MoveFolderDialog({
    folder,
    folders,
    onMove,
    onClose,
}: Props) {
    const [destinationId, setDestinationId] =
        useState<string>(
            folder.parentFolderId ?? "",
        );

    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const excludedIds = getDescendantIds(
        folder.id,
        folders,
    );

    excludedIds.add(folder.id);

    const folderOptions = buildFolderOptions(
        folders,
        excludedIds,
    );

    const destinationHasChanged =
        destinationId !==
        (folder.parentFolderId ?? "");

    const handleSubmit = async (
        event: React.FormEvent<HTMLFormElement>,
    ) => {
        event.preventDefault();

        if (!destinationHasChanged) {
            setError(
                "Folder znajduje się już w wybranym miejscu.",
            );
            return;
        }

        try {
            setIsSaving(true);
            setError(null);

            await onMove(
                folder.id,
                destinationId || null,
            );

            onClose();
        } catch {
            setError(
                "Nie udało się przenieść folderu.",
            );
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div
            role="presentation"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) {
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
                onSubmit={handleSubmit}
                style={{
                    width: "100%",
                    maxWidth: "480px",
                    padding: "24px",
                    borderRadius: "12px",
                    background: "white",
                    boxShadow:
                        "0 20px 60px rgba(0, 0, 0, 0.3)",
                }}
            >
                <h3 style={{ margin: "0 0 8px" }}>
                    Przenieś folder
                </h3>

                <p
                    style={{
                        margin: "0 0 20px",
                        color: "#555",
                    }}
                >
                    Folder: <strong>{folder.name}</strong>
                </p>

                <label
                    htmlFor="destination-folder"
                    style={{
                        display: "block",
                        marginBottom: "8px",
                        fontWeight: 600,
                    }}
                >
                    Miejsce docelowe
                </label>

                <select
                    id="destination-folder"
                    value={destinationId}
                    onChange={(event) => {
                        setDestinationId(
                            event.target.value,
                        );
                        setError(null);
                    }}
                    disabled={isSaving}
                    style={{
                        width: "100%",
                        padding: "11px",
                        marginBottom: "12px",
                        border: "1px solid #bbb",
                        borderRadius: "6px",
                    }}
                >
                    <option value="">
                        🌍 Główny poziom świata
                    </option>

                    {folderOptions.map(
                        ({ folder: option, level }) => {
                            const icon =
                                option.type === 1
                                    ? "📦"
                                    : option.type === 2
                                      ? "🗑️"
                                      : "📁";

                            const indentation =
                                "　".repeat(level);

                            return (
                                <option
                                    key={option.id}
                                    value={option.id}
                                >
                                    {indentation}
                                    {icon} {option.name}
                                </option>
                            );
                        },
                    )}
                </select>

                <p
                    style={{
                        margin: "0 0 16px",
                        color: "#777",
                        fontSize: "13px",
                    }}
                >
                    Folder oraz jego podfoldery są ukryte na
                    liście, aby nie można było utworzyć pętli.
                </p>

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
                        disabled={
                            isSaving ||
                            !destinationHasChanged
                        }
                    >
                        {isSaving
                            ? "Przenoszenie..."
                            : "Przenieś"}
                    </button>
                </div>
            </form>
        </div>
    );
}