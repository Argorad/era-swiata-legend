import type { Folder } from "../types/Folder";

interface Props {
    worldName: string | null;
    folder: Folder | null;
    folders: Folder[];
    onSelectFolder: (folderId: string) => void;
}

function getFolderPath(
    folder: Folder,
    folders: Folder[],
): Folder[] {
    const path: Folder[] = [];
    const visitedIds = new Set<string>();
    let currentFolder: Folder | undefined = folder;

    while (
        currentFolder &&
        !visitedIds.has(currentFolder.id)
    ) {
        path.unshift(currentFolder);
        visitedIds.add(currentFolder.id);

        currentFolder = currentFolder.parentFolderId
            ? folders.find(
                  (item) =>
                      item.id ===
                      currentFolder?.parentFolderId,
              )
            : undefined;
    }

    return path;
}

function getFolderIcon(folder: Folder): string {
    if (folder.type === 1) {
        return "▣";
    }

    if (folder.type === 2) {
        return "⌫";
    }

    return "◆";
}

export default function FolderContent({
    worldName,
    folder,
    folders,
    onSelectFolder,
}: Props) {
    if (!worldName) {
        return (
            <section className="content-surface content-empty-state">
                <div className="empty-state-rune">✦</div>

                <h2>Wybierz świat</h2>

                <p>
                    Otwórz kronikę świata z panelu po lewej
                    stronie.
                </p>
            </section>
        );
    }

    if (!folder) {
        return (
            <section className="content-surface content-empty-state">
                <div className="empty-state-rune">⌘</div>

                <h2>Wybierz folder</h2>

                <p>
                    Wybierz dział kroniki z drzewa nawigacji.
                </p>
            </section>
        );
    }

    const path = getFolderPath(folder, folders);

    const childFolders = folders
        .filter(
            (item) =>
                item.parentFolderId === folder.id,
        )
        .sort((left, right) =>
            left.name.localeCompare(right.name, "pl"),
        );

    return (
        <section className="content-surface folder-content">
            <nav
                className="folder-breadcrumbs"
                aria-label="Ścieżka folderu"
            >
                <span className="breadcrumb-world">
                    {worldName}
                </span>

                {path.map((pathFolder) => (
                    <span
                        key={pathFolder.id}
                        className="breadcrumb-part"
                    >
                        <span className="breadcrumb-separator">
                            ›
                        </span>

                        <button
                            type="button"
                            onClick={() =>
                                onSelectFolder(
                                    pathFolder.id,
                                )
                            }
                        >
                            {pathFolder.name}
                        </button>
                    </span>
                ))}
            </nav>

            <header className="folder-content-header">
                <div className="folder-title-icon">
                    <span>{getFolderIcon(folder)}</span>
                </div>

                <div>
                    <span className="content-eyebrow">
                        Kronika świata
                    </span>

                    <h1>{folder.name}</h1>

                    <p>
                        {childFolders.length === 0
                            ? "Brak podfolderów"
                            : childFolders.length === 1
                              ? "1 podfolder"
                              : `${childFolders.length} podfolderów`}
                    </p>
                </div>
            </header>

            <div className="ornament-divider">
                <span>◆</span>
            </div>

            {childFolders.length > 0 && (
                <section className="content-section">
                    <div className="content-section-heading">
                        <span>Rozdziały</span>
                        <h2>Podfoldery</h2>
                    </div>

                    <div className="subfolder-grid">
                        {childFolders.map((childFolder) => (
                            <button
                                key={childFolder.id}
                                type="button"
                                className="subfolder-card"
                                onClick={() =>
                                    onSelectFolder(
                                        childFolder.id,
                                    )
                                }
                            >
                                <span className="subfolder-card-icon">
                                    {getFolderIcon(
                                        childFolder,
                                    )}
                                </span>

                                <span>
                                    {childFolder.name}
                                </span>

                                <span className="subfolder-card-arrow">
                                    ›
                                </span>
                            </button>
                        ))}
                    </div>
                </section>
            )}

            <section className="content-section">
                <div className="content-section-heading">
                    <span>Zapisy</span>
                    <h2>Strony</h2>
                </div>

                <div className="pages-empty-state">
                    <span className="pages-empty-icon">
                        ◇
                    </span>

                    <strong>Brak zapisanych stron</strong>

                    <p>
                        Ten dział kroniki nie zawiera jeszcze
                        żadnych wpisów.
                    </p>
                </div>
            </section>
        </section>
    );
}