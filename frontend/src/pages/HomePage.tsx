import { useCallback, useEffect, useState } from "react";
import AuthGate from "../components/AuthGate";
import FantasyCityBackdrop from "../components/FantasyCityBackdrop";
import AiReadinessPanel from "../components/AiReadinessPanel";
import FolderContent from "../components/FolderContent";
import FolderList from "../components/FolderList";
import GlobalSearch from "../components/GlobalSearch";
import UserAdminPanel from "../components/UserAdminPanel";
import WorldMap from "../components/WorldMap";
import WorldList from "../components/WorldList";
import { api } from "../services/api";
import type { AuthMeResponse, AuthSession, AuthStatus, ChangePasswordRequest } from "../types/Auth";
import type { Folder } from "../types/Folder";
import type { Page } from "../types/Page";
import type { SearchResult } from "../types/SearchResult";
import type { World } from "../types/World";
import "./HomePage.css";
import "../components/V1Modules.css";

export default function HomePage() {
    const [activeModule, setActiveModule] = useState<
        "knowledge" | "map" | "ai"
    >("knowledge");
    const [authEnabled, setAuthEnabled] = useState(false);
    const [authReady, setAuthReady] = useState(false);
    const [currentUser, setCurrentUser] = useState<AuthSession | null>(null);
    const [authError, setAuthError] = useState<string | null>(null);
    const [authBusy, setAuthBusy] = useState(false);
    const [worlds, setWorlds] = useState<World[]>([]);
    const [isWorldsLoading, setIsWorldsLoading] = useState(true);
    const [worldsError, setWorldsError] = useState<string | null>(null);
    const [worldsReloadKey, setWorldsReloadKey] = useState(0);
    const [folders, setFolders] = useState<Folder[]>([]);
    const [selectedWorld, setSelectedWorld] =
        useState<World | null>(null);
    const [selectedFolderId, setSelectedFolderId] =
        useState<string | null>(null);
    const [pages, setPages] = useState<Page[]>([]);
    const [selectedPageId, setSelectedPageId] =
        useState<string | null>(null);
    const [isPagesLoading, setIsPagesLoading] =
        useState(false);
    const [pagesError, setPagesError] =
        useState<string | null>(null);
    const [pagesReloadKey, setPagesReloadKey] =
        useState(0);

    const selectedFolder =
        folders.find(
            (folder) => folder.id === selectedFolderId,
        ) ?? null;

    const selectedPage =
        pages.find(
            (page) => page.id === selectedPageId,
        ) ?? null;
    const canEdit = !authEnabled || currentUser?.role !== 2;

    const clearPageState = useCallback(() => {
        setPages([]);
        setSelectedPageId(null);
        setIsPagesLoading(false);
        setPagesError(null);
    }, []);

    const resetWorkspace = useCallback(() => {
        setWorlds([]);
        setWorldsError(null);
        setIsWorldsLoading(false);
        setFolders([]);
        setSelectedWorld(null);
        setSelectedFolderId(null);
        clearPageState();
        setPagesReloadKey(0);
        setWorldsReloadKey(0);
    }, [clearPageState]);

    useEffect(() => {
        let cancelled = false;

        const loadAuthState = async () => {
            try {
                const statusResponse = await api.get<AuthStatus>("/auth/status");
                if (cancelled) return;
                setAuthEnabled(statusResponse.data.enabled);

                if (statusResponse.data.enabled) {
                    const meResponse = await api.get<AuthMeResponse>("/auth/me");
                    if (cancelled) return;
                    setCurrentUser(meResponse.data.user);
                } else {
                    setCurrentUser(null);
                }
            } catch (error) {
                if (!cancelled) {
                    console.error("Nie udało się sprawdzić sesji:", error);
                    setAuthEnabled(false);
                    setCurrentUser(null);
                }
            } finally {
                if (!cancelled) {
                    setAuthReady(true);
                }
            }
        };

        const handleExpired = () => {
            if (cancelled) {
                return;
            }

            setCurrentUser(null);
            setAuthError("Sesja wygasła. Zaloguj się ponownie.");
            resetWorkspace();
        };

        window.addEventListener("era-auth-expired", handleExpired);
        void loadAuthState();

        return () => {
            cancelled = true;
            window.removeEventListener("era-auth-expired", handleExpired);
        };
    }, [resetWorkspace]);

    useEffect(() => {
        if (!authReady || (authEnabled && !currentUser)) {
            return;
        }

        let cancelled = false;

        void (async () => {
            setIsWorldsLoading(true);
            try {
                const response = await api.get<World[]>("/worlds");
                if (cancelled) return;
                setWorlds(response.data);
                setWorldsError(null);
            } catch (error) {
                if (cancelled) return;
                console.error(
                    "Nie udało się pobrać światów:",
                    error,
                );
                setWorldsError(
                    "Nie udało się połączyć z API i pobrać światów.",
                );
            } finally {
                if (!cancelled) {
                    setIsWorldsLoading(false);
                }
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [authEnabled, authReady, currentUser, worldsReloadKey]);

    useEffect(() => {
        if (!authReady || (authEnabled && !currentUser) || !selectedWorld) {
            return;
        }

        const loadFolders = async () => {
            try {
                const response = await api.get<Folder[]>(
                    `/worlds/${selectedWorld.id}/folders`,
                    { params: { playerView: false } },
                );

                setFolders(response.data);
            } catch (error) {
                console.error(
                    "Nie udało się pobrać folderów:",
                    error,
                );

                setFolders([]);
                setSelectedFolderId(null);
            }
        };

        void loadFolders();
    }, [authEnabled, authReady, currentUser, selectedWorld]);

    useEffect(() => {
        if (!authReady || (authEnabled && !currentUser) || !selectedWorld || !selectedFolderId) {
            return;
        }

        let isCurrentRequest = true;

        const loadPages = async () => {
            try {
                const response = await api.get<Page[]>(
                    `/worlds/${selectedWorld.id}/folders/${selectedFolderId}/pages`,
                );

                if (!isCurrentRequest) {
                    return;
                }

                setPages(response.data);
                setPagesError(null);
            } catch {
                if (!isCurrentRequest) {
                    return;
                }

                setPages([]);
                setPagesError(
                    "Nie udało się pobrać stron tego folderu.",
                );
            } finally {
                if (isCurrentRequest) {
                    setIsPagesLoading(false);
                }
            }
        };

        void loadPages();

        return () => {
            isCurrentRequest = false;
        };
    }, [authEnabled, authReady, currentUser, selectedWorld, selectedFolderId, pagesReloadKey]);

    const handleLogin = async (
        login: string,
        password: string,
    ) => {
        try {
            setAuthBusy(true);
            setAuthError(null);

            const response = await api.post<AuthSession>("/auth/login", {
                login,
                password,
            });

            setCurrentUser(response.data);
            resetWorkspace();
        } catch {
            setAuthError("Nieprawidłowy login, e-mail albo hasło.");
        } finally {
            setAuthBusy(false);
        }
    };

    const handleChangePassword = async (
        currentPassword: string,
        newPassword: string,
    ) => {
        try {
            setAuthBusy(true);
            setAuthError(null);

            const response = await api.post<AuthSession>(
                "/auth/change-password",
                {
                    currentPassword,
                    newPassword,
                } satisfies ChangePasswordRequest,
            );

            setCurrentUser(response.data);
        } catch {
            setAuthError("Nie udało się zmienić hasła.");
        } finally {
            setAuthBusy(false);
        }
    };

    const handleLogout = async () => {
        try {
            setAuthBusy(true);
            await api.post("/auth/logout");
        } finally {
            setAuthBusy(false);
            setCurrentUser(null);
            resetWorkspace();
        }
    };

    const handleSelectWorld = (world: World) => {
        setSelectedWorld(world);
        setActiveModule("knowledge");
        setSelectedFolderId(null);
        clearPageState();
    };

    const handleSelectFolder = (folderId: string) => {
        if (folderId === selectedFolderId) {
            setSelectedPageId(null);
            return;
        }

        setSelectedFolderId(folderId);
        setPages([]);
        setSelectedPageId(null);
        setPagesError(null);
        setIsPagesLoading(true);
    };

    const handleReloadPages = () => {
        setPagesError(null);
        setIsPagesLoading(true);
        setPagesReloadKey((currentKey) => currentKey + 1);
    };

    const handleCreateWorld = async (
        name: string,
        description: string,
    ): Promise<World> => {
        const response = await api.post<World>(
            "/worlds",
            {
                name,
                description,
            },
        );

        setWorlds((currentWorlds) => [
            ...currentWorlds,
            response.data,
        ]);

        setSelectedWorld(response.data);
        setSelectedFolderId(null);
        clearPageState();

        return response.data;
    };

    const handleArchiveWorld = async (
        worldId: string,
    ) => {
        const response = await api.patch<World>(
            `/worlds/${worldId}/archive`,
        );

        setWorlds((currentWorlds) =>
            currentWorlds.map((world) =>
                world.id === worldId
                    ? response.data
                    : world,
            ),
        );

        if (selectedWorld?.id === worldId) {
            setSelectedWorld(null);
            setSelectedFolderId(null);
            setFolders([]);
            clearPageState();
        }
    };

    const handleRestoreWorld = async (
        worldId: string,
    ) => {
        const response = await api.patch<World>(
            `/worlds/${worldId}/restore`,
        );

        setWorlds((currentWorlds) =>
            currentWorlds.map((world) =>
                world.id === worldId
                    ? response.data
                    : world,
            ),
        );
    };

    const handleCreateFolder = async (
        name: string,
        parentFolderId: string | null,
    ): Promise<Folder> => {
        if (!selectedWorld) {
            throw new Error("Nie wybrano świata.");
        }

        const response = await api.post<Folder>(
            `/worlds/${selectedWorld.id}/folders`,
            {
                name,
                parentFolderId,
            },
        );

        setFolders((currentFolders) => [
            ...currentFolders,
            response.data,
        ]);

        return response.data;
    };

    const handleRenameFolder = async (
        folderId: string,
        name: string,
    ) => {
        if (!selectedWorld) {
            throw new Error("Nie wybrano świata.");
        }

        const response = await api.put<Folder>(
            `/worlds/${selectedWorld.id}/folders/${folderId}`,
            {
                name,
            },
        );

        setFolders((currentFolders) =>
            currentFolders.map((folder) =>
                folder.id === folderId
                    ? response.data
                    : folder,
            ),
        );
    };

    const handleMoveFolder = async (
        folderId: string,
        destinationFolderId: string | null,
    ) => {
        if (!selectedWorld) {
            throw new Error("Nie wybrano świata.");
        }

        const response = await api.patch<Folder>(
            `/worlds/${selectedWorld.id}/folders/${folderId}/move`,
            {
                destinationFolderId,
            },
        );

        setFolders((currentFolders) =>
            currentFolders.map((folder) =>
                folder.id === folderId
                    ? response.data
                    : folder,
            ),
        );
    };

    const handleCreatePage = async (
        title: string,
        content: string,
    ): Promise<Page> => {
        if (!selectedWorld || !selectedFolderId) {
            throw new Error("Nie wybrano folderu.");
        }

        const response = await api.post<Page>(
            `/worlds/${selectedWorld.id}/folders/${selectedFolderId}/pages`,
            {
                title,
                content,
            },
        );

        setPages((currentPages) =>
            [...currentPages, response.data].sort(
                (left, right) =>
                    left.title.localeCompare(
                        right.title,
                        "pl",
                    ),
            ),
        );
        setSelectedPageId(response.data.id);

        return response.data;
    };

    const handleUpdatePage = async (
        title: string,
        content: string,
    ) => {
        if (!selectedWorld || !selectedPage) return;
        const response = await api.put<Page>(
            `/worlds/${selectedWorld.id}/pages/${selectedPage.id}`,
            { title, content },
        );
        setPages((current) =>
            current.map((page) =>
                page.id === response.data.id
                    ? response.data
                    : page,
            ),
        );
    };

    const runPageMove = async (
        path: string,
        payload?: object,
    ) => {
        if (!selectedWorld || !selectedPage) return;
        const response = await api.patch<Page>(
            `/worlds/${selectedWorld.id}/pages/${selectedPage.id}/${path}`,
            payload ?? {},
        );
        setPages((current) =>
            response.data.folderId === selectedFolderId
                ? current.map((page) =>
                      page.id === response.data.id
                          ? response.data
                          : page,
                  )
                : current.filter(
                      (page) => page.id !== response.data.id,
                  ),
        );
        if (response.data.folderId !== selectedFolderId) {
            setSelectedPageId(null);
        }
    };

    const handleDeletePage = async () => {
        if (!selectedWorld || !selectedPage) return;
        await api.delete(
            `/worlds/${selectedWorld.id}/pages/${selectedPage.id}`,
        );
        setPages((current) =>
            current.filter((page) => page.id !== selectedPage.id),
        );
        setSelectedPageId(null);
    };

    const navigateToResult = (result: SearchResult) => {
        const world = worlds.find(
            (item) => item.id === result.worldId,
        );
        if (!world) return;

        setActiveModule("knowledge");
        setSelectedWorld(world);
        setSelectedFolderId(result.folderId);
        setPages([]);
        setPagesError(null);
        setSelectedPageId(result.pageId);
        setIsPagesLoading(Boolean(result.folderId));
    };

    const openMapLink = (
        folderId: string,
        pageId?: string | null,
    ) => {
        setActiveModule("knowledge");
        setSelectedFolderId(folderId);
        setPages([]);
        setSelectedPageId(pageId ?? null);
        setIsPagesLoading(true);
    };

    if (!authReady) {
        return (
            <div className="app-shell">
                <FantasyCityBackdrop />
                <AuthGate
                    authEnabled={authEnabled}
                    authReady={authReady}
                    currentUser={currentUser}
                    isBusy={authBusy}
                    error={authError}
                    onLogin={handleLogin}
                    onChangePassword={handleChangePassword}
                    onLogout={handleLogout}
                />
            </div>
        );
    }

    if (authReady && authEnabled && (!currentUser || currentUser.mustChangePassword)) {
        return (
            <div className="app-shell">
                <FantasyCityBackdrop />
                <AuthGate
                    authEnabled={authEnabled}
                    authReady={authReady}
                    currentUser={currentUser}
                    isBusy={authBusy}
                    error={authError}
                    onLogin={handleLogin}
                    onChangePassword={handleChangePassword}
                    onLogout={handleLogout}
                />
            </div>
        );
    }

    return (
        <div className="app-shell">
            <FantasyCityBackdrop />

            <div className="app-interface">
                <header className="app-header">
                    <div className="brand-emblem">ESL</div>

                    <div className="brand-copy">
                        <span className="brand-kicker">
                            Kroniki kampanii
                        </span>

                        <strong>Era Świata Legend</strong>
                    </div>

                    <div className="header-ornament">
                        ◆
                    </div>

                    <GlobalSearch
                        activeWorldId={selectedWorld?.id ?? null}
                        onNavigate={navigateToResult}
                    />

                    <nav className="module-navigation" aria-label="Moduły aplikacji">
                        <button type="button" data-testid="module-knowledge" className={activeModule === "knowledge" ? "is-active" : ""} onClick={() => setActiveModule("knowledge")}>Wiedza</button>
                        <button type="button" data-testid="module-map" className={activeModule === "map" ? "is-active" : ""} onClick={() => setActiveModule("map")} disabled={!selectedWorld}>Mapa</button>
                        <button type="button" className={activeModule === "ai" ? "is-active" : ""} onClick={() => setActiveModule("ai")}>AI</button>
                    </nav>

                    <div className="active-world" data-testid="active-world">
                        <span>Aktywny świat</span>

                        <strong>
                            {selectedWorld?.name ??
                                "Nie wybrano"}
                        </strong>
                    </div>

                    {currentUser && (
                        <div className="auth-user-chip" data-testid="auth-user">
                            <span>{currentUser.role === 0 ? "Administrator" : currentUser.role === 1 ? "MG" : "Gracz"}</span>
                            <strong>{currentUser.displayName}</strong>
                            <small>{currentUser.email ?? "konto lokalne"}</small>
                            <button type="button" className="page-button page-button--ghost" onClick={() => void handleLogout()}>Wyloguj</button>
                        </div>
                    )}
                </header>

                <div className="app-workspace">
                    <aside className="app-sidebar">
                        <WorldList
                            worlds={worlds}
                            isLoading={isWorldsLoading}
                            error={worldsError}
                            selectedWorldId={
                                selectedWorld?.id ?? null
                            }
                            onReload={() => {
                                setWorldsError(null);
                                setIsWorldsLoading(true);
                                setWorldsReloadKey(
                                    (current) => current + 1,
                                );
                            }}
                            onSelect={handleSelectWorld}
                            onCreateWorld={
                                handleCreateWorld
                            }
                            onArchiveWorld={
                                handleArchiveWorld
                            }
                            onRestoreWorld={
                                handleRestoreWorld
                            }
                            canEdit={canEdit}
                        />

                        <div className="sidebar-divider">
                            <span>✦</span>
                        </div>

                        <FolderList
                            key={
                                selectedWorld?.id ??
                                "no-world"
                            }
                            folders={folders}
                            worldName={
                                selectedWorld?.name ?? null
                            }
                            selectedFolderId={
                                selectedFolderId
                            }
                            onSelectFolder={
                                handleSelectFolder
                            }
                            onCreateFolder={
                                handleCreateFolder
                            }
                            onRenameFolder={
                                handleRenameFolder
                            }
                            onMoveFolder={
                                handleMoveFolder
                            }
                            canEdit={canEdit}
                        />
                    </aside>

                    <main className="app-content">
                        {activeModule === "knowledge" && selectedWorld?.description.trim() && (
                            <section
                                className="world-description-card"
                                aria-label="Opis aktywnego świata"
                            >
                                <span>O świecie</span>
                                <p>
                                    {selectedWorld.description}
                                </p>
                            </section>
                        )}

                        {activeModule === "knowledge" && <FolderContent
                            worldName={
                                selectedWorld?.name ?? null
                            }
                            worldId={selectedWorld?.id ?? null}
                            folder={selectedFolder}
                            folders={folders}
                            pages={pages}
                            selectedPage={selectedPage}
                            isPagesLoading={isPagesLoading}
                            pagesError={pagesError}
                            onSelectFolder={
                                handleSelectFolder
                            }
                            onSelectPage={setSelectedPageId}
                            onBackToFolder={() =>
                                setSelectedPageId(null)
                            }
                            onCreatePage={handleCreatePage}
                            onReloadPages={handleReloadPages}
                            onUpdatePage={handleUpdatePage}
                            onMovePage={(folderId) =>
                                runPageMove("move", {
                                    destinationFolderId: folderId,
                                })
                            }
                            onArchivePage={() =>
                                runPageMove("archive")
                            }
                            onTrashPage={() =>
                                runPageMove("trash")
                            }
                            onRestorePage={() =>
                                runPageMove("restore", {
                                    destinationFolderId: null,
                                })
                            }
                            onDeletePage={handleDeletePage}
                            canEdit={canEdit}
                        />}
                        {activeModule === "map" && selectedWorld && (
                            <WorldMap
                                worldId={selectedWorld.id}
                                worldName={selectedWorld.name}
                                folders={folders}
                                pages={pages}
                                forcePlayerView={authEnabled && currentUser?.role === 2}
                                onOpenFolder={openMapLink}
                            />
                        )}
                        {activeModule === "ai" && (
                            <AiReadinessPanel />
                        )}
                        {currentUser?.role === 0 && (
                            <UserAdminPanel enabled={authEnabled} />
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
}
