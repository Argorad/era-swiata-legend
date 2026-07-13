import { useState } from "react";
import type { Folder } from "../types/Folder";
import FolderItem from "./FolderItem";

interface Props {
    folder: Folder;
    folders: Folder[];
    level: number;
    selectedFolderId: string | null;
    onSelectFolder: (folderId: string) => void;
    onCreateSubfolder: (
        parentFolderId: string,
    ) => void;
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
    selectedFolderId,
    onSelectFolder,
    onCreateSubfolder,
    onRenameFolder,
    onMoveFolder,
}: Props) {
    const [isExpanded, setIsExpanded] =
        useState(true);

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

    const hasChildren =
        childFolders.length > 0;

    const treeStyle = {
        "--tree-level": level,
    } as React.CSSProperties;

    return (
        <li
            className={`folder-tree-node${
                level > 0
                    ? " folder-tree-node--nested"
                    : ""
            }`}
            style={treeStyle}
        >
            <div className="folder-tree-line">
                <div className="folder-tree-toggle-slot">
                    {hasChildren && (
                        <button
                            type="button"
                            className="folder-tree-toggle"
                            aria-label={
                                isExpanded
                                    ? "Zwiń folder"
                                    : "Rozwiń folder"
                            }
                            onClick={() =>
                                setIsExpanded(
                                    (current) =>
                                        !current,
                                )
                            }
                        >
                            {isExpanded
                                ? "−"
                                : "+"}
                        </button>
                    )}
                </div>

                <FolderItem
                    folder={folder}
                    folders={folders}
                    isSelected={
                        selectedFolderId ===
                        folder.id
                    }
                    onSelectFolder={
                        onSelectFolder
                    }
                    onCreateSubfolder={
                        onCreateSubfolder
                    }
                    onRenameFolder={
                        onRenameFolder
                    }
                    onMoveFolder={onMoveFolder}
                />
            </div>

            {hasChildren && isExpanded && (
                <ul className="folder-tree-children">
                    {childFolders.map(
                        (childFolder) => (
                            <FolderTreeNode
                                key={
                                    childFolder.id
                                }
                                folder={
                                    childFolder
                                }
                                folders={folders}
                                level={level + 1}
                                selectedFolderId={
                                    selectedFolderId
                                }
                                onSelectFolder={
                                    onSelectFolder
                                }
                                onCreateSubfolder={
                                    onCreateSubfolder
                                }
                                onRenameFolder={
                                    onRenameFolder
                                }
                                onMoveFolder={
                                    onMoveFolder
                                }
                            />
                        ),
                    )}
                </ul>
            )}
        </li>
    );
}