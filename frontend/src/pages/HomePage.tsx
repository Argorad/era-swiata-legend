import { useEffect, useState } from "react";
import { api } from "../services/api";
import type { World } from "../types/World";
import type { Folder } from "../types/Folder";
import WorldList from "../components/WorldList";
import FolderList from "../components/FolderList";

export default function HomePage() {
    const [worlds, setWorlds] = useState<World[]>([]);
    const [folders, setFolders] = useState<Folder[]>([]);
    const [selectedWorld, setSelectedWorld] =
        useState<World | null>(null);

    useEffect(() => {
        api.get<World[]>("/worlds")
            .then((response) => {
                setWorlds(response.data);
            })
            .catch((error) => {
                console.error(
                    "Nie udało się pobrać światów:",
                    error,
                );
            });
    }, []);

    useEffect(() => {
        if (!selectedWorld) {
            setFolders([]);
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
        }
    };

    const handleCreateFolder = async (
        name: string,
        parentFolderId: string | null,
    ) => {
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
        <main
            style={{
                minHeight: "100vh",
                padding: "24px",
                background: "#f5f5f5",
                boxSizing: "border-box",
            }}
        >
            <h1 style={{ marginTop: 0 }}>
                Era Świata Legend
            </h1>

            <div
                style={{
                    display: "grid",
                    gridTemplateColumns:
                        "minmax(240px, 300px) minmax(0, 1fr)",
                    gap: "24px",
                    alignItems: "start",
                }}
            >
                <aside
                    style={{
                        padding: "20px",
                        background: "white",
                        border: "1px solid #ddd",
                        borderRadius: "10px",
                    }}
                >
                    <WorldList
                        worlds={worlds}
                        selectedWorldId={
                            selectedWorld?.id ?? null
                        }
                        onSelect={setSelectedWorld}
                    />
                </aside>

                <div
                    style={{
                        padding: "20px",
                        background: "white",
                        border: "1px solid #ddd",
                        borderRadius: "10px",
                        minHeight: "300px",
                    }}
                >
                    <FolderList
                        folders={folders}
                        worldName={
                            selectedWorld?.name ?? null
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
                </div>
            </div>
        </main>
    );
}