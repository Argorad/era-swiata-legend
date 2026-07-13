export interface FileAttachment {
    id: string;
    worldId: string;
    folderId: string;
    previousFolderId: string | null;
    originalName: string;
    size: number;
    contentType: string;
    isVisibleToPlayers: boolean;
    createdAt: string;
    updatedAt: string | null;
}
