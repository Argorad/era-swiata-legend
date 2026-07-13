import { useEffect, useState } from "react";
import type { Folder } from "../types/Folder";
import ModalPortal from "./ModalPortal";

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
                    aria-labelledby="move-folder-title"
                    onSubmit={handleSubmit}
                >
                    <div className="fantasy-dialog-ornament">
                        <span>↪</span>
                    </div>

                <span className="fantasy-dialog-kicker">
                    Zmiana położenia
                </span>

                <h3 id="move-folder-title">
                    Przenieś folder
                </h3>

                <p className="fantasy-dialog-description">
                    Folder: <strong>{folder.name}</strong>
                </p>

                <label htmlFor="destination-folder">
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

                <p className="fantasy-dialog-hint">
                    Folder oraz jego podfoldery są ukryte na
                    liście, aby nie można było utworzyć pętli.
                </p>

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
        </ModalPortal>
    );
}
