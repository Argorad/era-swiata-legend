import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, PointerEvent as ReactPointerEvent, ReactNode, WheelEvent } from "react";
import axios from "axios";
import { api, apiBaseUrl } from "../services/api";
import type { Folder } from "../types/Folder";
import type { FileAttachment } from "../types/FileAttachment";
import type { MapDrawingStroke, MapImageLayer, MapStrokePoint, SaveMapImageLayer } from "../types/MapComposition";
import type { MapMarker, MapMarkerStatus, SaveMapMarker } from "../types/MapMarker";
import type { MarkerCategory, SaveMarkerCategory } from "../types/MarkerCategory";
import type { Page } from "../types/Page";
import type { SaveWorldMap, WorldMapModel } from "../types/WorldMap";
import { CategoryDialog, ConfirmDialog, LayerDialog, MapDialog, MarkerDialog } from "./MapGenieDialogs";
import MapAnnotationEditor from "./MapAnnotationEditor";
import MapContextMenu from "./MapContextMenu";
import MapTextDialog, { type MapTextStyle } from "./MapTextDialog";
import type { MapContextAction } from "./MapContextMenu";
import { useEditorHistory } from "../hooks/useEditorHistory";
import { continuesPrimaryDrawingGesture, createLocalDrawingId, hasMeaningfulDrawingDrag, screenToMapWorld, startsPrimaryDrawingGesture } from "../utils/mapDrawingGesture";
import "./MapGenie.css";

interface Props {
    worldId: string;
    worldName: string;
    folders: Folder[];
    pages: Page[];
    forcePlayerView?: boolean;
    onOpenFolder: (folderId: string, pageId?: string | null) => void;
}

type MarkerAction = "archive" | "trash" | "restore" | "delete";
type DrawTool = "pan" | "select" | "pen" | "eraser" | "line" | "arrow" | "text";
interface ConfirmState { kind: "marker"; marker: MapMarker; action: MarkerAction }
interface MapConfirmState { kind: "map"; map: WorldMapModel }
interface BaseLayerState { positionX: number; positionY: number; scale: number; rotation: number; opacity: number; isLocked: boolean; isVisible: boolean }

const mapTypeNames = ["Świat", "Region", "Miasto", "Loch"];
const statusNames = ["Aktywne", "Archiwum", "Trash"];
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const saveErrorMessage = (error: unknown, fallback: string) => {
    if (!axios.isAxiosError(error)) return fallback;
    const status = error.response?.status;
    const serverMessage = typeof error.response?.data === "object" && error.response?.data && "message" in error.response.data
        ? String(error.response.data.message) : "";
    return `${fallback}${status ? ` (HTTP ${status})` : ""}${serverMessage ? `: ${serverMessage}` : ""}`;
};
const defaultBaseLayer: BaseLayerState = { positionX: 0, positionY: 0, scale: 1, rotation: 0, opacity: 1, isLocked: true, isVisible: true };
const strokePath = (points: MapStrokePoint[]) => points.map((point, index) => `${index === 0 ? "M" : "L"}${point.x} ${point.y}`).join(" ");
const renderShape = (tool: string, points: MapStrokePoint[], color: string, width: number, fill: string, opacity: number, dashStyle: string, text: string, fontSize: number, key: string): ReactNode => {
    const first = points[0]; const last = points.at(-1);
    if (!first || !last) return null;
    const dash = dashStyle === "dashed" ? `${width * 4} ${width * 2}` : dashStyle === "dotted" ? `${width} ${width * 2}` : undefined;
    const common = { stroke: color, strokeWidth: width, fill, opacity, strokeDasharray: dash, vectorEffect: "non-scaling-stroke" as const };
    if (tool === "line" || tool === "arrow") return <line key={key} x1={first.x} y1={first.y} x2={last.x} y2={last.y} {...common} markerEnd={tool === "arrow" ? "url(#map-arrow-head)" : undefined} />;
    if (tool === "rectangle") return <rect key={key} x={Math.min(first.x,last.x)} y={Math.min(first.y,last.y)} width={Math.abs(last.x-first.x)} height={Math.abs(last.y-first.y)} {...common} />;
    if (tool === "ellipse") return <ellipse key={key} cx={(first.x+last.x)/2} cy={(first.y+last.y)/2} rx={Math.abs(last.x-first.x)/2} ry={Math.abs(last.y-first.y)/2} {...common} />;
    if (tool === "polygon") return <polygon key={key} points={points.map((point) => `${point.x},${point.y}`).join(" ")} {...common} />;
    if (tool === "text") return <text key={key} x={first.x} y={first.y} fill={color} stroke="none" opacity={opacity} fontSize={fontSize} fontFamily="Georgia, serif">{text}</text>;
    return <path key={key} d={strokePath(points)} fill="none" stroke={color} strokeWidth={width} strokeDasharray={dash} opacity={opacity} strokeLinecap="round" strokeLinejoin="round" />;
};

export default function WorldMap({ worldId, worldName, folders, pages, forcePlayerView, onOpenFolder }: Props) {
    const [maps, setMaps] = useState<WorldMapModel[]>([]);
    const [categories, setCategories] = useState<MarkerCategory[]>([]);
    const [markers, setMarkers] = useState<MapMarker[]>([]);
    const [imageLayers, setImageLayers] = useState<MapImageLayer[]>([]);
    const [drawingStrokes, setDrawingStrokes] = useState<MapDrawingStroke[]>([]);
    const [libraryImages, setLibraryImages] = useState<FileAttachment[]>([]);
    const [activeMapId, setActiveMapId] = useState("");
    const [markerStatus, setMarkerStatus] = useState<MapMarkerStatus>(0);
    const [manualPlayerView, setManualPlayerView] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [panelOpen, setPanelOpen] = useState(true);
    const [editMode, setEditMode] = useState(false);
    const [workspaceFullscreen, setWorkspaceFullscreen] = useState(false);
    const [nativeFullscreen, setNativeFullscreen] = useState(false);
    const [saveState, setSaveState] = useState<"saved" | "saving" | "failed">("saved");
    const [protectLocked, setProtectLocked] = useState(true);
    const [notice, setNotice] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [hiddenCategories, setHiddenCategories] = useState<Set<string>>(() => new Set());
    const [selectedMarker, setSelectedMarker] = useState<MapMarker | null>(null);
    const [mapDialog, setMapDialog] = useState<WorldMapModel | null | undefined>(undefined);
    const [categoryDialog, setCategoryDialog] = useState<MarkerCategory | null | undefined>(undefined);
    const [markerDialog, setMarkerDialog] = useState<MapMarker | null | undefined>(undefined);
    const [layerDialog, setLayerDialog] = useState<MapImageLayer | null | undefined>(undefined);
    const [layerInsertPosition, setLayerInsertPosition] = useState<{ x: number; y: number } | null>(null);
    const [newPosition, setNewPosition] = useState({ x: 0.5, y: 0.5 });
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; nx: number; ny: number; cx: number; cy: number; kind: "empty" | "marker" | "layer" | "annotation"; id?: string } | null>(null);
    const [addMode, setAddMode] = useState(false);
    const [confirmState, setConfirmState] = useState<ConfirmState | MapConfirmState | null>(null);
    const [isActing, setIsActing] = useState(false);
    const [clearDrawingsConfirm, setClearDrawingsConfirm] = useState(false);
    const [layerToDelete, setLayerToDelete] = useState<MapImageLayer | null>(null);
    const [zoom, setZoom] = useState(1);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [viewportSize, setViewportSize] = useState({ width: 900, height: 600 });
    const [imageSize, setImageSize] = useState({ width: 1200, height: 800 });
    const [drawTool, setDrawTool] = useState<DrawTool>("pan");
    const [drawColor, setDrawColor] = useState("#9d2f32");
    const [drawWidth, setDrawWidth] = useState(5);
    const [drawFill, setDrawFill] = useState("transparent");
    const [drawOpacity, setDrawOpacity] = useState(1);
    const [drawDash, setDrawDash] = useState<"solid" | "dashed" | "dotted">("solid");
    const drawText = "Notatka";
    const drawFontSize = 24;
    const [drawTextBorder, setDrawTextBorder] = useState(true);
    const [drawVisibleToPlayers, setDrawVisibleToPlayers] = useState(true);
    const [createMany, setCreateMany] = useState(false);
    const [currentStroke, setCurrentStroke] = useState<MapStrokePoint[] | null>(null);
    const [textPosition, setTextPosition] = useState<MapStrokePoint | null>(null);
    const [baseLayer, setBaseLayer] = useState<BaseLayerState>(defaultBaseLayer);
    const [deleteBaseConfirm, setDeleteBaseConfirm] = useState(false);
    const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | null>(null);
    const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
    const viewportRef = useRef<HTMLDivElement>(null);
    const moduleRef = useRef<HTMLElement>(null);
    const canvasRef = useRef<HTMLDivElement>(null);
    const pointerRef = useRef(new Map<number, { x: number; y: number }>());
    const panRef = useRef<{ x: number; y: number; offsetX: number; offsetY: number } | null>(null);
    const pinchRef = useRef<number | null>(null);
    const dragMarkerRef = useRef<string | null>(null);
    const markerDragStartRef = useRef<MapMarker | null>(null);
    const dragLayerRef = useRef<{ id: string; startX: number; startY: number; x: number; y: number } | null>(null);
    const drawingPointerRef = useRef<number | null>(null);
    const baseDragRef = useRef<{ startX: number; startY: number; before: BaseLayerState } | null>(null);
    const rotationRef = useRef<{ id: string; beforeRotation: number; centerX: number; centerY: number; pointerAngle: number } | null>(null);
    const pendingSavesRef = useRef(new Map<string, () => Promise<void>>());
    const savedDrawingsRef = useRef(new Map<string, MapDrawingStroke>());
    const history = useEditorHistory((message) => { setError(message); setSaveState("failed"); });
    const clearHistory = history.clear;
    const clearTransientMapState = useCallback(() => {
        setCurrentStroke(null);
        drawingPointerRef.current = null;
        setSelectedAnnotationId(null);
        setSelectedLayerId(null);
        setContextMenu(null);
        dragLayerRef.current = null;
        baseDragRef.current = null;
        rotationRef.current = null;
    }, []);

    const playerView = forcePlayerView ? true : manualPlayerView;

    const activeMap = maps.find((map) => map.id === activeMapId) ?? null;
    const selectedAnnotation = drawingStrokes.find((stroke) => stroke.id === selectedAnnotationId) ?? null;
    const selectedImageLayer = imageLayers.find((layer) => layer.id === selectedLayerId) ?? null;
    const fitScale = Math.min(viewportSize.width / imageSize.width, viewportSize.height / imageSize.height);
    const actualScale = fitScale * zoom;
    const drawingInputActive = editMode && !playerView && ["pen", "eraser", "line", "arrow", "text"].includes(drawTool);
    const baseStorageKey = activeMapId ? `mapgenie:base-layer:${worldId}:${activeMapId}` : "";

    const applyBaseLayer = useCallback((value: BaseLayerState) => {
        setBaseLayer(value);
        if (baseStorageKey) localStorage.setItem(baseStorageKey, JSON.stringify(value));
    }, [baseStorageKey]);

    const updateBaseLayer = (changes: Partial<BaseLayerState>, label: string) => {
        if (!editMode) { setNotice("Włącz Tryb edycji"); return; }
        if (baseLayer.isLocked && changes.isLocked !== false) { setNotice("Element jest zablokowany"); return; }
        const before = { ...baseLayer };
        const after = { ...baseLayer, ...changes };
        applyBaseLayer(after);
        history.record({ label, undo: () => Promise.resolve(applyBaseLayer(before)), redo: () => Promise.resolve(applyBaseLayer(after)) });
    };

    useEffect(() => {
        if (!baseStorageKey) return;
        const stored = localStorage.getItem(baseStorageKey);
        const frame = requestAnimationFrame(() => {
            try { setBaseLayer(stored ? { ...defaultBaseLayer, ...JSON.parse(stored) as BaseLayerState } : defaultBaseLayer); }
            catch { setBaseLayer(defaultBaseLayer); }
            setSelectedLayerId(null);
        });
        return () => cancelAnimationFrame(frame);
    }, [baseStorageKey]);
    const resetView = useCallback(() => {
        clearTransientMapState();
        const scale = Math.min(viewportSize.width / imageSize.width, viewportSize.height / imageSize.height);
        setZoom(1);
        setOffset({ x: (viewportSize.width - imageSize.width * scale) / 2, y: (viewportSize.height - imageSize.height * scale) / 2 });
    }, [clearTransientMapState, imageSize, viewportSize]);

    const loadMapsAndCategories = useCallback(async () => {
        try {
            setIsLoading(true);
            const [mapResponse, categoryResponse] = await Promise.all([
                api.get<WorldMapModel[]>(`/worlds/${worldId}/maps`, { params: { playerView } }),
                api.get<MarkerCategory[]>(`/worlds/${worldId}/map-categories`, { params: { playerView } }),
            ]);
            setMaps(mapResponse.data);
            setCategories(categoryResponse.data);
            setActiveMapId((current) => mapResponse.data.some((item) => item.id === current) ? current : (mapResponse.data.find((item) => item.status === 0)?.id ?? mapResponse.data[0]?.id ?? ""));
            setError(null);
        } catch { setError("Nie udało się pobrać map i kategorii."); }
        finally { setIsLoading(false); }
    }, [playerView, worldId]);

    const loadMarkers = useCallback(async () => {
        if (!activeMapId) { setMarkers([]); return; }
        try {
            const response = await api.get<MapMarker[]>(`/worlds/${worldId}/maps/${activeMapId}/markers`, { params: { playerView, status: markerStatus } });
            setMarkers(response.data);
            setSelectedMarker((current) => response.data.find((item) => item.id === current?.id) ?? null);
            setError(null);
        } catch { setError("Nie udało się pobrać markerów aktywnej mapy."); }
    }, [activeMapId, markerStatus, playerView, worldId]);

    const loadComposition = useCallback(async () => {
        if (!activeMapId) { setImageLayers([]); setDrawingStrokes([]); return; }
        try {
            const [layersResponse, strokesResponse, imagesResponse] = await Promise.all([
                api.get<MapImageLayer[]>(`/worlds/${worldId}/maps/${activeMapId}/layers`, { params: { playerView } }),
                api.get<MapDrawingStroke[]>(`/worlds/${worldId}/maps/${activeMapId}/drawings`, { params: { playerView } }),
                playerView ? Promise.resolve({ data: [] as FileAttachment[] }) : api.get<FileAttachment[]>(`/worlds/${worldId}/map-images`),
            ]);
            setImageLayers(layersResponse.data);
            setDrawingStrokes(strokesResponse.data);
            savedDrawingsRef.current = new Map(strokesResponse.data.map((stroke) => [stroke.id, structuredClone(stroke)]));
            setLibraryImages(imagesResponse.data);
        } catch { setError("Nie udało się pobrać warstw kompozycji mapy."); }
    }, [activeMapId, playerView, worldId]);

    useEffect(() => {
        const frame = requestAnimationFrame(() => void loadMapsAndCategories());
        return () => cancelAnimationFrame(frame);
    }, [loadMapsAndCategories]);
    useEffect(() => {
        const frame = requestAnimationFrame(() => void loadMarkers());
        return () => cancelAnimationFrame(frame);
    }, [loadMarkers]);
    useEffect(() => {
        const frame = requestAnimationFrame(() => void loadComposition());
        return () => cancelAnimationFrame(frame);
    }, [loadComposition]);
    useEffect(() => {
        const frame = requestAnimationFrame(() => {
            setSelectedMarker(null);
            clearTransientMapState();
            setImageSize({ width: 1200, height: 800 });
            setEditMode(false);
            setDrawTool("pan");
            clearHistory();
        });
        return () => cancelAnimationFrame(frame);
    }, [activeMapId, clearHistory, clearTransientMapState]);
    useEffect(() => {
        const element = viewportRef.current;
        if (!element) return;
        const update = () => setViewportSize({ width: element.clientWidth, height: element.clientHeight });
        update();
        const observer = new ResizeObserver(update);
        observer.observe(element);
        return () => observer.disconnect();
    }, [activeMapId]);
    useEffect(() => {
        const frame = requestAnimationFrame(resetView);
        return () => cancelAnimationFrame(frame);
    }, [resetView]);
    useEffect(() => {
        const frame = requestAnimationFrame(clearTransientMapState);
        return () => cancelAnimationFrame(frame);
    }, [clearTransientMapState, drawTool]);
    useEffect(() => {
        const changed = () => {
            const active = document.fullscreenElement === moduleRef.current;
            setNativeFullscreen(active);
            if (!document.fullscreenElement) setWorkspaceFullscreen(false);
        };
        document.addEventListener("fullscreenchange", changed);
        return () => document.removeEventListener("fullscreenchange", changed);
    }, []);
    useEffect(() => {
        const warn = (event: BeforeUnloadEvent) => {
            if (saveState === "saved") return;
            event.preventDefault();
        };
        window.addEventListener("beforeunload", warn);
        return () => window.removeEventListener("beforeunload", warn);
    }, [saveState]);
    useEffect(() => {
        if (!contextMenu) return;
        const close = (event: MouseEvent) => {
            if (!(event.target as HTMLElement).closest(".map-context-menu")) setContextMenu(null);
        };
        const escape = (event: KeyboardEvent) => { if (event.key === "Escape") setContextMenu(null); };
        document.addEventListener("pointerdown", close);
        document.addEventListener("keydown", escape);
        return () => { document.removeEventListener("pointerdown", close); document.removeEventListener("keydown", escape); };
    }, [contextMenu]);
    useEffect(() => {
        const shortcut = (event: KeyboardEvent) => {
            if (!editMode || playerView || event.defaultPrevented ||
                (event.target as HTMLElement)?.matches("input,textarea,select,[contenteditable=true]")) return;
            if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") {
                event.preventDefault(); void (event.shiftKey ? history.redo() : history.undo());
            } else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "y") {
                event.preventDefault(); void history.redo();
            } else if (event.key === "Escape") {
                clearTransientMapState();
            }
        };
        window.addEventListener("keydown", shortcut);
        return () => window.removeEventListener("keydown", shortcut);
    });

    const filteredMarkers = useMemo(() => {
        const query = search.trim().toLocaleLowerCase("pl");
        return markers.filter((marker) => !hiddenCategories.has(marker.categoryId) && (!query || `${marker.name} ${marker.description}`.toLocaleLowerCase("pl").includes(query)));
    }, [hiddenCategories, markers, search]);

    const categoryCounts = useMemo(() => markers.reduce<Record<string, number>>((counts, marker) => {
        counts[marker.categoryId] = (counts[marker.categoryId] ?? 0) + 1;
        return counts;
    }, {}), [markers]);

    const pointOnMap = (clientX: number, clientY: number) => {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect || rect.width === 0 || rect.height === 0) return null;
        return { x: clamp((clientX - rect.left) / rect.width, 0, 1), y: clamp((clientY - rect.top) / rect.height, 0, 1) };
    };

    const pointOnCanvas = (clientX: number, clientY: number): MapStrokePoint | null => {
        const rect = viewportRef.current?.getBoundingClientRect();
        if (!rect || actualScale <= 0) return null;
        return screenToMapWorld(clientX, clientY, {
            viewportLeft: rect.left, viewportTop: rect.top,
            offsetX: offset.x, offsetY: offset.y, scale: actualScale,
        });
    };

    const saveMap = async (value: SaveWorldMap) => {
        const response = mapDialog
            ? await api.put<WorldMapModel>(`/worlds/${worldId}/maps/${mapDialog.id}`, value)
            : await api.post<WorldMapModel>(`/worlds/${worldId}/maps`, value);
        setMaps((current) => mapDialog ? current.map((item) => item.id === response.data.id ? response.data : item) : [...current, response.data]);
        setActiveMapId(response.data.id);
        if (!mapDialog) {
            const categoriesResponse = await api.get<MarkerCategory[]>(`/worlds/${worldId}/map-categories`, { params: { playerView: false } });
            setCategories(categoriesResponse.data);
        }
    };

    const retryUnsaved = async () => {
        const pending = [...pendingSavesRef.current.entries()];
        if (!pending.length) { setSaveState("saved"); return; }
        setSaveState("saving");
        let failed = false;
        for (const [key, retry] of pending) {
            try { await retry(); pendingSavesRef.current.delete(key); }
            catch { failed = true; }
        }
        setSaveState(failed ? "failed" : "saved");
        if (failed) setError("Część zmian nadal nie została zapisana. Możesz ponowić próbę.");
    };
    const changeActiveMap = (mapId: string) => {
        if (pendingSavesRef.current.size && !window.confirm("Nie wszystkie zmiany zostały zapisane. Opuścić bieżącą mapę?")) return;
        clearTransientMapState();
        setActiveMapId(mapId);
    };

    const saveCategory = async (value: SaveMarkerCategory) => {
        const response = categoryDialog
            ? await api.put<MarkerCategory>(`/worlds/${worldId}/map-categories/${categoryDialog.id}`, value)
            : await api.post<MarkerCategory>(`/worlds/${worldId}/map-categories`, value);
        setCategories((current) => (categoryDialog ? current.map((item) => item.id === response.data.id ? response.data : item) : [...current, response.data]).sort((a, b) => a.sortOrder - b.sortOrder));
    };

    const markerPayload = (marker: MapMarker): SaveMapMarker => ({
        categoryId: marker.categoryId, name: marker.name, description: marker.description,
        icon: marker.icon, color: marker.color, positionX: marker.positionX,
        positionY: marker.positionY, isPublished: marker.isPublished,
        isPositionLocked: marker.isPositionLocked, folderId: marker.folderId,
        pageId: marker.pageId, targetMapId: marker.targetMapId,
    });
    const applyMarker = async (snapshot: MapMarker) => {
        const saved = (await api.put<MapMarker>(`/worlds/${worldId}/maps/${activeMapId}/markers/${snapshot.id}`, markerPayload(snapshot))).data;
        setMarkers((items) => items.map((item) => item.id === saved.id ? saved : item));
        setSelectedMarker(saved);
    };
    const recordCreatedMarker = (created: MapMarker, label: string) => {
        const hide = async () => { await api.patch(`/worlds/${worldId}/maps/${activeMapId}/markers/${created.id}/trash`); setMarkers((items) => items.filter((item) => item.id !== created.id)); setSelectedMarker(null); };
        const restore = async () => { const saved=(await api.patch<MapMarker>(`/worlds/${worldId}/maps/${activeMapId}/markers/${created.id}/restore`)).data; setMarkers((items) => [...items.filter((item)=>item.id!==saved.id),saved]); setSelectedMarker(saved); };
        history.record({ label, undo: hide, redo: restore });
    };
    const saveMarker = async (value: SaveMapMarker) => {
        if (!activeMapId) return;
        const before = markerDialog;
        const response = markerDialog
            ? await api.put<MapMarker>(`/worlds/${worldId}/maps/${activeMapId}/markers/${markerDialog.id}`, value)
            : await api.post<MapMarker>(`/worlds/${worldId}/maps/${activeMapId}/markers`, value);
        setMarkers((current) => markerDialog ? current.map((item) => item.id === response.data.id ? response.data : item) : [...current, response.data]);
        setSelectedMarker(response.data);
        if (before) history.record({ label: "Edycja markera", undo: () => applyMarker(before), redo: () => applyMarker(response.data) });
        else recordCreatedMarker(response.data, "Dodanie markera");
    };

    const saveLayer = async (value: SaveMapImageLayer) => {
        setSaveState("saving");
        try {
            const response = layerDialog
                ? await api.put<MapImageLayer>(`/worlds/${worldId}/maps/${activeMapId}/layers/${layerDialog.id}`, value)
                : await api.post<MapImageLayer>(`/worlds/${worldId}/maps/${activeMapId}/layers`, value);
            setImageLayers((current) => (layerDialog
                ? current.map((item) => item.id === response.data.id ? response.data : item)
                : [...current, response.data]).sort((a, b) => a.sortOrder - b.sortOrder));
            if (layerDialog) {
                const before = layerDialog; const after = response.data;
                history.record({label:"Edycja warstwy obrazu",undo:()=>applyLayer(before),redo:()=>applyLayer(after)});
            } else {
                const created = response.data;
                const remove = async()=>{if(created.isLocked) await applyLayer({...created,isLocked:false});await api.delete(`/worlds/${worldId}/maps/${activeMapId}/layers/${created.id}`);setImageLayers(items=>items.filter(item=>item.id!==created.id));};
                const restore = async()=>{const restored=(await api.post<MapImageLayer>(`/worlds/${worldId}/maps/${activeMapId}/layers`,{...value,id:created.id})).data;setImageLayers(items=>[...items,restored].sort((a,b)=>a.sortOrder-b.sortOrder));};
                history.record({label:"Dodanie obrazu",undo:remove,redo:restore});
            }
            setSaveState(pendingSavesRef.current.size ? "failed" : "saved");
        } catch (reason) {
            setSaveState("failed");
            throw reason;
        }
    };

    const applyLayer = async (snapshot: MapImageLayer) => {
        const payload: SaveMapImageLayer = { fileAttachmentId:snapshot.fileAttachmentId, name:snapshot.name,
            positionX:snapshot.positionX, positionY:snapshot.positionY, scale:snapshot.scale,
            rotation:snapshot.rotation, sortOrder:snapshot.sortOrder, isVisible:snapshot.isVisible,
            isVisibleToPlayers:snapshot.isVisibleToPlayers, isLocked:snapshot.isLocked, opacity:snapshot.opacity ?? 1 };
        const response = await api.put<MapImageLayer>(`/worlds/${worldId}/maps/${activeMapId}/layers/${snapshot.id}`,payload);
        setImageLayers((items)=>items.map((item)=>item.id===snapshot.id?response.data:item).sort((a,b)=>a.sortOrder-b.sortOrder));
    };
    const updateLayer = async (layer: MapImageLayer, changes: Partial<SaveMapImageLayer>, recordHistory = true) => {
        if (!editMode) { setNotice("Włącz Tryb edycji"); return; }
        if (layer.isLocked && changes.isLocked !== false) { setNotice("Element jest zablokowany"); return; }
        const payload: SaveMapImageLayer = {
            fileAttachmentId: layer.fileAttachmentId, name: layer.name,
            positionX: layer.positionX, positionY: layer.positionY,
            scale: layer.scale, rotation: layer.rotation, sortOrder: layer.sortOrder,
            isVisible: layer.isVisible, isVisibleToPlayers: layer.isVisibleToPlayers,
            isLocked: layer.isLocked, opacity: layer.opacity ?? 1, ...changes,
        };
        const optimistic = { ...layer, ...changes };
        setImageLayers((current) => current.map((item) => item.id === layer.id ? optimistic : item).sort((a, b) => a.sortOrder - b.sortOrder));
        setSaveState("saving");
        try {
            const response = await api.put<MapImageLayer>(`/worlds/${worldId}/maps/${activeMapId}/layers/${layer.id}`, payload);
            setImageLayers((current) => current.map((item) => item.id === layer.id ? response.data : item).sort((a, b) => a.sortOrder - b.sortOrder));
            if (recordHistory && JSON.stringify(layer) !== JSON.stringify(response.data)) history.record({
                label: "Zmiana warstwy obrazu", undo: () => applyLayer(layer), redo: () => applyLayer(response.data),
            });
            pendingSavesRef.current.delete(`layer:${layer.id}`);
            setSaveState(pendingSavesRef.current.size ? "failed" : "saved");
        } catch {
            setSaveState("failed");
            setError("Nie zapisano zmiany warstwy. Zmiana pozostała widoczna lokalnie; użyj „Ponów zapis”.");
            pendingSavesRef.current.set(`layer:${layer.id}`, async () => {
                const saved=(await api.put<MapImageLayer>(`/worlds/${worldId}/maps/${activeMapId}/layers/${layer.id}`,payload)).data;
                setImageLayers((items)=>items.map((item)=>item.id===saved.id?saved:item).sort((a,b)=>a.sortOrder-b.sortOrder));
            });
        }
    };

    const configureDrawingLayer = async (changes: Partial<Pick<WorldMapModel,"isDrawingLayerVisible"|"isDrawingLayerLocked"|"isDrawingLayerVisibleToPlayers">>, recordHistory = true) => {
        if (!activeMap) return;
        const response = await api.patch<WorldMapModel>(`/worlds/${worldId}/maps/${activeMap.id}/drawing-layer`, {
            isVisible: changes.isDrawingLayerVisible ?? activeMap.isDrawingLayerVisible,
            isLocked: changes.isDrawingLayerLocked ?? activeMap.isDrawingLayerLocked,
            isVisibleToPlayers: changes.isDrawingLayerVisibleToPlayers ?? activeMap.isDrawingLayerVisibleToPlayers,
        });
        setMaps((items)=>items.map((item)=>item.id===response.data.id?response.data:item));
        if (recordHistory) {
            const before=activeMap; const after=response.data;
            const apply=async(value:WorldMapModel)=>{const saved=(await api.patch<WorldMapModel>(`/worlds/${worldId}/maps/${activeMap.id}/drawing-layer`,{isVisible:value.isDrawingLayerVisible,isLocked:value.isDrawingLayerLocked,isVisibleToPlayers:value.isDrawingLayerVisibleToPlayers})).data;setMaps(items=>items.map(item=>item.id===saved.id?saved:item));};
            history.record({label:"Ustawienia warstwy rysunków",undo:()=>apply(before),redo:()=>apply(after)});
        }
    };
    const drawingPayload = (stroke: MapDrawingStroke) => ({
        color: stroke.color, width: stroke.width, isEraser: stroke.isEraser,
        points: stroke.points, isVisibleToPlayers: stroke.isVisibleToPlayers,
        tool: stroke.tool, fillColor: stroke.fillColor, opacity: stroke.opacity,
        dashStyle: stroke.dashStyle, text: stroke.text, fontSize: stroke.fontSize,
        hasTextBorder: stroke.hasTextBorder,
        rotation: stroke.rotation, sortOrder: stroke.sortOrder,
        isVisible: stroke.isVisible, isLocked: stroke.isLocked,
    });
    const addTextAt = async (point: MapStrokePoint, style: MapTextStyle) => {
        const localId = createLocalDrawingId();
        const optimistic: MapDrawingStroke = {
            id: localId, worldId, mapId: activeMapId, createdAt: new Date().toISOString(),
            color: style.color, width: drawWidth, isEraser: false, points: [point, point],
            isVisibleToPlayers: drawVisibleToPlayers, tool: "text", fillColor: style.fillColor,
            opacity: drawOpacity, dashStyle: drawDash, text: style.text,
            fontSize: style.fontSize, hasTextBorder: style.hasBorder, rotation: 0,
            sortOrder: drawingStrokes.length * 10, isVisible: true, isLocked: false,
        };
        setDrawingStrokes((items)=>[...items,optimistic]); setSaveState("saving");
        const finish = async () => {
            const created=(await api.post<MapDrawingStroke>(`/worlds/${worldId}/maps/${activeMapId}/drawings`,drawingPayload(optimistic))).data;
            setDrawingStrokes((items)=>items.map((item)=>item.id===localId?created:item));
            savedDrawingsRef.current.set(created.id, structuredClone(created));
            pendingSavesRef.current.delete(`drawing:${localId}`);
            const remove=async()=>{await api.delete(`/worlds/${worldId}/maps/${activeMapId}/drawings/${created.id}`);setDrawingStrokes(items=>items.filter(item=>item.id!==created.id));};
            const restore=async()=>{const saved=(await api.post<MapDrawingStroke>(`/worlds/${worldId}/maps/${activeMapId}/drawings`,{...drawingPayload(created),id:created.id})).data;setDrawingStrokes(items=>[...items,saved]);};
            history.record({label:"Dodanie tekstu",undo:remove,redo:restore});
            setSaveState(pendingSavesRef.current.size ? "failed" : "saved");
        };
        try { await finish(); }
        catch (error) { pendingSavesRef.current.set(`drawing:${localId}`,finish);setSaveState("failed");setError(saveErrorMessage(error,"Tekst pozostał lokalnie, ale nie został zapisany")); }
        if (!createMany) setDrawTool("select");
    };
    const applyDrawing = async (stroke: MapDrawingStroke) => {
        setDrawingStrokes((current) => current.map((item) => item.id === stroke.id ? stroke : item));
        setSaveState("saving");
        const response = await api.put<MapDrawingStroke>(`/worlds/${worldId}/maps/${activeMapId}/drawings/${stroke.id}`, drawingPayload(stroke));
        setDrawingStrokes((current) => current.map((item) => item.id === stroke.id ? response.data : item));
        savedDrawingsRef.current.set(response.data.id, structuredClone(response.data));
        setSaveState(pendingSavesRef.current.size ? "failed" : "saved");
    };
    const commitDrawing = async (before: MapDrawingStroke, after: MapDrawingStroke, label: string) => {
        if (before.id.startsWith("local-")) { setNotice("Najpierw ponów zapis tej adnotacji"); return; }
        const persistedBefore = savedDrawingsRef.current.get(before.id) ?? before;
        const changedWhileLocked = persistedBefore.isLocked && (after.isLocked || JSON.stringify({ ...persistedBefore, isLocked: false }) !== JSON.stringify({ ...after, isLocked: false }));
        if (activeMap?.isDrawingLayerLocked || changedWhileLocked) {
            setNotice("Element jest zablokowany"); setDrawingStrokes((current) => current.map((item) => item.id === persistedBefore.id ? persistedBefore : item)); return;
        }
        try {
            await applyDrawing(after);
            history.record({ label, undo: () => applyDrawing(persistedBefore), redo: () => applyDrawing(after) });
        } catch {
            setSaveState("failed"); setError("Nie zapisano adnotacji. Zmiana pozostała lokalnie.");
            pendingSavesRef.current.set(`drawing:${after.id}`, () => applyDrawing(after));
        }
    };
    const selectAnnotation = (stroke: MapDrawingStroke | null) => {
        setSelectedAnnotationId(stroke?.id ?? null);
        if (stroke) setDrawingStrokes((current) => current.map((item) => item.id === stroke.id ? stroke : item));
    };
    const deleteAnnotation = async (initial: MapDrawingStroke) => {
        if (initial.id.startsWith("local-")) {
            pendingSavesRef.current.delete(`drawing:${initial.id}`);
            setDrawingStrokes((items)=>items.filter((item)=>item.id!==initial.id));
            setSelectedAnnotationId(null);
            setSaveState(pendingSavesRef.current.size ? "failed" : "saved");
            return;
        }
        if (activeMap?.isDrawingLayerLocked || initial.isLocked) { setNotice("Element jest zablokowany"); return; }
        const remove = async () => {
            await api.delete(`/worlds/${worldId}/maps/${activeMapId}/drawings/${initial.id}`);
            setDrawingStrokes((items) => items.filter((item) => item.id !== initial.id));
            setSelectedAnnotationId(null);
        };
        const restore = async () => {
            const response = await api.post<MapDrawingStroke>(`/worlds/${worldId}/maps/${activeMapId}/drawings`, { ...drawingPayload(initial), id: initial.id });
            setDrawingStrokes((items) => [...items, response.data].sort((a,b) => a.sortOrder-b.sortOrder));
        };
        await remove();
        history.record({ label: "Usunięcie adnotacji", undo: restore, redo: remove });
    };
    useEffect(() => {
        const removeSelected = (event: KeyboardEvent) => {
            if (!editMode || playerView || !selectedAnnotation ||
                (event.target as HTMLElement)?.matches("input,textarea,select,[contenteditable=true]")) return;
            if (event.key === "Delete" || event.key === "Backspace") {
                event.preventDefault(); void deleteAnnotation(selectedAnnotation);
            }
        };
        window.addEventListener("keydown", removeSelected);
        return () => window.removeEventListener("keydown", removeSelected);
    });

    const patchMarker = async (marker: MapMarker, route: string) => {
        const response = await api.patch<MapMarker>(`/worlds/${worldId}/maps/${activeMapId}/markers/${marker.id}/${route}`);
        if ((route === "archive" && markerStatus !== 1) || (route === "trash" && markerStatus !== 2) || route === "restore") {
            setMarkers((current) => current.filter((item) => item.id !== marker.id)); setSelectedMarker(null);
        } else {
            setMarkers((current) => current.map((item) => item.id === marker.id ? response.data : item)); setSelectedMarker(response.data);
            if (route === "publish" || route === "hide") {
                const after=response.data;
                const apply=async(nextRoute:string)=>{const saved=(await api.patch<MapMarker>(`/worlds/${worldId}/maps/${activeMapId}/markers/${marker.id}/${nextRoute}`)).data;setMarkers(items=>items.map(item=>item.id===saved.id?saved:item));setSelectedMarker(saved);};
                history.record({label:"Widoczność markera",undo:()=>apply(route==="publish"?"hide":"publish"),redo:()=>apply(route)});
                setSelectedMarker(after);
            }
        }
        if (["archive","trash","restore"].includes(route)) {
            const inverse = route === "restore" ? (marker.status === 1 ? "archive" : "trash") : "restore";
            const apply = async (nextRoute:string) => { await api.patch(`/worlds/${worldId}/maps/${activeMapId}/markers/${marker.id}/${nextRoute}`); await loadMarkers(); };
            history.record({ label: "Zmiana stanu markera", undo: () => apply(inverse), redo: () => apply(route) });
        }
    };

    const setMarkerLock = async (marker: MapMarker, locked: boolean) => {
        const response = await api.patch<MapMarker>(`/worlds/${worldId}/maps/${activeMapId}/markers/${marker.id}/lock`, { isLocked: locked });
        const after = response.data;
        setMarkers((items) => items.map((item) => item.id === after.id ? after : item));
        setSelectedMarker(after);
        const apply = async (value:boolean) => { const saved=(await api.patch<MapMarker>(`/worlds/${worldId}/maps/${activeMapId}/markers/${marker.id}/lock`,{isLocked:value})).data; setMarkers(items=>items.map(item=>item.id===saved.id?saved:item)); setSelectedMarker(saved); };
        history.record({ label: "Blokada markera", undo: () => apply(marker.isPositionLocked), redo: () => apply(after.isPositionLocked) });
    };

    const runConfirmedAction = async () => {
        if (!confirmState) return;
        try {
            setIsActing(true);
            if (confirmState.kind === "map") {
                const response = await api.patch<WorldMapModel>(`/worlds/${worldId}/maps/${confirmState.map.id}/archive`);
                setMaps((current) => current.map((item) => item.id === response.data.id ? response.data : item));
                if (activeMapId === response.data.id) setActiveMapId(maps.find((item) => item.id !== response.data.id && item.status === 0)?.id ?? response.data.id);
            } else if (confirmState.action === "delete") {
                const deleted = confirmState.marker;
                const remove = async () => { await api.delete(`/worlds/${worldId}/maps/${activeMapId}/markers/${deleted.id}`); setMarkers((current) => current.filter((item) => item.id !== deleted.id)); setSelectedMarker(null); };
                const restore = async () => { await api.post(`/worlds/${worldId}/maps/${activeMapId}/markers`, { ...markerPayload(deleted), id: deleted.id }); const restored=(await api.patch<MapMarker>(`/worlds/${worldId}/maps/${activeMapId}/markers/${deleted.id}/trash`)).data; setMarkers((items)=>[...items.filter((item)=>item.id!==restored.id),restored]); };
                await remove();
                history.record({ label: "Trwałe usunięcie markera", undo: restore, redo: remove });
            } else {
                await patchMarker(confirmState.marker, confirmState.action);
            }
            setConfirmState(null);
        } catch { setError("Nie udało się wykonać operacji."); }
        finally { setIsActing(false); }
    };

    const zoomAt = (nextZoom: number, clientX?: number, clientY?: number) => {
        clearTransientMapState();
        const bounded = clamp(nextZoom, 0.05, 8);
        const viewportRect = viewportRef.current?.getBoundingClientRect();
        const px = clientX !== undefined && viewportRect ? clientX - viewportRect.left : viewportSize.width / 2;
        const py = clientY !== undefined && viewportRect ? clientY - viewportRect.top : viewportSize.height / 2;
        const oldScale = fitScale * zoom;
        const nextScale = fitScale * bounded;
        setOffset((current) => ({ x: px - ((px - current.x) / oldScale) * nextScale, y: py - ((py - current.y) / oldScale) * nextScale }));
        setZoom(bounded);
    };

    const onWheel = (event: WheelEvent<HTMLDivElement>) => { event.preventDefault(); zoomAt(zoom * (event.deltaY < 0 ? 1.12 : 0.89), event.clientX, event.clientY); };
    const annotationAt = (point: MapStrokePoint) => drawingStrokes
        .filter((stroke) => stroke.isVisible && !stroke.isEraser && !stroke.isLocked)
        .map((stroke) => {
            const xs = stroke.points.map((item) => item.x); const ys = stroke.points.map((item) => item.y);
            const minX = Math.min(...xs) - Math.max(12, stroke.width); const maxX = Math.max(...xs) + Math.max(12, stroke.width);
            const minY = Math.min(...ys) - Math.max(12, stroke.width); const maxY = Math.max(...ys) + Math.max(12, stroke.width, stroke.tool === "text" ? stroke.fontSize : 0);
            const distance = point.x >= minX && point.x <= maxX && point.y >= minY && point.y <= maxY ? 0 : Math.hypot(point.x-(minX+maxX)/2, point.y-(minY+maxY)/2);
            return { stroke, distance };
        }).sort((a,b) => a.distance-b.distance)[0]?.stroke;
    const onViewportPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
        if ((event.target as HTMLElement).closest(".mapgenie-marker, .map-context-menu, .map-image-layer, .map-annotation")) return;
        if (editMode && drawTool !== "pan" && drawTool !== "select") {
            if (!startsPrimaryDrawingGesture(event)) return;
            const point = pointOnCanvas(event.clientX, event.clientY);
            if (activeMap?.isDrawingLayerLocked) { setNotice("Element jest zablokowany"); return; }
            if (point && drawTool === "eraser") {
                const target = annotationAt(point);
                if (target) void deleteAnnotation(target); else setNotice("Gumka nie trafiła w adnotację aktywnej warstwy");
                return;
            }
            if (point && drawTool === "text") { setTextPosition(point); return; }
            if (point) {
                drawingPointerRef.current = event.pointerId;
                setCurrentStroke([point, point]);
                event.currentTarget.setPointerCapture(event.pointerId);
            }
            return;
        }
        const point = pointOnMap(event.clientX, event.clientY);
        if (addMode && point) { setNewPosition(point); setMarkerDialog(null); setAddMode(false); return; }
        clearTransientMapState();
        pointerRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
        event.currentTarget.setPointerCapture(event.pointerId);
        if (pointerRef.current.size === 1) panRef.current = { x: event.clientX, y: event.clientY, offsetX: offset.x, offsetY: offset.y };
        if (pointerRef.current.size === 2) {
            const [a, b] = [...pointerRef.current.values()]; pinchRef.current = Math.hypot(a.x - b.x, a.y - b.y); panRef.current = null;
        }
        setContextMenu(null);
    };
    const onViewportPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
        if (currentStroke && drawingPointerRef.current === event.pointerId) {
            if (!continuesPrimaryDrawingGesture(event)) {
                setCurrentStroke(null); drawingPointerRef.current = null; return;
            }
            const point = pointOnCanvas(event.clientX, event.clientY);
            if (point) setCurrentStroke((current) => current ? (drawTool === "pen" ? [...current, point] : [current[0], point]) : null);
            return;
        }
        if (!pointerRef.current.has(event.pointerId)) return;
        pointerRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
        if (pointerRef.current.size === 2) {
            const [a, b] = [...pointerRef.current.values()]; const distance = Math.hypot(a.x - b.x, a.y - b.y);
            if (pinchRef.current) zoomAt(zoom * distance / pinchRef.current, (a.x + b.x) / 2, (a.y + b.y) / 2);
            pinchRef.current = distance;
        } else if (panRef.current) {
            const pan = panRef.current; setOffset({ x: pan.offsetX + event.clientX - pan.x, y: pan.offsetY + event.clientY - pan.y });
        }
    };
    const endPointer = async (event: ReactPointerEvent<HTMLDivElement>) => {
        const completedStroke = currentStroke;
        const completedTool = drawTool;
        const shouldSave = completedStroke && drawingPointerRef.current === event.pointerId && hasMeaningfulDrawingDrag(completedStroke, 2 / actualScale);
        setCurrentStroke(null);
        drawingPointerRef.current = null;
        pointerRef.current.delete(event.pointerId); panRef.current = null; pinchRef.current = null;
        if (shouldSave) {
            const localId = createLocalDrawingId();
            const payload = {
                color: drawColor, width: drawWidth, isEraser: false,
                points: completedStroke, isVisibleToPlayers: drawVisibleToPlayers,
                tool: completedTool as MapDrawingStroke["tool"], fillColor: drawFill, opacity: drawOpacity,
                dashStyle: drawDash, text: drawText, fontSize: drawFontSize,
                hasTextBorder: drawTextBorder, rotation: 0,
                sortOrder: drawingStrokes.length * 10, isVisible: true, isLocked: false,
            };
            const optimistic: MapDrawingStroke = {
                ...payload, id: localId, worldId, mapId: activeMapId,
                createdAt: new Date().toISOString(),
            };
            setDrawingStrokes((current) => [...current, optimistic]);
            setSaveState("saving");
            const finishSave = async () => {
                const created = (await api.post<MapDrawingStroke>(`/worlds/${worldId}/maps/${activeMapId}/drawings`, payload)).data;
                setDrawingStrokes((items) => items.map((item) => item.id === localId ? created : item));
                savedDrawingsRef.current.set(created.id, structuredClone(created));
                pendingSavesRef.current.delete(`drawing:${localId}`);
                const remove = async () => { await api.delete(`/worlds/${worldId}/maps/${activeMapId}/drawings/${created.id}`); setDrawingStrokes((items) => items.filter((item) => item.id !== created.id)); };
                const restore = async () => { const restored = (await api.post<MapDrawingStroke>(`/worlds/${worldId}/maps/${activeMapId}/drawings`, { ...drawingPayload(created), id: created.id })).data; setDrawingStrokes((items) => [...items, restored].sort((a,b) => a.sortOrder-b.sortOrder)); };
                history.record({ label: `Dodanie: ${completedTool}`, undo: remove, redo: restore });
                setSaveState(pendingSavesRef.current.size ? "failed" : "saved");
            };
            try {
                await finishSave();
            } catch (error) {
                pendingSavesRef.current.set(`drawing:${localId}`, finishSave);
                setSaveState("failed"); setError(saveErrorMessage(error,"Nie udało się zapisać rysunku. Pozostał widoczny lokalnie; użyj „Ponów zapis”"));
            }
            if ((completedTool === "line" || completedTool === "arrow") && !createMany) setDrawTool("select");
        }
    };

    const moveMarker = (event: ReactPointerEvent<HTMLButtonElement>, marker: MapMarker) => {
        if (playerView || !editMode || markerStatus !== 0) return;
        if (marker.isPositionLocked) { setNotice("Element jest zablokowany"); return; }
        event.stopPropagation(); dragMarkerRef.current = marker.id; markerDragStartRef.current = structuredClone(marker); event.currentTarget.setPointerCapture(event.pointerId);
    };
    const dragMarker = (event: ReactPointerEvent<HTMLButtonElement>, marker: MapMarker) => {
        if (dragMarkerRef.current !== marker.id) return;
        const point = pointOnMap(event.clientX, event.clientY); if (!point) return;
        setMarkers((current) => current.map((item) => item.id === marker.id ? { ...item, positionX: point.x, positionY: point.y } : item));
    };
    const finishMarkerDrag = async (event: ReactPointerEvent<HTMLButtonElement>, marker: MapMarker) => {
        if (dragMarkerRef.current !== marker.id) return;
        const before = markerDragStartRef.current; dragMarkerRef.current = null; markerDragStartRef.current = null; const point = pointOnMap(event.clientX, event.clientY); if (!point) return;
        try { const response = await api.patch<MapMarker>(`/worlds/${worldId}/maps/${activeMapId}/markers/${marker.id}/position`, { positionX: point.x, positionY: point.y }); setMarkers((current) => current.map((item) => item.id === marker.id ? response.data : item)); setSelectedMarker(response.data); if(before){const after=response.data;const apply=async(value:MapMarker)=>{const saved=(await api.patch<MapMarker>(`/worlds/${worldId}/maps/${activeMapId}/markers/${marker.id}/position`,{positionX:value.positionX,positionY:value.positionY})).data;setMarkers(items=>items.map(item=>item.id===saved.id?saved:item));};history.record({label:"Przesunięcie markera",undo:()=>apply(before),redo:()=>apply(after)});} }
        catch { setError("Nie udało się zapisać nowej pozycji markera."); void loadMarkers(); }
    };

    const context = (event: React.MouseEvent<HTMLDivElement>) => {
        event.preventDefault(); if (playerView || !editMode || !activeMap || markerStatus !== 0) return;
        const point = pointOnMap(event.clientX, event.clientY); const canvasPoint = pointOnCanvas(event.clientX, event.clientY); const rect = viewportRef.current?.getBoundingClientRect();
        if (point && canvasPoint && rect) setContextMenu({ x: event.clientX - rect.left, y: event.clientY - rect.top, nx: point.x, ny: point.y, cx: canvasPoint.x, cy: canvasPoint.y, kind: "empty" });
    };
    const objectContext = (event: React.MouseEvent, kind: "marker" | "layer" | "annotation", id: string) => {
        event.preventDefault(); event.stopPropagation();
        const point = pointOnMap(event.clientX, event.clientY); const canvasPoint = pointOnCanvas(event.clientX, event.clientY); const rect = viewportRef.current?.getBoundingClientRect();
        if (point && canvasPoint && rect) setContextMenu({ x: event.clientX - rect.left, y: event.clientY - rect.top, nx: point.x, ny: point.y, cx: canvasPoint.x, cy: canvasPoint.y, kind, id });
    };

    const duplicateLayer = async (layer: MapImageLayer) => {
        setSaveState("saving");
        try {
            const response = await api.post<MapImageLayer>(`/worlds/${worldId}/maps/${activeMapId}/layers`, {
                fileAttachmentId: layer.fileAttachmentId, name: `${layer.name} — kopia`, positionX: layer.positionX + 32,
                positionY: layer.positionY + 32, scale: layer.scale, rotation: layer.rotation,
                sortOrder: (imageLayers.at(-1)?.sortOrder ?? 0) + 10, isVisible: true,
                isVisibleToPlayers: false, isLocked: false, opacity: layer.opacity ?? 1,
            });
            const created = response.data;
            setImageLayers((current) => [...current, created].sort((a,b) => a.sortOrder-b.sortOrder));
            const remove = async () => { await api.delete(`/worlds/${worldId}/maps/${activeMapId}/layers/${created.id}`); setImageLayers((items) => items.filter((item) => item.id !== created.id)); };
            const restore = async () => { const restored = (await api.post<MapImageLayer>(`/worlds/${worldId}/maps/${activeMapId}/layers`, { fileAttachmentId: created.fileAttachmentId, name: created.name, positionX: created.positionX, positionY: created.positionY, scale: created.scale, rotation: created.rotation, sortOrder: created.sortOrder, isVisible: created.isVisible, isVisibleToPlayers: created.isVisibleToPlayers, isLocked: created.isLocked, opacity: created.opacity, id: created.id })).data; setImageLayers((items) => [...items, restored].sort((a,b) => a.sortOrder-b.sortOrder)); };
            history.record({ label: "Duplikacja obrazu", undo: remove, redo: restore });
            setSaveState(pendingSavesRef.current.size ? "failed" : "saved");
        } catch { setSaveState("failed"); setError("Nie udało się zapisać kopii warstwy."); }
    };

    const duplicateAnnotation = async (source: MapDrawingStroke) => {
        const payload = drawingPayload({ ...source, points: source.points.map((point) => ({ x: point.x + 24, y: point.y + 24 })),
            isLocked: false, isVisibleToPlayers: false, sortOrder: (drawingStrokes.at(-1)?.sortOrder ?? 0) + 10 });
        const created = (await api.post<MapDrawingStroke>(`/worlds/${worldId}/maps/${activeMapId}/drawings`, payload)).data;
        setDrawingStrokes((items) => [...items, created]); setSelectedAnnotationId(created.id);
        const remove = async () => { await api.delete(`/worlds/${worldId}/maps/${activeMapId}/drawings/${created.id}`); setDrawingStrokes((items) => items.filter((item) => item.id !== created.id)); };
        const restore = async () => { const restored = (await api.post<MapDrawingStroke>(`/worlds/${worldId}/maps/${activeMapId}/drawings`, { ...payload, id: created.id })).data; setDrawingStrokes((items) => [...items, restored]); };
        history.record({ label: "Duplikacja adnotacji", undo: remove, redo: restore });
    };

    const duplicateMarker = async (marker: MapMarker) => {
        const response = await api.post<MapMarker>(`/worlds/${worldId}/maps/${activeMapId}/markers`, {
            categoryId: marker.categoryId, name: `${marker.name} — kopia`, description: marker.description,
            icon: marker.icon, color: marker.color, positionX: clamp(marker.positionX + .02, 0, 1),
            positionY: clamp(marker.positionY + .02, 0, 1), isPublished: false, isPositionLocked: false,
            folderId: marker.folderId, pageId: marker.pageId, targetMapId: marker.targetMapId,
        });
        setMarkers((items) => [...items, response.data]); setSelectedMarker(response.data);
        recordCreatedMarker(response.data, "Duplikacja markera");
    };

    const handleContextAction = async (action: MapContextAction) => {
        const menu = contextMenu; if (!menu) return;
        const layer = menu.kind === "layer" ? imageLayers.find((item) => item.id === menu.id) : undefined;
        const marker = menu.kind === "marker" ? markers.find((item) => item.id === menu.id) : undefined;
        const annotation = menu.kind === "annotation" ? drawingStrokes.find((item) => item.id === menu.id) : undefined;
        setContextMenu(null);
        if (action === "center") { setOffset({ x: viewportSize.width/2-menu.cx*actualScale, y: viewportSize.height/2-menu.cy*actualScale }); return; }
        if (action === "add-marker") { setNewPosition({x:menu.nx,y:menu.ny}); setMarkerDialog(null); return; }
        if (action === "add-image") { setLayerInsertPosition({x:menu.cx,y:menu.cy}); setLayerDialog(null); return; }
        if (action === "add-text") { setTextPosition({x:menu.cx,y:menu.cy}); return; }
        if (action === "start-drawing") { setDrawTool("pen"); return; }
        if (marker) {
            if (action === "open") setSelectedMarker(marker);
            else if (action === "edit") setMarkerDialog(marker);
            else if (action === "toggle-lock") await setMarkerLock(marker, !marker.isPositionLocked);
            else if (action === "toggle-visible") await patchMarker(marker,marker.isPublished?"hide":"publish");
            else if (action === "duplicate") await duplicateMarker(marker);
            else if (action === "delete") setConfirmState({kind:"marker",marker,action:"trash"});
            return;
        }
        if (layer) {
            if (action === "select") setSelectedLayerId(layer.id);
            else if (action === "edit") { setSelectedLayerId(layer.id); setLayerDialog(layer); }
            else if (action === "toggle-lock") await updateLayer(layer,{isLocked:!layer.isLocked});
            else if (action === "toggle-visible") await updateLayer(layer,{isVisible:!layer.isVisible});
            else if (action === "duplicate") await duplicateLayer(layer);
            else if (action === "delete") setLayerToDelete(layer);
            else if (["top","up","down","bottom"].includes(action)) {
                const orders=imageLayers.map(item=>item.sortOrder); const min=Math.min(...orders,0); const max=Math.max(...orders,0);
                await updateLayer(layer,{sortOrder:action==="top"?max+10:action==="bottom"?Math.max(0,min-10):layer.sortOrder+(action==="up"?10:-10)});
            }
            return;
        }
        if (annotation) {
            if (action === "select" || action === "edit") { setSelectedAnnotationId(annotation.id); setDrawTool("select"); }
            else if (action === "toggle-lock") await commitDrawing(annotation,{...annotation,isLocked:!annotation.isLocked},"Blokada adnotacji");
            else if (action === "toggle-visible") await commitDrawing(annotation,{...annotation,isVisible:!annotation.isVisible},"Widoczność adnotacji");
            else if (action === "duplicate") await duplicateAnnotation(annotation);
            else if (action === "delete") await deleteAnnotation(annotation);
            else if (["top","up","down","bottom"].includes(action)) {
                const orders=drawingStrokes.map(item=>item.sortOrder); const min=Math.min(...orders,0); const max=Math.max(...orders,0);
                await commitDrawing(annotation,{...annotation,sortOrder:action==="top"?max+10:action==="bottom"?Math.max(0,min-10):annotation.sortOrder+(action==="up"?10:-10)},"Kolejność adnotacji");
            }
        }
    };

    const startBaseDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
        event.stopPropagation();
        if (!editMode) return;
        setSelectedLayerId("base");
        if (baseLayer.isLocked) { setNotice("Element jest zablokowany"); return; }
        baseDragRef.current = { startX: event.clientX, startY: event.clientY, before: { ...baseLayer } };
        event.currentTarget.setPointerCapture(event.pointerId);
    };
    const dragBase = (event: ReactPointerEvent<HTMLDivElement>) => {
        const drag = baseDragRef.current; if (!drag) return;
        const x = drag.before.positionX + (event.clientX - drag.startX) / actualScale;
        const y = drag.before.positionY + (event.clientY - drag.startY) / actualScale;
        setBaseLayer((current) => ({ ...current, positionX: x, positionY: y }));
    };
    const finishBaseDrag = () => {
        const drag = baseDragRef.current; if (!drag) return;
        baseDragRef.current = null;
        const after = { ...baseLayer };
        applyBaseLayer(after);
        history.record({ label: "Przesunięcie obrazu bazowego", undo: () => Promise.resolve(applyBaseLayer(drag.before)), redo: () => Promise.resolve(applyBaseLayer(after)) });
    };

    const startRotation = (event: ReactPointerEvent<HTMLButtonElement>, id: string, rotation: number) => {
        event.preventDefault(); event.stopPropagation();
        const bounds = event.currentTarget.parentElement?.getBoundingClientRect();
        if (!bounds) return;
        const centerX = bounds.left + bounds.width / 2; const centerY = bounds.top + bounds.height / 2;
        rotationRef.current = { id, beforeRotation: rotation, centerX, centerY, pointerAngle: Math.atan2(event.clientY - centerY, event.clientX - centerX) * 180 / Math.PI };
        event.currentTarget.setPointerCapture(event.pointerId);
    };
    const rotateImage = (event: ReactPointerEvent<HTMLButtonElement>) => {
        const rotation = rotationRef.current; if (!rotation) return;
        const angle = Math.atan2(event.clientY - rotation.centerY, event.clientX - rotation.centerX) * 180 / Math.PI;
        let next = rotation.beforeRotation + angle - rotation.pointerAngle;
        if (event.shiftKey) next = Math.round(next / 15) * 15;
        if (rotation.id === "base") setBaseLayer((current) => ({ ...current, rotation: next }));
        else setImageLayers((items) => items.map((item) => item.id === rotation.id ? { ...item, rotation: next } : item));
    };
    const finishRotation = async () => {
        const rotation = rotationRef.current; if (!rotation) return;
        rotationRef.current = null;
        if (rotation.id === "base") {
            const before = { ...baseLayer, rotation: rotation.beforeRotation }; const after = { ...baseLayer };
            applyBaseLayer(after);
            history.record({ label: "Obrót obrazu bazowego", undo: () => Promise.resolve(applyBaseLayer(before)), redo: () => Promise.resolve(applyBaseLayer(after)) });
            return;
        }
        const current = imageLayers.find((item) => item.id === rotation.id);
        if (current) await updateLayer({ ...current, rotation: rotation.beforeRotation }, { rotation: current.rotation });
    };

    const startLayerDrag = (event: ReactPointerEvent<HTMLDivElement>, layer: MapImageLayer) => {
        event.stopPropagation();
        if (!editMode) return;
        setSelectedLayerId(layer.id);
        if (layer.isLocked) { setNotice("Element jest zablokowany"); return; }
        dragLayerRef.current = { id: layer.id, startX: event.clientX, startY: event.clientY, x: layer.positionX, y: layer.positionY };
        event.currentTarget.setPointerCapture(event.pointerId);
    };
    const dragLayer = (event: ReactPointerEvent<HTMLDivElement>, layer: MapImageLayer) => {
        const drag = dragLayerRef.current; if (!drag || drag.id !== layer.id) return;
        const rawX = drag.x + (event.clientX - drag.startX) / actualScale;
        const rawY = drag.y + (event.clientY - drag.startY) / actualScale;
        const x = rawX;
        const y = rawY;
        setImageLayers((current) => current.map((item) => item.id === layer.id ? { ...item, positionX: x, positionY: y } : item));
    };
    const finishLayerDrag = async (_event: ReactPointerEvent<HTMLDivElement>, layer: MapImageLayer) => {
        const drag = dragLayerRef.current; if (drag?.id !== layer.id) return;
        dragLayerRef.current = null;
        const current = imageLayers.find((item) => item.id === layer.id);
        if (current) await updateLayer({ ...current, positionX:drag.x, positionY:drag.y }, { positionX:current.positionX, positionY:current.positionY });
    };

    const confirmDeleteLayer = async () => {
        if (!layerToDelete) return;
        const source=layerToDelete;
        const remove=async()=>{await api.delete(`/worlds/${worldId}/maps/${activeMapId}/layers/${source.id}`);setImageLayers(items=>items.filter(item=>item.id!==source.id));};
        const restore=async()=>{const restored=(await api.post<MapImageLayer>(`/worlds/${worldId}/maps/${activeMapId}/layers`,{fileAttachmentId:source.fileAttachmentId,name:source.name,positionX:source.positionX,positionY:source.positionY,scale:source.scale,rotation:source.rotation,sortOrder:source.sortOrder,isVisible:source.isVisible,isVisibleToPlayers:source.isVisibleToPlayers,isLocked:false,opacity:source.opacity,id:source.id})).data;setImageLayers(items=>[...items,restored].sort((a,b)=>a.sortOrder-b.sortOrder));};
        try{setIsActing(true);await remove();history.record({label:"Usunięcie obrazu z kompozycji",undo:restore,redo:remove});setLayerToDelete(null);}finally{setIsActing(false);}
    };
    const confirmClearDrawings = async () => {
        const originals=drawingStrokes.map((item)=>structuredClone(item));
        const clear=async()=>{await api.delete(`/worlds/${worldId}/maps/${activeMapId}/drawings`);setDrawingStrokes([]);};
        const restore=async()=>{const restored:MapDrawingStroke[]=[];for(const original of originals){const saved=(await api.post<MapDrawingStroke>(`/worlds/${worldId}/maps/${activeMapId}/drawings`,{...drawingPayload(original),id:original.id})).data;restored.push(saved);}setDrawingStrokes(restored);};
        try{setIsActing(true);await clear();history.record({label:"Czyszczenie warstwy rysunków",undo:restore,redo:clear});setClearDrawingsConfirm(false);}finally{setIsActing(false);}
    };

    const toggleFullscreen = async () => {
        const module = moduleRef.current;
        if (!module) return;
        if (document.fullscreenElement) {
            await document.exitFullscreen();
            return;
        }
        try {
            await module.requestFullscreen();
            setNativeFullscreen(true);
            setWorkspaceFullscreen(false);
        } catch {
            setWorkspaceFullscreen((value) => !value);
            setNotice("Przeglądarka odmówiła pełnego ekranu — użyto maksymalizacji w aplikacji.");
        }
    };

    if (isLoading && maps.length === 0) return <section className="content-surface mapgenie-empty"><p>Wczytywanie atlasu świata...</p></section>;

    return <section ref={moduleRef} data-testid="map-module" className={`content-surface world-map-module ${workspaceFullscreen ? "is-workspace-fullscreen" : ""}`}>
        <header className="module-header mapgenie-header"><div><span className="content-eyebrow">Mini-MapGenie · {worldName}</span><h1>{activeMap?.name ?? "Atlas map"}</h1>{activeMap?.description && <p>{activeMap.description}</p>}</div><div className="map-controls">
            {!forcePlayerView && <label className="player-view-toggle"><input type="checkbox" checked={playerView} onChange={(event) => { setManualPlayerView(event.target.checked); setMarkerStatus(0); setEditMode(false); setDrawTool("pan"); setAddMode(false); }} /> Widok gracza</label>}
            {!playerView && <label data-testid="map-edit-mode" className={`edit-mode-toggle ${editMode ? "is-active" : ""}`}><input type="checkbox" checked={editMode} onChange={(event) => { setEditMode(event.target.checked); if (!event.target.checked) { setDrawTool("pan"); setAddMode(false); } }} /> Tryb edycji</label>}
            {!playerView && <label className="player-view-toggle"><input type="checkbox" checked={protectLocked} onChange={(event) => setProtectLocked(event.target.checked)} /> Chroń zablokowane</label>}
            <span className={`map-save-state is-${saveState}`}>{saveState === "saving" ? "Zapisywanie…" : saveState === "failed" ? "Nie zapisano" : "Zapisano"}</span>
        </div></header>
        {notice && <button type="button" className="map-notice" onClick={() => setNotice(null)}>{notice} ×</button>}
        {error && <p className="module-error">{error} <button type="button" onClick={() => { void loadMapsAndCategories(); void loadMarkers(); }}>Ponów</button></p>}
        {!activeMap ? <div className="mapgenie-empty"><div className="mapgenie-empty-rune">⌖</div><h2>Atlas nie ma jeszcze mapy</h2><p>Dodaj obraz świata, regionu, miasta lub lochu. Obraz zostanie zapisany przez bezpieczną bibliotekę plików.</p>{!playerView && <button type="button" className="primary-module-button" onClick={() => setMapDialog(null)}>Dodaj pierwszą mapę</button>}</div> : <div className={`mapgenie-shell ${panelOpen ? "" : "is-panel-collapsed"}`}>
            <aside className="mapgenie-panel"><button type="button" className="panel-collapse" onClick={() => setPanelOpen((value) => !value)} aria-expanded={panelOpen}>{panelOpen ? "‹" : "›"}<span className="sr-only">{panelOpen ? "Zwiń panel" : "Rozwiń panel"}</span></button><div className="panel-content">
                <div className="panel-title"><div><span>Warstwy mapy</span><strong>{imageLayers.length + 2} warstw · {filteredMarkers.length} markerów{selectedLayerId ? " · obraz zaznaczony" : ""}</strong></div></div>
                {!playerView && editMode && <button type="button" className="add-library-image" onClick={() => { setLayerInsertPosition(null); setLayerDialog(null); }}>＋ Dodaj obraz z Biblioteki</button>}
                {!playerView && <div className="composition-layers">
                    <div className={`composition-layer is-base ${baseLayer.isVisible ? "" : "is-hidden"}`}><button type="button" disabled={!editMode} onClick={() => updateBaseLayer({ isVisible: !baseLayer.isVisible }, "Widoczność obrazu bazowego")}>{baseLayer.isVisible ? "◉" : "○"}</button><div><strong>Obraz bazowy</strong><small>{Math.round(baseLayer.scale * 100)}% · {Math.round(baseLayer.rotation)}° · ustawienia lokalne</small></div><button type="button" disabled={!editMode} title={baseLayer.isLocked ? "Świadomie odblokuj obraz bazowy" : "Zablokuj obraz bazowy"} onClick={() => updateBaseLayer({ isLocked: !baseLayer.isLocked }, "Blokada obrazu bazowego")}>{baseLayer.isLocked ? "🔒" : "🔓"}</button></div>
                    {imageLayers.map((layer) => <div key={layer.id} className={`composition-layer ${layer.isVisible ? "" : "is-hidden"}`}><button type="button" onClick={() => void updateLayer(layer, { isVisible: !layer.isVisible })}>{layer.isVisible ? "◉" : "○"}</button><div><strong>{layer.name}</strong><small>{Math.round(layer.scale * 100)}% · {layer.rotation}°</small></div><button type="button" title={layer.isLocked ? "Odblokuj" : "Zablokuj"} onClick={() => void updateLayer(layer, { isLocked: !layer.isLocked })}>{layer.isLocked ? "🔒" : "🔓"}</button>{editMode && <button type="button" onClick={() => setLayerDialog(layer)}>✎</button>}{editMode && <button type="button" className="danger-action" onClick={() => layer.isLocked ? setNotice("Element jest zablokowany") : setLayerToDelete(layer)}>×</button>}</div>)}
                    {editMode && <div className="drawing-tools"><strong>Adnotacje</strong><div className="drawing-tool-grid">{([['pan','Rączka'],['select','Zaznacz'],['pen','Pióro'],['eraser','Gumka'],['line','Linia'],['arrow','Strzałka'],['text','Tekst']] as [DrawTool,string][]).map(([tool,label]) => <button key={tool} data-testid={`map-tool-${tool}`} type="button" className={drawTool === tool ? "is-active" : ""} onClick={() => setDrawTool(tool)}>{label}</button>)}</div><label>Obrys <input type="color" value={drawColor} onChange={(event) => setDrawColor(event.target.value)} /></label><label>Wypełnienie <select value={drawFill} onChange={(event) => setDrawFill(event.target.value)}><option value="transparent">Brak</option><option value="#f1d28a">Złote</option><option value="#702a30">Bordowe</option><option value="#173f4c">Morskie</option></select></label><label>Grubość <input type="range" min="1" max="40" value={drawWidth} onChange={(event) => setDrawWidth(Number(event.target.value))} /> {drawWidth}px</label><label>Krycie <input type="range" min="0.1" max="1" step="0.1" value={drawOpacity} onChange={(event) => setDrawOpacity(Number(event.target.value))} /> {Math.round(drawOpacity * 100)}%</label><label>Linia <select value={drawDash} onChange={(event) => setDrawDash(event.target.value as typeof drawDash)}><option value="solid">Ciągła</option><option value="dashed">Kreskowana</option><option value="dotted">Kropkowana</option></select></label><label><input type="checkbox" checked={createMany} onChange={(event) => setCreateMany(event.target.checked)} /> Twórz wiele</label><label><input type="checkbox" checked={drawVisibleToPlayers} onChange={(event) => setDrawVisibleToPlayers(event.target.checked)} /> Widoczne dla graczy</label></div>}
                </div>}
                {!playerView && editMode && selectedLayerId === "base" && <div className="image-transform-controls"><strong>Obraz bazowy {baseLayer.isLocked ? "· 🔒" : "· odblokowany"}</strong><p>Domyślnie chroniony. Odblokowanie pozwala świadomie zmienić kompozycję.</p><label>Kąt <input type="number" value={Math.round(baseLayer.rotation * 10) / 10} disabled={baseLayer.isLocked} onChange={(event) => updateBaseLayer({ rotation: Number(event.target.value) }, "Kąt obrazu bazowego")} />°</label><div><button type="button" disabled={baseLayer.isLocked} onClick={() => updateBaseLayer({ rotation: baseLayer.rotation - 90 }, "Obrót obrazu bazowego -90°")}>−90°</button><button type="button" disabled={baseLayer.isLocked} onClick={() => updateBaseLayer({ rotation: 0 }, "Reset obrotu obrazu bazowego")}>Reset</button><button type="button" disabled={baseLayer.isLocked} onClick={() => updateBaseLayer({ rotation: baseLayer.rotation + 90 }, "Obrót obrazu bazowego +90°")}>+90°</button></div><label>Skala <input type="range" min="0.05" max="8" step="0.05" value={baseLayer.scale} disabled={baseLayer.isLocked} onChange={(event) => updateBaseLayer({ scale: Number(event.target.value) }, "Skala obrazu bazowego")} /> {Math.round(baseLayer.scale * 100)}%</label><label>Krycie <input type="range" min="0.05" max="1" step="0.05" value={baseLayer.opacity} disabled={baseLayer.isLocked} onChange={(event) => updateBaseLayer({ opacity: Number(event.target.value) }, "Krycie obrazu bazowego")} /> {Math.round(baseLayer.opacity * 100)}%</label><button type="button" onClick={() => updateBaseLayer({ isLocked: !baseLayer.isLocked }, "Blokada obrazu bazowego")}>{baseLayer.isLocked ? "Świadomie odblokuj" : "Zablokuj"}</button>{baseLayer.isVisible ? <button type="button" className="danger-action" disabled={baseLayer.isLocked} onClick={() => setDeleteBaseConfirm(true)}>Usuń z kompozycji…</button> : <button type="button" onClick={() => updateBaseLayer({ isVisible: true }, "Przywrócenie obrazu bazowego")}>Przywróć obraz bazowy</button>}</div>}
                {!playerView && editMode && selectedImageLayer && <div className="image-transform-controls"><strong>{selectedImageLayer.name} {selectedImageLayer.isLocked ? "· 🔒" : ""}</strong><label>Kąt <input type="number" value={Math.round(selectedImageLayer.rotation * 10) / 10} disabled={selectedImageLayer.isLocked} onChange={(event) => void updateLayer(selectedImageLayer, { rotation: Number(event.target.value) })} />°</label><div><button type="button" disabled={selectedImageLayer.isLocked} onClick={() => void updateLayer(selectedImageLayer, { rotation: selectedImageLayer.rotation - 90 })}>−90°</button><button type="button" disabled={selectedImageLayer.isLocked} onClick={() => void updateLayer(selectedImageLayer, { rotation: 0 })}>Reset</button><button type="button" disabled={selectedImageLayer.isLocked} onClick={() => void updateLayer(selectedImageLayer, { rotation: selectedImageLayer.rotation + 90 })}>+90°</button></div><label>Skala <input type="range" min="0.05" max="8" step="0.05" value={selectedImageLayer.scale} disabled={selectedImageLayer.isLocked} onChange={(event) => void updateLayer(selectedImageLayer, { scale: Number(event.target.value) })} /> {Math.round(selectedImageLayer.scale * 100)}%</label><label>Krycie <input type="range" min="0.05" max="1" step="0.05" value={selectedImageLayer.opacity ?? 1} disabled={selectedImageLayer.isLocked} onChange={(event) => void updateLayer(selectedImageLayer, { opacity: Number(event.target.value) })} /> {Math.round((selectedImageLayer.opacity ?? 1) * 100)}%</label><button type="button" onClick={() => void updateLayer(selectedImageLayer, { isLocked: !selectedImageLayer.isLocked })}>{selectedImageLayer.isLocked ? "Odblokuj" : "Zablokuj"}</button><button type="button" className="danger-action" disabled={selectedImageLayer.isLocked} onClick={() => setLayerToDelete(selectedImageLayer)}>Usuń z kompozycji…</button></div>}
                {!playerView && editMode && <div className="editor-session-panel"><div className="history-controls"><button type="button" disabled={!history.undoCount || history.busy} title={history.undoLabel} onClick={() => void history.undo()}>↶ Cofnij ({history.undoCount})</button><button type="button" disabled={!history.redoCount || history.busy} title={history.redoLabel} onClick={() => void history.redo()}>↷ Ponów ({history.redoCount})</button></div><label><input type="checkbox" checked={activeMap.isDrawingLayerVisible} onChange={(event)=>void configureDrawingLayer({isDrawingLayerVisible:event.target.checked})} /> Warstwa rysunków widoczna</label><label><input type="checkbox" checked={activeMap.isDrawingLayerLocked} onChange={(event)=>void configureDrawingLayer({isDrawingLayerLocked:event.target.checked})} /> 🔒 Zablokuj całą warstwę</label><label><input type="checkbox" checked={activeMap.isDrawingLayerVisibleToPlayers} onChange={(event)=>void configureDrawingLayer({isDrawingLayerVisibleToPlayers:event.target.checked})} /> Widoczna dla graczy</label>{selectedAnnotation && <div className="annotation-inspector"><strong>Zaznaczona adnotacja</strong><label>Obrys <input type="color" value={selectedAnnotation.color} disabled={selectedAnnotation.isLocked} onChange={(event)=>void commitDrawing(selectedAnnotation,{...selectedAnnotation,color:event.target.value},"Kolor adnotacji")} /></label><label>Wypełnienie/tło <input type="color" value={selectedAnnotation.fillColor === "transparent" ? "#ffffff" : selectedAnnotation.fillColor} disabled={selectedAnnotation.isLocked} onChange={(event)=>void commitDrawing(selectedAnnotation,{...selectedAnnotation,fillColor:event.target.value},"Wypełnienie adnotacji")} /></label><label>Grubość <input type="range" min="1" max="40" value={selectedAnnotation.width} disabled={selectedAnnotation.isLocked} onChange={(event)=>void commitDrawing(selectedAnnotation,{...selectedAnnotation,width:Number(event.target.value)},"Grubość adnotacji")} /></label><label>Krycie <input type="range" min="0.1" max="1" step="0.1" value={selectedAnnotation.opacity} disabled={selectedAnnotation.isLocked} onChange={(event)=>void commitDrawing(selectedAnnotation,{...selectedAnnotation,opacity:Number(event.target.value)},"Krycie adnotacji")} /></label><label>Styl <select value={selectedAnnotation.dashStyle} disabled={selectedAnnotation.isLocked} onChange={(event)=>void commitDrawing(selectedAnnotation,{...selectedAnnotation,dashStyle:event.target.value as MapDrawingStroke["dashStyle"]},"Styl kreski")}><option value="solid">Ciągła</option><option value="dashed">Kreskowana</option><option value="dotted">Kropkowana</option></select></label>{selectedAnnotation.tool === "text" && <><label>Tekst <textarea value={selectedAnnotation.text} disabled={selectedAnnotation.isLocked} onChange={(event)=>setDrawingStrokes((items)=>items.map((item)=>item.id===selectedAnnotation.id?{...selectedAnnotation,text:event.target.value}:item))} onBlur={(event)=>void commitDrawing(selectedAnnotation,{...selectedAnnotation,text:event.target.value},"Edycja tekstu")} /></label><label>Rozmiar <input type="number" min="8" max="240" value={selectedAnnotation.fontSize} disabled={selectedAnnotation.isLocked} onChange={(event)=>void commitDrawing(selectedAnnotation,{...selectedAnnotation,fontSize:Number(event.target.value)},"Rozmiar tekstu")} /></label></>}<div><button type="button" onClick={()=>void commitDrawing(selectedAnnotation,{...selectedAnnotation,isLocked:!selectedAnnotation.isLocked},"Blokada adnotacji")}>{selectedAnnotation.isLocked?"Odblokuj":"Zablokuj"}</button><button type="button" disabled={selectedAnnotation.isLocked} onClick={()=>void deleteAnnotation(selectedAnnotation)}>Usuń</button></div></div>}</div>}
                {!playerView && editMode && drawTool === "text" && <div className="text-presentation-controls"><strong>Wygląd tekstu</strong><label><input type="checkbox" checked={drawFill !== "transparent"} onChange={(event) => setDrawFill(event.target.checked ? "#f1d28a" : "transparent")} /> Tło tekstu</label><label><input type="checkbox" checked={drawTextBorder} onChange={(event) => setDrawTextBorder(event.target.checked)} /> Ramka tekstu</label></div>}
                {!playerView && editMode && selectedAnnotation?.tool === "text" && <div className="text-presentation-controls"><strong>Zaznaczony tekst</strong><label><input type="checkbox" checked={selectedAnnotation.fillColor !== "transparent"} disabled={selectedAnnotation.isLocked} onChange={(event)=>void commitDrawing(selectedAnnotation,{...selectedAnnotation,fillColor:event.target.checked?"#f1d28a":"transparent"},"Tło tekstu")} /> Tło</label><label><input type="checkbox" checked={selectedAnnotation.hasTextBorder ?? true} disabled={selectedAnnotation.isLocked} onChange={(event)=>void commitDrawing(selectedAnnotation,{...selectedAnnotation,hasTextBorder:event.target.checked},"Ramka tekstu")} /> Ramka</label></div>}
                <label className="marker-search"><span className="sr-only">Szukaj markerów</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Szukaj nazwy lub opisu..." /></label>
                <div className="category-toggle-actions"><button type="button" onClick={() => setHiddenCategories(new Set())}>Pokaż wszystkie</button><button type="button" onClick={() => setHiddenCategories(new Set(categories.map((item) => item.id)))}>Ukryj wszystkie</button></div>
                {!playerView && editMode && <button type="button" className="category-add-control" onClick={() => setCategoryDialog(null)}>＋ Dodaj kategorię</button>}
                <div className="category-list">{categories.map((category) => <div key={category.id} className={`category-row ${category.isActive ? "" : "is-inactive"}`}><label><input type="checkbox" checked={!hiddenCategories.has(category.id)} onChange={() => setHiddenCategories((current) => { const next = new Set(current); if (next.has(category.id)) next.delete(category.id); else next.add(category.id); return next; })} /><span className="category-symbol" style={{ color: category.color }}>{category.icon}</span><span>{category.name}</span><b>{categoryCounts[category.id] ?? 0}</b></label>{!playerView && editMode && <button type="button" title="Edytuj kategorię" onClick={() => setCategoryDialog(category)}>✎</button>}</div>)}</div>
                {!playerView && <div className="marker-status-tabs">{statusNames.map((label, index) => <button type="button" key={label} className={markerStatus === index ? "is-active" : ""} onClick={() => setMarkerStatus(index as MapMarkerStatus)}>{label}</button>)}</div>}
                <p className="map-security-note">{playerView ? "Pokazano wyłącznie opublikowane mapy, aktywne kategorie i markery." : "Tryb MG jest przygotowany pod role. Pełna ochrona wymaga skonfigurowanej tożsamości użytkownika."}</p>
            </div></aside>
            <div className="map-stage">
                <div className="map-toolbar">
                    <select aria-label="Aktywna mapa" value={activeMapId} onChange={(event) => changeActiveMap(event.target.value)}>{maps.map((map) => <option key={map.id} value={map.id}>{map.name} · {mapTypeNames[map.type]}{!map.isPublished ? " · szkic" : ""}</option>)}</select>
                    {!playerView && editMode && <><button type="button" title="Tworzy niezależny projekt mapy" onClick={() => setMapDialog(null)}>＋ Nowa mapa</button><button type="button" onClick={() => setMapDialog(activeMap)}>Edytuj mapę</button><button type="button" className="toolbar-primary" onClick={() => setLayerDialog(null)}>＋ Dodaj obraz z Biblioteki</button></>}
                    <span className="toolbar-separator" /><button type="button" data-testid="map-zoom-out" onClick={() => zoomAt(zoom / 1.2)} aria-label="Oddal">−</button><span data-testid="map-zoom-value">{Math.round(zoom * 100)}%</span><button type="button" data-testid="map-zoom-in" onClick={() => zoomAt(zoom * 1.2)} aria-label="Przybliż">＋</button><button type="button" data-testid="map-fit-view" onClick={resetView}>Dopasuj</button>
                    <button type="button" data-testid="map-fullscreen" onClick={() => void toggleFullscreen()}>{nativeFullscreen || workspaceFullscreen ? "Wyjdź z pełnego ekranu" : "Pełny ekran"}</button>
                    {saveState === "failed" && <button type="button" onClick={() => void retryUnsaved()}>Ponów zapis</button>}
                    {!playerView && editMode && markerStatus === 0 && <button type="button" className={addMode ? "is-active" : ""} onClick={() => setAddMode((value) => !value)}>{addMode ? "Kliknij miejsce…" : "＋ Marker"}</button>}
                </div>
                <div ref={viewportRef} data-testid="map-viewport" className={`mapgenie-viewport ${addMode ? "is-adding" : ""} ${drawingInputActive ? "is-drawing" : ""}`} onWheel={onWheel} onPointerDown={onViewportPointerDown} onPointerMove={onViewportPointerMove} onPointerUp={endPointer} onPointerCancel={endPointer} onContextMenu={context}>
                    <div ref={canvasRef} data-testid="map-world-canvas" className="mapgenie-canvas" style={{ width: imageSize.width, height: imageSize.height, transform: `translate(${offset.x}px, ${offset.y}px) scale(${actualScale})` }}>
                        <div data-testid="map-base-image" data-selected={selectedLayerId === "base"} className={`map-image-layer map-base-layer ${baseLayer.isLocked ? "is-locked" : ""} ${selectedLayerId === "base" ? "is-selected" : ""}`} style={{ left: baseLayer.positionX, top: baseLayer.positionY, zIndex: 2, opacity: baseLayer.opacity, transform: `rotate(${baseLayer.rotation}deg) scale(${baseLayer.scale})`, display: baseLayer.isVisible ? undefined : "none" }} onClick={(event) => { event.stopPropagation(); if (editMode) setSelectedLayerId("base"); }} onPointerDown={startBaseDrag} onPointerMove={dragBase} onPointerUp={finishBaseDrag}><img src={`${apiBaseUrl}/worlds/${worldId}/maps/${activeMap.id}/images/${activeMap.imageFileId}?playerView=${playerView}`} alt={`Mapa: ${activeMap.name}`} draggable={false} onLoad={(event) => setImageSize({ width: event.currentTarget.naturalWidth || 1200, height: event.currentTarget.naturalHeight || 800 })} />{editMode && <span>{baseLayer.isLocked ? "🔒 Obraz bazowy" : "Obraz bazowy"}</span>}{editMode && selectedLayerId === "base" && !baseLayer.isLocked && <button type="button" className="image-rotation-handle" title="Przeciągnij, Shift przyciąga co 15°" onPointerDown={(event) => startRotation(event, "base", baseLayer.rotation)} onPointerMove={rotateImage} onPointerUp={() => void finishRotation()}>↻</button>}</div>
                        {imageLayers.filter((layer) => layer.isVisible).map((layer) => <div key={layer.id} className={`map-image-layer ${layer.isLocked ? "is-locked" : ""} ${selectedLayerId === layer.id ? "is-selected" : ""}`} style={{ left: layer.positionX, top: layer.positionY, zIndex: 10 + layer.sortOrder, opacity: layer.opacity ?? 1, transform: `rotate(${layer.rotation}deg) scale(${layer.scale})` }} onClick={(event) => { event.stopPropagation(); if (editMode) setSelectedLayerId(layer.id); }} onContextMenu={(event) => objectContext(event, "layer", layer.id)} onPointerDown={(event) => startLayerDrag(event, layer)} onPointerMove={(event) => dragLayer(event, layer)} onPointerUp={(event) => void finishLayerDrag(event, layer)}><img src={`${apiBaseUrl}/worlds/${worldId}/maps/${activeMap.id}/images/${layer.fileAttachmentId}?playerView=${playerView}`} alt={layer.name} draggable={false} />{editMode && <span>{layer.isLocked ? "🔒" : layer.name}</span>}{editMode && selectedLayerId === layer.id && !layer.isLocked && <button type="button" className="image-rotation-handle" title="Przeciągnij, Shift przyciąga co 15°" onPointerDown={(event) => startRotation(event, layer.id, layer.rotation)} onPointerMove={rotateImage} onPointerUp={() => void finishRotation()}>↻</button>}</div>)}
                        {activeMap.isDrawingLayerVisible && <MapAnnotationEditor strokes={drawingStrokes} scale={actualScale} editMode={editMode && !playerView} selectMode={drawTool === "select"} layerLocked={activeMap.isDrawingLayerLocked} protectLocked={protectLocked} selectedId={selectedAnnotationId} onSelect={selectAnnotation} onCommit={(before,after,label) => void commitDrawing(before,after,label)} onContextMenu={(event,stroke) => objectContext(event,"annotation",stroke.id)} />}
                        {currentStroke && drawTool !== "pan" && drawTool !== "select" && drawTool !== "eraser" && <svg className="map-drawing-preview" style={{ left: -100000, top: -100000, width: 200000, height: 200000 }} viewBox="-100000 -100000 200000 200000"><defs><marker id="map-arrow-head" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 Z" fill="context-stroke" /></marker></defs>{renderShape(drawTool, currentStroke, drawColor, drawWidth, drawFill, drawOpacity, drawDash, drawText, drawFontSize, "current")}</svg>}
                        {filteredMarkers.map((marker) => <div key={marker.id} className={`mapgenie-marker ${selectedMarker?.id === marker.id ? "is-selected" : ""} ${marker.isPublished ? "" : "is-hidden"}`} style={{ left: `${marker.positionX * 100}%`, top: `${marker.positionY * 100}%`, "--marker-inverse-scale": String(1 / actualScale) } as CSSProperties} onContextMenu={(event) => objectContext(event, "marker", marker.id)}><button type="button" style={{ color: marker.color }} title={`${marker.name} · ${marker.categoryName}`} onClick={(event) => { event.stopPropagation(); setSelectedMarker(marker); }} onPointerDown={(event) => moveMarker(event, marker)} onPointerMove={(event) => dragMarker(event, marker)} onPointerUp={(event) => void finishMarkerDrag(event, marker)}><span>{marker.icon}</span></button><small>{marker.name}</small></div>)}
                    </div>
                    {drawingInputActive && <div data-testid="map-drawing-input" className="map-drawing-input-layer" aria-label="Obszar rysowania mapy" onPointerDown={(event) => { event.stopPropagation(); onViewportPointerDown(event); }} onPointerMove={(event) => { event.stopPropagation(); onViewportPointerMove(event); }} onPointerUp={(event) => { event.stopPropagation(); void endPointer(event); }} onPointerCancel={(event) => { event.stopPropagation(); void endPointer(event); }} />}
                </div>
                {contextMenu && <MapContextMenu x={contextMenu.x} y={contextMenu.y + 44} kind={contextMenu.kind} readOnly={playerView || !editMode} layer={imageLayers.find((item)=>item.id===contextMenu.id)} marker={markers.find((item)=>item.id===contextMenu.id)} annotation={drawingStrokes.find((item)=>item.id===contextMenu.id)} onAction={(action)=>void handleContextAction(action)} />}
                <p className="map-help">Przeciągnij mapę · kółko lub gest szczypania zmienia skalę · prawy przycisk otwiera menu obiektu · markery MG można przeciągać</p>
            </div>
            {selectedMarker && <aside className="marker-details">
                <button type="button" className="details-close" onClick={() => setSelectedMarker(null)}>×</button>
                <div className="details-icon" style={{ color: selectedMarker.color }}>{selectedMarker.icon}</div>
                <span>{selectedMarker.categoryName}{selectedMarker.isPublished ? " · opublikowany" : " · ukryty"}{selectedMarker.isPositionLocked ? " · 🔒" : ""}</span>
                <h2>{selectedMarker.name}</h2><p>{selectedMarker.description || "Brak opisu."}</p>
                <div className="details-links">{selectedMarker.folderId && <button type="button" onClick={() => onOpenFolder(selectedMarker.folderId!, selectedMarker.pageId)}>Otwórz powiązaną treść</button>}{selectedMarker.targetMapId && <button type="button" onClick={() => { setActiveMapId(selectedMarker.targetMapId!); setSelectedMarker(null); }}>Przejdź do mapy</button>}</div>
                {!playerView && editMode && <div className="details-actions">{markerStatus === 0 && <>
                    <button type="button" onClick={() => setMarkerDialog(selectedMarker)}>Edytuj</button>
                    <button type="button" onClick={() => void setMarkerLock(selectedMarker, !selectedMarker.isPositionLocked)}>{selectedMarker.isPositionLocked ? "Odblokuj pozycję" : "Zablokuj pozycję"}</button>
                    <button type="button" onClick={() => void patchMarker(selectedMarker, selectedMarker.isPublished ? "hide" : "publish")}>{selectedMarker.isPublished ? "Ukryj" : "Opublikuj"}</button>
                    <button type="button" onClick={() => setConfirmState({ kind: "marker", marker: selectedMarker, action: "archive" })}>Archiwizuj</button>
                    <button type="button" className="danger-action" onClick={() => setConfirmState({ kind: "marker", marker: selectedMarker, action: "trash" })}>Do Trash</button>
                </>}{markerStatus !== 0 && <button type="button" onClick={() => setConfirmState({ kind: "marker", marker: selectedMarker, action: "restore" })}>Przywróć</button>}{markerStatus === 2 && <button type="button" className="danger-action" onClick={() => setConfirmState({ kind: "marker", marker: selectedMarker, action: "delete" })}>Usuń trwale</button>}</div>}
            </aside>}
        </div>}
        {mapDialog !== undefined && <MapDialog worldId={worldId} map={mapDialog} folders={folders} onSave={saveMap} onClose={() => setMapDialog(undefined)} />}
        {categoryDialog !== undefined && <CategoryDialog category={categoryDialog} suggestedOrder={(categories.at(-1)?.sortOrder ?? 0) + 10} onSave={saveCategory} onClose={() => setCategoryDialog(undefined)} />}
        {markerDialog !== undefined && <MarkerDialog marker={markerDialog} currentMapId={activeMapId} position={newPosition} categories={categories} maps={maps.filter((item) => item.status === 0)} folders={folders} pages={pages} onSave={saveMarker} onClose={() => setMarkerDialog(undefined)} />}
        {layerDialog !== undefined && <LayerDialog worldId={worldId} layer={layerDialog} images={libraryImages} initialPosition={layerInsertPosition} nextOrder={(imageLayers.at(-1)?.sortOrder ?? 0) + 10} onSave={saveLayer} onClose={() => { setLayerDialog(undefined); setLayerInsertPosition(null); }} />}
        {confirmState && <ConfirmDialog title={confirmState.kind === "map" ? "Archiwizować mapę?" : confirmState.action === "delete" ? "Trwale usunąć marker?" : "Potwierdź zmianę stanu markera"} message={confirmState.kind === "map" ? "Mapa zniknie z widoku gracza, ale jej obraz i wszystkie markery pozostaną zachowane." : confirmState.action === "delete" ? "Ta operacja jest nieodwracalna i jest dostępna wyłącznie dla markera w Trash." : "Marker zmieni stan bez usuwania jego treści ani powiązań."} confirmation={confirmState.kind === "marker" && confirmState.action === "delete" ? "USUŃ" : undefined} busy={isActing} onConfirm={() => void runConfirmedAction()} onClose={() => setConfirmState(null)} />}
        {layerToDelete && <ConfirmDialog title="Usunąć warstwę z mapy?" message="Zniknie wyłącznie powiązanie i ustawienie warstwy. Oryginalny plik w Bibliotece pozostanie nietknięty." busy={isActing} onClose={() => setLayerToDelete(null)} onConfirm={() => void confirmDeleteLayer()} />}
        {deleteBaseConfirm && <ConfirmDialog title="Usunąć obraz bazowy z kompozycji?" message="Obraz bazowy przestanie być widoczny na tym urządzeniu. Plik źródłowy i pozostałe warstwy pozostaną nietknięte; obraz można później przywrócić." confirmation="USUŃ OBRAZ BAZOWY" busy={false} onClose={() => setDeleteBaseConfirm(false)} onConfirm={() => { updateBaseLayer({ isVisible: false }, "Usunięcie obrazu bazowego z kompozycji"); setDeleteBaseConfirm(false); }} />}
        {textPosition && <MapTextDialog initialText={drawText} fontSize={drawFontSize} color={drawColor} fillColor={drawFill} hasBorder={drawTextBorder} onSave={(style) => addTextAt(textPosition, style)} onClose={() => setTextPosition(null)} />}
        {clearDrawingsConfirm && <ConfirmDialog title="Wyczyścić warstwę rysunków?" message="Usunięte zostaną wyłącznie wektorowe adnotacje tej mapy. Obrazy i markery pozostaną bez zmian. Operacja jest blokowana, jeśli warstwa lub element jest zablokowany." confirmation="WYCZYŚĆ" busy={isActing} onClose={() => setClearDrawingsConfirm(false)} onConfirm={() => void confirmClearDrawings()} />}
    </section>;
}
