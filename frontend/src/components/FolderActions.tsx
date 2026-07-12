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

    return (
        <div
            style={{
                position: "relative",
            }}
        >
            <button
                type="button"
                aria-label="Akcje folderu"
                onClick={() => setIsOpen((current) => !current)}
                style={{
                    width: "36px",
                    height: "36px",
                    padding: 0,
                    fontSize: "20px",
                    lineHeight: 1,
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
                        zIndex: 10,
                        minWidth: "180px",
                        padding: "6px",
                        border: "1px solid #ccc",
                        borderRadius: "8px",
                        background: "white",
                        boxShadow:
                            "0 8px 24px rgba(0, 0, 0, 0.15)",
                    }}
                >
                    <button
                        type="button"
                        onClick={handleRename}
                        style={{
                            width: "100%",
                            padding: "10px 12px",
                            textAlign: "left",
                            cursor: "pointer",
                            background: "transparent",
                            border: "none",
                        }}
                    >
                        ✏️ Zmień nazwę
                    </button>

                    <button
                        type="button"
                        disabled
                        style={{
                            width: "100%",
                            padding: "10px 12px",
                            textAlign: "left",
                            cursor: "not-allowed",
                            background: "transparent",
                            border: "none",
                            opacity: 0.5,
                        }}
                    >
                        📁 Nowy podfolder
                    </button>

                    <button
                        type="button"
                        disabled
                        style={{
                            width: "100%",
                            padding: "10px 12px",
                            textAlign: "left",
                            cursor: "not-allowed",
                            background: "transparent",
                            border: "none",
                            opacity: 0.5,
                        }}
                    >
                        📄 Nowa strona
                    </button>

                    <button
                        type="button"
                        disabled
                        style={{
                            width: "100%",
                            padding: "10px 12px",
                            textAlign: "left",
                            cursor: "not-allowed",
                            background: "transparent",
                            border: "none",
                            opacity: 0.5,
                        }}
                    >
                        🗑 Usuń
                    </button>
                </div>
            )}
        </div>
    );
}