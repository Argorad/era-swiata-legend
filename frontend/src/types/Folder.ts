export interface Folder {
    id: string;
    worldId: string;
    parentFolderId: string | null;
    name: string;
}