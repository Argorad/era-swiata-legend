import { useEffect, useState } from "react";
import FolderContent from "../components/FolderContent";
import FolderList from "../components/FolderList";
import WorldList from "../components/WorldList";
import { api } from "../services/api";
import type { Folder } from "../types/Folder";
import type { World } from "../types/World";
import "./HomePage.css";

export default function HomePage() {
    const [worlds, setWorlds] = useState<World[]>([]);
    const [folders, setFolders] = useState<Folder[]>([]);
    const [selectedWorld, setSelectedWorld] =
        useState<World | null>(null);
    const [selectedFolderId, setSelectedFolderId] =
        useState<string | null>(null);

    const selectedFolder =
        folders.find(
            (folder) => folder.id === selectedFolderId,
        ) ?? null;

    useEffect(() => {
        api.get<World[]>("/worlds")
            .then((response) =>
                setWorlds(response.data),
            )
            .catch((error) =>
                console.error(
                    "Nie udało się pobrać światów:",
                    error,
                ),
            );
    }, []);

    useEffect(() => {
        if (!selectedWorld) {
            setFolders([]);
            setSelectedFolderId(null);
            return;
        }

        void loadFolders(selectedWorld.id);
    }, [selectedWorld]);

    const loadFolders = async (worldId: string) => {
        try {
            const response = await api.get<Folder[]>(
                `/worlds/${worldId}/folders`,
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

    const handleSelectWorld = (world: World) => {
        setSelectedWorld(world);
        setSelectedFolderId(null);
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

    return (
        <div className="app-shell">
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

                <div className="active-world">
                    <span>Aktywny świat</span>

                    <strong>
                        {selectedWorld?.name ??
                            "Nie wybrano"}
                    </strong>
                </div>
            </header>

            <div className="app-workspace">
                <aside className="app-sidebar">
                    <WorldList
                        worlds={worlds}
                        selectedWorldId={
                            selectedWorld?.id ?? null
                        }
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
                            setSelectedFolderId
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
                    />
                </aside>

                <main className="app-content">
                    <FolderContent
                        worldName={
                            selectedWorld?.name ?? null
                        }
                        folder={selectedFolder}
                        folders={folders}
                        onSelectFolder={
                            setSelectedFolderId
                        }
                    />
                </main>
            </div>
        </div>
    );
}