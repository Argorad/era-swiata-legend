import type { Folder } from "../types/Folder";

interface Props {
    folders: Folder[];
    worldName: string | null;
}

export default function FolderList({
    folders,
    worldName,
}: Props) {
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
                    disabled={!worldName}
                    style={{
                        padding: "10px 14px",
                        cursor: worldName
                            ? "pointer"
                            : "not-allowed",
                    }}
                >
                    ➕ Nowy folder
                </button>
            </div>

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
                        <li
                            key={folder.id}
                            style={{
                                padding: "12px 14px",
                                marginBottom: "8px",
                                border: "1px solid #ccc",
                                borderRadius: "8px",
                                background: "white",
                            }}
                        >
                            📁 {folder.name}
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}