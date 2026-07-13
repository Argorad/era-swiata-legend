export interface Page {
    id: string;
    worldId: string;
    folderId: string;
    previousFolderId: string | null;
    title: string;
    content: string;
    createdAt: string;
    updatedAt: string | null;
}
