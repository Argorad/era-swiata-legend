import { useEffect, useState } from "react";
import type { World } from "../types/World";

interface Props {
    onCreate: (
        name: string,
        description: string,
    ) => Promise<World>;
    onClose: () => void;
}

export default function WorldCreateDialog({
    onCreate,
    onClose,
}: Props) {
    const [name, setName] = useState("");
    const [description, setDescription] =
        useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] =
        useState<string | null>(null);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape" && !isSaving) {
                onClose();
            }
        };

        window.addEventListener(
            "keydown",
            handleKeyDown,
        );

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
            setError("Podaj nazwę świata.");
            return;
        }

        try {
            setIsSaving(true);
            setError(null);

            await onCreate(
                trimmedName,
                description.trim(),
            );

            onClose();
        } catch {
            setError(
                "Nie udało się utworzyć świata.",
            );
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div
            className="world-dialog-backdrop"
            role="presentation"
            onMouseDown={(event) => {
                if (
                    event.target ===
                        event.currentTarget &&
                    !isSaving
                ) {
                    onClose();
                }
            }}
        >
            <form
                className="world-dialog"
                role="dialog"
                aria-modal="true"
                aria-labelledby="create-world-title"
                onSubmit={handleSubmit}
            >
                <div className="world-dialog-ornament">
                    <span>◆</span>
                </div>

                <span className="world-dialog-kicker">
                    Nowa kampania
                </span>

                <h3 id="create-world-title">
                    Utwórz świat
                </h3>

                <label htmlFor="world-name">
                    Nazwa świata
                </label>

                <input
                    id="world-name"
                    type="text"
                    value={name}
                    onChange={(event) => {
                        setName(event.target.value);
                        setError(null);
                    }}
                    placeholder="Np. Era Świata Legend"
                    autoFocus
                    disabled={isSaving}
                />

                <label htmlFor="world-description">
                    Krótki opis
                </label>

                <textarea
                    id="world-description"
                    value={description}
                    onChange={(event) =>
                        setDescription(
                            event.target.value,
                        )
                    }
                    placeholder="Opcjonalny opis świata"
                    rows={4}
                    maxLength={4000}
                    disabled={isSaving}
                />

                {error && (
                    <p className="world-dialog-error">
                        {error}
                    </p>
                )}

                <div className="world-dialog-actions">
                    <button
                        type="button"
                        className="world-button world-button--ghost"
                        onClick={onClose}
                        disabled={isSaving}
                    >
                        Anuluj
                    </button>

                    <button
                        type="submit"
                        className="world-button world-button--primary"
                        disabled={isSaving}
                    >
                        {isSaving
                            ? "Tworzenie..."
                            : "Utwórz świat"}
                    </button>
                </div>
            </form>
        </div>
    );
}