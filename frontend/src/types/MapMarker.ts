export type MapMarkerStatus = 0 | 1 | 2;

export interface MapMarker {
    id: string;
    worldId: string;
    mapId: string;
    categoryId: string;
    categoryName: string;
    name: string;
    description: string;
    icon: string;
    color: string;
    positionX: number;
    positionY: number;
    isPublished: boolean;
    isPositionLocked: boolean;
    status: MapMarkerStatus;
    previousStatus: MapMarkerStatus | null;
    folderId: string | null;
    pageId: string | null;
    targetMapId: string | null;
    createdAt: string;
    updatedAt: string | null;
}

export interface SaveMapMarker {
    id?: string;
    categoryId: string;
    name: string;
    description: string;
    icon: string;
    color: string;
    positionX: number;
    positionY: number;
    isPublished: boolean;
    isPositionLocked: boolean;
    folderId: string | null;
    pageId: string | null;
    targetMapId: string | null;
}
