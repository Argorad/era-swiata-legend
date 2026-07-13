export type FolderType = 0 | 1 | 2;

export interface Folder {
    id: string;
    worldId: string;
    parentFolderId: string | null;
    name: string;
    type: FolderType;
    isVisibleToPlayers: boolean;
    createdAt: string;
    updatedAt: string | null;
}
