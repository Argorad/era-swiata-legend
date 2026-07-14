import { useState } from "react";
import type { World } from "../types/World";
import WorldArchiveDialog from "./WorldArchiveDialog";
import WorldCreateDialog from "./WorldCreateDialog";
import "./WorldManagement.css";

interface Props {
    worlds: World[];
    isLoading: boolean;
    error: string | null;
    selectedWorldId: string | null;
    onReload: () => void;
    onSelect: (world: World) => void;
    onCreateWorld: (
        name: string,
        description: string,
    ) => Promise<World>;
    onArchiveWorld: (
        worldId: string,
    ) => Promise<void>;
    onRestoreWorld: (
        worldId: string,
    ) => Promise<void>;
    canEdit: boolean;
}

export default function WorldList({
    worlds,
    isLoading,
    error,
    selectedWorldId,
    onReload,
    onSelect,
    onCreateWorld,
    onArchiveWorld,
    onRestoreWorld,
    canEdit,
}: Props) {
    const [isCreating, setIsCreating] =
        useState(false);
    const [isArchiveOpen, setIsArchiveOpen] =
        useState(false);
    const [worldToArchive, setWorldToArchive] =
        useState<World | null>(null);

    const activeWorlds = worlds.filter(
        (world) => world.status === 0,
    );

    const archivedWorlds = worlds.filter(
        (world) => world.status === 1,
    );

    return (
        <section className="world-list">
            <div className="world-list-header">
                <div className="sidebar-section-heading">
                    <span className="sidebar-section-kicker">
                        Kampania
                    </span>

                    <h2>Światy</h2>
                </div>

                {canEdit && (
                    <button
                        type="button"
                        data-testid="world-create-button"
                        className="world-create-button"
                        onClick={() => setIsCreating(true)}
                        aria-label="Utwórz świat"
                        title="Nowy świat"
                    >
                        ＋
                    </button>
                )}
            </div>

            {isLoading ? (
                <p className="sidebar-muted">
                    Wczytywanie światów...
                </p>
            ) : error ? (
                <div className="world-list-error" role="alert">
                    <p>{error}</p>
                    <button type="button" onClick={onReload}>
                        Spróbuj ponownie
                    </button>
                </div>
            ) : activeWorlds.length === 0 ? (
                <p className="sidebar-muted">
                    Brak aktywnych światów.
                </p>
            ) : (
                <ul className="world-list-items">
                    {activeWorlds.map((world) => {
                        const isSelected =
                            selectedWorldId ===
                            world.id;

                        return (
                            <li
                                key={world.id}
                                className="world-list-row"
                            >
                                <button
                                    type="button"
                                    data-testid={`world-${world.id}`}
                                    className={`world-list-item${
                                        isSelected
                                            ? " world-list-item--selected"
                                            : ""
                                    }`}
                                    onClick={() =>
                                        onSelect(world)
                                    }
                                >
                                    <span className="world-list-icon">
                                        ◈
                                    </span>

                                    <span>
                                        {world.name}
                                    </span>
                                </button>

                                {canEdit && (
                                    <button
                                        type="button"
                                        className="world-row-action"
                                        onClick={() =>
                                            setWorldToArchive(
                                                world,
                                            )
                                        }
                                        aria-label={`Archiwizuj świat ${world.name}`}
                                        title="Przenieś do archiwum"
                                    >
                                        ▣
                                    </button>
                                )}
                            </li>
                        );
                    })}
                </ul>
            )}

            {canEdit && archivedWorlds.length > 0 && (
                <div className="world-archive-section">
                    <button
                        type="button"
                        className="world-archive-toggle"
                        onClick={() =>
                            setIsArchiveOpen(
                                (current) =>
                                    !current,
                            )
                        }
                        aria-expanded={isArchiveOpen}
                    >
                        <span>
                            {isArchiveOpen ? "−" : "+"}
                        </span>

                        Archiwum światów

                        <small>
                            {archivedWorlds.length}
                        </small>
                    </button>

                    {isArchiveOpen && (
                        <ul className="world-list-items world-list-items--archived">
                            {archivedWorlds.map(
                                (world) => (
                                    <li
                                        key={world.id}
                                        className="world-list-row world-list-row--archived"
                                    >
                                        <div className="archived-world-name">
                                            <span>▣</span>
                                            {world.name}
                                        </div>

                                        <button
                                            type="button"
                                            className="world-restore-button"
                                            onClick={() =>
                                                void onRestoreWorld(
                                                    world.id,
                                                )
                                            }
                                            aria-label={`Przywróć świat ${world.name}`}
                                            title="Przywróć świat"
                                        >
                                            ↶
                                        </button>
                                    </li>
                                ),
                            )}
                        </ul>
                    )}
                </div>
            )}

            {canEdit && isCreating && (
                <WorldCreateDialog
                    onCreate={onCreateWorld}
                    onClose={() =>
                        setIsCreating(false)
                    }
                />
            )}

            {canEdit && worldToArchive && (
                <WorldArchiveDialog
                    world={worldToArchive}
                    onArchive={onArchiveWorld}
                    onClose={() =>
                        setWorldToArchive(null)
                    }
                />
            )}
        </section>
    );
}
