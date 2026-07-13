import { useState } from "react";
import type { World } from "../types/World";

interface Props {
    world: World;
    onArchive: (worldId: string) => Promise<void>;
    onClose: () => void;
}

export default function WorldArchiveDialog({
    world,
    onArchive,
    onClose,
}: Props) {
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] =
        useState<string | null>(null);

    const handleSubmit = async (
        event: React.FormEvent<HTMLFormElement>,
    ) => {
        event.preventDefault();

        try {
            setIsSaving(true);
            setError(null);

            await onArchive(world.id);
            onClose();
        } catch {
            setError(
                "Nie udało się zarchiwizować świata.",
            );
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="world-dialog-backdrop">
            <form
                className="world-dialog"
                role="dialog"
                aria-modal="true"
                onSubmit={handleSubmit}
            >
                <div className="world-dialog-ornament">
                    <span>▣</span>
                </div>

                <span className="world-dialog-kicker">
                    Bezpieczne porządkowanie
                </span>

                <h3>Archiwizuj świat</h3>

                <p className="world-archive-message">
                    Świat <strong>{world.name}</strong>{" "}
                    zostanie przeniesiony do archiwum.
                    Jego foldery, strony i pliki pozostaną
                    bez zmian.
                </p>

                <p className="world-archive-note">
                    Świat będzie można w każdej chwili
                    przywrócić z sekcji „Archiwum
                    światów”.
                </p>

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
                            ? "Archiwizowanie..."
                            : "Przenieś do archiwum"}
                    </button>
                </div>
            </form>
        </div>
    );
}