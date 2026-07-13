export interface MarkerCategory {
    id: string;
    worldId: string;
    name: string;
    icon: string;
    color: string;
    sortOrder: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string | null;
}

export interface SaveMarkerCategory {
    name: string;
    icon: string;
    color: string;
    sortOrder: number;
    isActive: boolean;
}
