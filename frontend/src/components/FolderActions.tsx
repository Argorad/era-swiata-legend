import { useState } from "react";

interface Props {
    onRename: () => void;
}

export default function FolderActions({
    onRename,
}: Props) {
    const [isOpen, setIsOpen] = useState(false);

    const handleRename = () => {
        setIsOpen(false);
        onRename();
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

    const disabledButtonStyle: React.CSSProperties = {
        ...menuButtonStyle,
        cursor: "not-allowed",
        opacity: 0.45,
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
                    lineHeight: 1,
                    cursor: "pointer",
                    color: "white",
                    background: "#666",
                    border: "none",
                    borderRadius: "4px",
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
                        zIndex: 10,
                        minWidth: "200px",
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
                        onClick={handleRename}
                        style={menuButtonStyle}
                    >
                        ✏️ Zmień nazwę
                    </button>

                    <button
                        type="button"
                        disabled
                        style={disabledButtonStyle}
                    >
                        📁 Nowy podfolder
                    </button>

                    <button
                        type="button"
                        disabled
                        style={disabledButtonStyle}
                    >
                        📄 Nowa strona
                    </button>

                    <div
                        style={{
                            height: "1px",
                            margin: "6px 0",
                            background: "#ddd",
                        }}
                    />

                    <button
                        type="button"
                        disabled
                        style={disabledButtonStyle}
                    >
                        📂 Przenieś
                    </button>

                    <button
                        type="button"
                        disabled
                        style={disabledButtonStyle}
                    >
                        🗑️ Przenieś do kosza
                    </button>
                </div>
            )}
        </div>
    );
}