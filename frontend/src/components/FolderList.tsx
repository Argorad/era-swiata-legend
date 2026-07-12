import { useState } from "react";
import type { Folder } from "../types/Folder";
import FolderItem from "./FolderItem";

interface Props {
    folders: Folder[];
    worldName: string | null;
    onCreateFolder: (name: string) => Promise<void>;
    onRenameFolder: (
        folderId: string,
        name: string,
    ) => Promise<void>;
}

export default function FolderList({
    folders,
    worldName,
    onCreateFolder,
    onRenameFolder,
}: Props) {
    const [isCreating, setIsCreating] = useState(false);
    const [folderName, setFolderName] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

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

            await onCreateFolder(trimmedName);

            setFolderName("");
            setIsCreating(false);
        } catch {
            setError("Nie udało się utworzyć folderu.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        setFolderName("");
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
                    <h2 style={{ margin: 0 }}>Foldery</h2>

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
                        gap: "10px",
                        padding: "16px",
                        marginBottom: "16px",
                        border: "1px solid #ccc",
                        borderRadius: "8px",
                        background: "#fafafa",
                    }}
                >
                    <label htmlFor="folder-name">
                        Nazwa folderu
                    </label>

                    <input
                        id="folder-name"
                        type="text"
                        value={folderName}
                        onChange={(event) =>
                            setFolderName(event.target.value)
                        }
                        placeholder="Np. Miasta"
                        autoFocus
                        disabled={isSaving}
                        style={{
                            padding: "10px",
                            border: "1px solid #bbb",
                            borderRadius: "6px",
                        }}
                    />

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
            ) : folders.length === 0 ? (
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
                    {folders.map((folder) => (
                        <FolderItem
                            key={folder.id}
                            folder={folder}
                            onRenameFolder={
                                onRenameFolder
                            }
                        />
                    ))}
                </ul>
            )}
        </section>
    );
}