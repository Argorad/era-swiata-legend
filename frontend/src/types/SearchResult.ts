export interface SearchResult {
    type: "world" | "folder" | "page" | "file";
    id: string;
    worldId: string;
    folderId: string | null;
    pageId: string | null;
    name: string;
    breadcrumb: string;
    excerpt: string | null;
}
