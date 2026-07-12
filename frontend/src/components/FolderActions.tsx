import { useState } from "react";

interface Props {
    onRename: () => void;
    onMove: () => void;
    onArchive: () => void;
    onTrash: () => void;
}

export default function FolderActions({
    onRename,
    onMove,
    onArchive,
    onTrash,
}: Props) {
    const [isOpen, setIsOpen] = useState(false);

    const runAction = (action: () => void) => {
        setIsOpen(false);
        action();
    };

    const menuButtonStyle: React.CSSProperties = {
        width: "100%",
        padding: "10px 12px",
        textAlign: "left",
        cursor: "pointer",
        background: "transparent",
        border: "none",
        color: "#222",
        fontSize: "14px",
    };

    return (
        <div style={{ position: "relative" }}>
            <button
                type="button"
                aria-label="Akcje folderu"
                onClick={() =>
                    setIsOpen((current) => !current)
                }
                style={{
                    width: "36px",
                    height: "36px",
                    padding: 0,
                    fontSize: "20px",
                    cursor: "pointer",
                }}
            >
                ⋮
            </button>

            {isOpen && (
                <div
                    style={{
                        position: "absolute",
                        top: "42px",
                        right: 0,
                        zIndex: 20,
                        minWidth: "210px",
                        padding: "6px",
                        border: "1px solid #ccc",
                        borderRadius: "8px",
                        background: "white",
                        boxShadow:
                            "0 8px 24px rgba(0, 0, 0, 0.18)",
                    }}
                >
                    <button
                        type="button"
                        onClick={() => runAction(onRename)}
                        style={menuButtonStyle}
                    >
                        ✏️ Zmień nazwę
                    </button>

                    <button
                        type="button"
                        onClick={() => runAction(onMove)}
                        style={menuButtonStyle}
                    >
                        📂 Przenieś...
                    </button>

                    <button
                        type="button"
                        onClick={() => runAction(onArchive)}
                        style={menuButtonStyle}
                    >
                        📦 Archiwizuj
                    </button>

                    <button
                        type="button"
                        onClick={() => runAction(onTrash)}
                        style={{
                            ...menuButtonStyle,
                            color: "#b00020",
                        }}
                    >
                        🗑️ Przenieś do kosza
                    </button>
                </div>
            )}
        </div>
    );
}