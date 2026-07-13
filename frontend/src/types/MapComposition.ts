export interface MapImageLayer {
    id: string;
    worldId: string;
    mapId: string;
    fileAttachmentId: string;
    fileName: string;
    contentType: string;
    name: string;
    positionX: number;
    positionY: number;
    scale: number;
    rotation: number;
    sortOrder: number;
    isVisible: boolean;
    isVisibleToPlayers: boolean;
    isLocked: boolean;
    opacity: number;
    createdAt: string;
    updatedAt: string | null;
}

export type SaveMapImageLayer = Omit<MapImageLayer,
    "id" | "worldId" | "mapId" | "fileName" | "contentType" | "createdAt" | "updatedAt"> & { id?: string };

export interface MapStrokePoint { x: number; y: number }

export interface MapDrawingStroke {
    id: string;
    worldId: string;
    mapId: string;
    color: string;
    width: number;
    isEraser: boolean;
    points: MapStrokePoint[];
    isVisibleToPlayers: boolean;
    createdAt: string;
    tool: "pen" | "eraser" | "line" | "arrow" | "rectangle" | "ellipse" | "polygon" | "text";
    fillColor: string;
    opacity: number;
    dashStyle: "solid" | "dashed" | "dotted";
    text: string;
    fontSize: number;
    hasTextBorder: boolean;
    rotation: number;
    sortOrder: number;
    isVisible: boolean;
    isLocked: boolean;
}
