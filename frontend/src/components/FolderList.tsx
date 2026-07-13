import { useState } from "react";
import type { Folder } from "../types/Folder";
import FolderCreateDialog from "./FolderCreateDialog";
import "./FolderNavigation.css";
import FolderTreeNode from "./FolderTreeNode";

interface Props {
    folders: Folder[];
    worldName: string | null;
    selectedFolderId: string | null;
    onSelectFolder: (folderId: string) => void;
    onCreateFolder: (
        name: string,
        parentFolderId: string | null,
    ) => Promise<Folder>;
    onRenameFolder: (
        folderId: string,
        name: string,
    ) => Promise<void>;
    onMoveFolder: (
        folderId: string,
        destinationFolderId: string | null,
    ) => Promise<void>;
}

interface CreateRequest {
    parentFolderId: string | null;
}

export default function FolderList({
    folders,
    worldName,
    selectedFolderId,
    onSelectFolder,
    onCreateFolder,
    onRenameFolder,
    onMoveFolder,
}: Props) {
    const [createRequest, setCreateRequest] =
        useState<CreateRequest | null>(null);

    const rootFolders = folders
        .filter(
            (folder) =>
                folder.parentFolderId === null,
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

    const openCreateDialog = (
        parentFolderId: string | null,
    ) => {
        setCreateRequest({ parentFolderId });
    };

    return (
        <section className="folder-navigation">
            <div className="folder-navigation-header">
                <div>
                    <span className="sidebar-section-kicker">
                        Biblioteka
                    </span>

                    <h2>Foldery</h2>
                </div>

                <button
                    type="button"
                    className="folder-create-button"
                    disabled={!worldName}
                    onClick={() =>
                        openCreateDialog(null)
                    }
                    aria-label="Utwórz folder"
                    title="Nowy folder"
                >
                    ＋
                </button>
            </div>

            {!worldName ? (
                <p className="sidebar-muted">
                    Najpierw wybierz świat.
                </p>
            ) : rootFolders.length === 0 ? (
                <p className="sidebar-muted">
                    Ten świat nie ma jeszcze folderów.
                </p>
            ) : (
                <ul className="folder-tree">
                    {rootFolders.map((folder) => (
                        <FolderTreeNode
                            key={folder.id}
                            folder={folder}
                            folders={folders}
                            level={0}
                            selectedFolderId={
                                selectedFolderId
                            }
                            onSelectFolder={
                                onSelectFolder
                            }
                            onCreateSubfolder={
                                openCreateDialog
                            }
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

            {createRequest && (
                <FolderCreateDialog
                    folders={folders}
                    initialParentFolderId={
                        createRequest.parentFolderId
                    }
                    onCreate={onCreateFolder}
                    onCreated={(folder) => {
                        setCreateRequest(null);
                        onSelectFolder(folder.id);
                    }}
                    onClose={() =>
                        setCreateRequest(null)
                    }
                />
            )}
        </section>
    );
}