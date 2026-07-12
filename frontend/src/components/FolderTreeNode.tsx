import { useState } from "react";
import type { Folder } from "../types/Folder";
import FolderItem from "./FolderItem";

interface Props {
    folder: Folder;
    folders: Folder[];
    level: number;
    onRenameFolder: (
        folderId: string,
        name: string,
    ) => Promise<void>;
    onMoveFolder: (
        folderId: string,
        destinationFolderId: string | null,
    ) => Promise<void>;
}

export default function FolderTreeNode({
    folder,
    folders,
    level,
    onRenameFolder,
    onMoveFolder,
}: Props) {
    const [isExpanded, setIsExpanded] = useState(true);

    const childFolders = folders
        .filter(
            (item) =>
                item.parentFolderId === folder.id,
        )
        .sort((left, right) => {
            if (left.type !== right.type) {
                return left.type - right.type;
            }

            return left.name.localeCompare(
                right.name,
                "pl",
            );
        });

    const hasChildren = childFolders.length > 0;

    return (
        <li
            style={{
                listStyle: "none",
                margin: 0,
                padding: 0,
            }}
        >
            <div
                style={{
                    display: "flex",
                    alignItems: "stretch",
                    marginLeft: `${level * 24}px`,
                    position: "relative",
                }}
            >
                {level > 0 && (
                    <div
                        style={{
                            position: "absolute",
                            left: "-14px",
                            top: 0,
                            bottom: 0,
                            width: "1px",
                            background: "#d8d8d8",
                        }}
                    />
                )}

                {level > 0 && (
                    <div
                        style={{
                            position: "absolute",
                            left: "-14px",
                            top: "25px",
                            width: "14px",
                            height: "1px",
                            background: "#d8d8d8",
                        }}
                    />
                )}

                <div
                    style={{
                        width: "28px",
                        flexShrink: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    {hasChildren ? (
                        <button
                            type="button"
                            aria-label={
                                isExpanded
                                    ? "Zwiń folder"
                                    : "Rozwiń folder"
                            }
                            onClick={() =>
                                setIsExpanded(
                                    (current) => !current,
                                )
                            }
                            style={{
                                width: "24px",
                                height: "24px",
                                padding: 0,
                                border: "none",
                                background: "transparent",
                                color: "#555",
                                cursor: "pointer",
                                fontSize: "14px",
                            }}
                        >
                            {isExpanded ? "▼" : "▶"}
                        </button>
                    ) : (
                        <span
                            style={{
                                width: "24px",
                                height: "24px",
                            }}
                        />
                    )}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                    <FolderItem
                        folder={folder}
                        folders={folders}
                        onRenameFolder={onRenameFolder}
                        onMoveFolder={onMoveFolder}
                    />
                </div>
            </div>

            {hasChildren && isExpanded && (
                <ul
                    style={{
                        listStyle: "none",
                        margin: 0,
                        padding: 0,
                    }}
                >
                    {childFolders.map((childFolder) => (
                        <FolderTreeNode
                            key={childFolder.id}
                            folder={childFolder}
                            folders={folders}
                            level={level + 1}
                            onRenameFolder={
                                onRenameFolder
                            }
                            onMoveFolder={
                                onMoveFolder
                            }
                        />
                    ))}
                </ul>
            )}
        </li>
    );
}