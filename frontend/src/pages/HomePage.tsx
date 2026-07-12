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

        api.get<Folder[]>(
            `/worlds/${selectedWorld.id}/folders`,
        )
            .then((response) => {
                setFolders(response.data);
            })
            .catch((error) => {
                console.error(
                    "Nie udało się pobrać folderów:",
                    error,
                );
                setFolders([]);
            });
    }, [selectedWorld]);

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
                    />
                </div>
            </div>
        </main>
    );
}