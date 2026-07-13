export type WorldMapType = 0 | 1 | 2 | 3;
export type WorldMapStatus = 0 | 1;

export interface WorldMapModel {
    id: string;
    worldId: string;
    name: string;
    description: string;
    type: WorldMapType;
    imageFileId: string;
    isPublished: boolean;
    isGridVisible: boolean;
    gridSize: number;
    canvasBackground: "ocean" | "parchment" | "dark" | "solid";
    gridStyle: "lines" | "dots" | "hex";
    gridColor: string;
    gridOpacity: number;
    gridLineWidth: number;
    gridMajorEvery: number;
    isGridMajorVisible: boolean;
    isSnapToGridEnabled: boolean;
    isDrawingLayerVisible: boolean;
    isDrawingLayerLocked: boolean;
    isDrawingLayerVisibleToPlayers: boolean;
    status: WorldMapStatus;
    createdAt: string;
    updatedAt: string | null;
}

export interface SaveWorldMap {
    name: string;
    description: string;
    type: WorldMapType;
    imageFileId: string;
    isPublished: boolean;
}
