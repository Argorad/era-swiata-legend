import type { MapStrokePoint } from "../types/MapComposition";

interface PointerButtons {
    button: number;
    buttons: number;
    pointerType: string;
}

export const startsPrimaryDrawingGesture = (event: PointerButtons) =>
    event.button === 0 && (event.pointerType !== "mouse" || (event.buttons & 1) === 1);

export const continuesPrimaryDrawingGesture = (event: Pick<PointerButtons, "buttons" | "pointerType">) =>
    event.pointerType !== "mouse" || (event.buttons & 1) === 1;

export const hasMeaningfulDrawingDrag = (points: MapStrokePoint[], minimumDistance: number) => {
    const first = points[0];
    const last = points.at(-1);
    return Boolean(first && last && points.length > 1 && Math.hypot(last.x - first.x, last.y - first.y) >= minimumDistance);
};

export const createLocalDrawingId = (randomUuid: (() => string) | undefined = globalThis.crypto?.randomUUID?.bind(globalThis.crypto)) =>
    `local-${randomUuid?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`}`;

interface ViewTransform {
    viewportLeft: number;
    viewportTop: number;
    offsetX: number;
    offsetY: number;
    scale: number;
}

export const screenToMapWorld = (clientX: number, clientY: number, transform: ViewTransform): MapStrokePoint => {
    if (!Number.isFinite(transform.scale) || transform.scale <= 0) throw new RangeError("Skala mapy musi być dodatnia.");
    return {
        x: (clientX - transform.viewportLeft - transform.offsetX) / transform.scale,
        y: (clientY - transform.viewportTop - transform.offsetY) / transform.scale,
    };
};
