import { useEffect, useState } from "react";
import type { Page } from "../types/Page";
import ModalPortal from "./ModalPortal";
import "./PageManagement.css";

interface Props {
    folderName: string;
    onCreate: (
        title: string,
        content: string,
    ) => Promise<Page>;
    onClose: () => void;
}

export default function PageCreateDialog({
    folderName,
    onCreate,
    onClose,
}: Props) {
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

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

        const trimmedTitle = title.trim();

        if (!trimmedTitle) {
            setError("Podaj tytuł strony.");
            return;
        }

        try {
            setIsSaving(true);
            setError(null);

            await onCreate(trimmedTitle, content.trim());
            onClose();
        } catch {
            setError(
                "Nie udało się utworzyć strony. Spróbuj ponownie.",
            );
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <ModalPortal>
            <div
                className="page-dialog-backdrop"
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
                    className="page-dialog"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="create-page-title"
                    onSubmit={handleSubmit}
                >
                    <div className="page-dialog-ornament">
                        <span>◇</span>
                    </div>

                <span className="page-dialog-kicker">
                    Nowy zapis
                </span>

                <h3 id="create-page-title">
                    Dodaj stronę
                </h3>

                <p className="page-dialog-description">
                    Strona zostanie zapisana w folderze{" "}
                    <strong>{folderName}</strong>.
                </p>

                <label htmlFor="new-page-title">
                    Tytuł strony
                </label>

                <input
                    id="new-page-title"
                    type="text"
                    value={title}
                    onChange={(event) => {
                        setTitle(event.target.value);
                        setError(null);
                    }}
                    placeholder="Np. Historia Starego Portu"
                    maxLength={300}
                    autoFocus
                    disabled={isSaving}
                />

                <div className="page-field-meta">
                    <span>Pole wymagane</span>
                    <span>{title.length}/300</span>
                </div>

                <label htmlFor="new-page-content">
                    Treść
                </label>

                <textarea
                    id="new-page-content"
                    value={content}
                    onChange={(event) =>
                        setContent(event.target.value)
                    }
                    placeholder="Zapisz najważniejsze informacje..."
                    rows={10}
                    disabled={isSaving}
                />

                <p className="page-dialog-hint">
                    Treść jest opcjonalna i można ją uzupełnić
                    później, gdy edycja stron zostanie dodana.
                </p>

                {error && (
                    <p className="page-dialog-error" role="alert">
                        {error}
                    </p>
                )}

                <div className="page-dialog-actions">
                    <button
                        type="button"
                        className="page-button page-button--ghost"
                        onClick={onClose}
                        disabled={isSaving}
                    >
                        Anuluj
                    </button>

                    <button
                        type="submit"
                        className="page-button page-button--primary"
                        disabled={isSaving}
                    >
                        {isSaving
                            ? "Zapisywanie..."
                            : "Dodaj stronę"}
                    </button>
                </div>
                </form>
            </div>
        </ModalPortal>
    );
}
