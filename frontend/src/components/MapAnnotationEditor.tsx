import { useRef } from "react";
import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";
import type { MapDrawingStroke, MapStrokePoint } from "../types/MapComposition";

interface Props {
    strokes: MapDrawingStroke[];
    scale: number;
    editMode: boolean;
    selectMode: boolean;
    layerLocked: boolean;
    protectLocked: boolean;
    selectedId: string | null;
    onSelect: (stroke: MapDrawingStroke | null) => void;
    onCommit: (before: MapDrawingStroke, after: MapDrawingStroke, label: string) => void;
    onContextMenu: (event: React.MouseEvent, stroke: MapDrawingStroke) => void;
}

interface Bounds { x: number; y: number; width: number; height: number; cx: number; cy: number }
const worldMin = -100000;
const worldSize = 200000;
const path = (points: MapStrokePoint[]) => points.map((point, index) => `${index ? "L" : "M"}${point.x} ${point.y}`).join(" ");
const bounds = (stroke: MapDrawingStroke): Bounds => {
    if (stroke.tool === "text") {
        const point = stroke.points[0] ?? { x: 0, y: 0 };
        const width = Math.max(26, stroke.text.length * stroke.fontSize * .58 + 14);
        const height = stroke.fontSize * 1.4;
        const x = point.x - 7; const y = point.y - stroke.fontSize;
        return { x, y, width, height, cx: x + width / 2, cy: y + height / 2 };
    }
    const xs = stroke.points.map((point) => point.x);
    const ys = stroke.points.map((point) => point.y);
    const x = Math.min(...xs); const y = Math.min(...ys);
    const width = Math.max(12, Math.max(...xs) - x);
    const height = Math.max(12, Math.max(...ys) - y);
    return { x, y, width, height, cx: x + width / 2, cy: y + height / 2 };
};

const dash = (stroke: MapDrawingStroke) => stroke.dashStyle === "dashed"
    ? `${stroke.width * 4} ${stroke.width * 2}`
    : stroke.dashStyle === "dotted" ? `${stroke.width} ${stroke.width * 2}` : undefined;

function Shape({ stroke }: { stroke: MapDrawingStroke }) {
    const first = stroke.points[0]; const last = stroke.points.at(-1);
    if (!first || !last) return null;
    const common = { stroke: stroke.color, strokeWidth: stroke.width, fill: stroke.fillColor,
        opacity: stroke.opacity, strokeDasharray: dash(stroke), vectorEffect: "non-scaling-stroke" as const };
    if (stroke.tool === "line" || stroke.tool === "arrow") return <line x1={first.x} y1={first.y} x2={last.x} y2={last.y} {...common} markerEnd={stroke.tool === "arrow" ? "url(#annotation-arrow)" : undefined} />;
    if (stroke.tool === "rectangle") return <rect x={Math.min(first.x,last.x)} y={Math.min(first.y,last.y)} width={Math.abs(last.x-first.x)} height={Math.abs(last.y-first.y)} {...common} />;
    if (stroke.tool === "ellipse") return <ellipse cx={(first.x+last.x)/2} cy={(first.y+last.y)/2} rx={Math.abs(last.x-first.x)/2} ry={Math.abs(last.y-first.y)/2} {...common} />;
    if (stroke.tool === "polygon") return <polygon points={stroke.points.map((point) => `${point.x},${point.y}`).join(" ")} {...common} />;
    if (stroke.tool === "text") {
        const box = bounds(stroke);
        return <><rect x={box.x} y={box.y} width={box.width} height={box.height} rx="4" fill={stroke.fillColor} stroke={stroke.hasTextBorder ? stroke.color : "none"} strokeWidth={stroke.width} opacity={stroke.opacity} /><text x={first.x} y={first.y} fill={stroke.color} opacity={stroke.opacity} fontSize={stroke.fontSize} fontFamily="Georgia, serif">{stroke.text}</text></>;
    }
    return <path d={path(stroke.points)} fill="none" stroke={stroke.color} strokeWidth={stroke.width} strokeDasharray={dash(stroke)} opacity={stroke.opacity} strokeLinecap="round" strokeLinejoin="round" />;
}

export default function MapAnnotationEditor(props: Props) {
    const dragRef = useRef<{ stroke: MapDrawingStroke; latest: MapDrawingStroke; startX: number; startY: number; mode: "move" | "resize" | "rotate"; handle?: string } | null>(null);
    const updateDrag = (event: ReactPointerEvent<SVGGElement>) => {
        const drag = dragRef.current;
        if (!drag) return;
        const dx = (event.clientX - drag.startX) / props.scale;
        const dy = (event.clientY - drag.startY) / props.scale;
        let next: MapDrawingStroke;
        if (drag.mode === "move") {
            next = { ...drag.stroke, points: drag.stroke.points.map((point) => ({ x: point.x + dx, y: point.y + dy })) };
        } else if (drag.mode === "rotate") {
            const box = bounds(drag.stroke);
            const rect = (event.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect();
            const px = (event.clientX - rect.left) / props.scale + worldMin;
            const py = (event.clientY - rect.top) / props.scale + worldMin;
            next = { ...drag.stroke, rotation: Math.atan2(py - box.cy, px - box.cx) * 180 / Math.PI + 90 };
        } else {
            const box = bounds(drag.stroke);
            const sx = Math.max(.05, (box.width + (drag.handle?.includes("e") ? dx : -dx)) / box.width);
            const sy = Math.max(.05, (box.height + (drag.handle?.includes("s") ? dy : -dy)) / box.height);
            const anchorX = drag.handle?.includes("e") ? box.x : box.x + box.width;
            const anchorY = drag.handle?.includes("s") ? box.y : box.y + box.height;
            next = drag.stroke.tool === "text"
                ? { ...drag.stroke, fontSize: Math.max(8, Math.min(240, drag.stroke.fontSize * Math.max(sx, sy))) }
                : { ...drag.stroke, points: drag.stroke.points.map((point) => ({ x: anchorX + (point.x-anchorX)*sx, y: anchorY + (point.y-anchorY)*sy })) };
        }
        drag.latest = next;
        props.onSelect(next);
    };
    const finish = (event: ReactPointerEvent<SVGGElement>) => {
        const drag = dragRef.current;
        if (!drag) return;
        dragRef.current = null;
        event.currentTarget.releasePointerCapture?.(event.pointerId);
        props.onCommit(drag.stroke, drag.latest, drag.mode === "move" ? "Przesunięcie adnotacji" : drag.mode === "rotate" ? "Obrót adnotacji" : "Zmiana rozmiaru adnotacji");
    };
    const start = (event: ReactPointerEvent<SVGGElement>, stroke: MapDrawingStroke, mode: "move" | "resize" | "rotate", handle?: string) => {
        event.stopPropagation();
        if (props.layerLocked || (props.protectLocked && stroke.isLocked)) return;
        props.onSelect(stroke);
        if (!props.editMode || !props.selectMode) return;
        if (stroke.isLocked) return;
        const snapshot = structuredClone(stroke);
        dragRef.current = { stroke: snapshot, latest: snapshot, startX: event.clientX, startY: event.clientY, mode, handle };
        event.currentTarget.setPointerCapture(event.pointerId);
    };

    return <svg className={`map-annotation-editor ${props.selectMode ? "is-selecting" : ""}`} style={{ left: worldMin, top: worldMin, width: worldSize, height: worldSize, "--annotation-inverse-scale": String(1 / props.scale) } as CSSProperties} viewBox={`${worldMin} ${worldMin} ${worldSize} ${worldSize}`} aria-label="Warstwa adnotacji">
        <defs><marker id="annotation-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 Z" fill="context-stroke" /></marker></defs>
        {props.strokes.filter((stroke) => stroke.isVisible && !stroke.isEraser).sort((a,b) => a.sortOrder-b.sortOrder).map((stroke) => {
            const box = bounds(stroke); const selected = props.selectedId === stroke.id;
            return <g key={stroke.id} data-testid="map-annotation" className={`map-annotation ${selected ? "is-selected" : ""} ${stroke.isLocked ? "is-locked" : ""}`} transform={`rotate(${stroke.rotation} ${box.cx} ${box.cy})`} onContextMenu={(event) => props.onContextMenu(event, stroke)} onPointerDown={(event) => start(event, stroke, "move")} onPointerMove={updateDrag} onPointerUp={finish}>
                <Shape stroke={stroke} />
                {selected && props.editMode && props.selectMode && <g data-testid="annotation-transformer" className="annotation-transformer"><rect x={box.x-5} y={box.y-5} width={box.width+10} height={box.height+10} /><line x1={box.cx} y1={box.y-5} x2={box.cx} y2={box.y-32} /><circle cx={box.cx} cy={box.y-36} r="6" onPointerDown={(event) => start(event, stroke, "rotate")} />{[[box.x-5,box.y-5,"nw"],[box.x+box.width+5,box.y-5,"ne"],[box.x-5,box.y+box.height+5,"sw"],[box.x+box.width+5,box.y+box.height+5,"se"]].map(([x,y,handle]) => <rect key={String(handle)} x={Number(x)-5} y={Number(y)-5} width="10" height="10" onPointerDown={(event) => start(event, stroke, "resize", String(handle))} />)}</g>}
            </g>;
        })}
    </svg>;
}
