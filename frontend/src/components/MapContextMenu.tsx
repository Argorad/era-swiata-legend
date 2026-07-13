import { useEffect, useRef } from "react";
import type { MapDrawingStroke, MapImageLayer } from "../types/MapComposition";
import type { MapMarker } from "../types/MapMarker";

export type MapContextAction =
    | "add-marker" | "add-image" | "add-text" | "start-drawing" | "center"
    | "open" | "edit" | "toggle-lock" | "toggle-visible" | "top" | "up" | "down" | "bottom"
    | "duplicate" | "delete" | "select";

interface Props {
    x: number;
    y: number;
    kind: "empty" | "marker" | "layer" | "annotation";
    readOnly: boolean;
    layer?: MapImageLayer;
    marker?: MapMarker;
    annotation?: MapDrawingStroke;
    onAction: (action: MapContextAction) => void;
}

export default function MapContextMenu({ x, y, kind, readOnly, layer, marker, annotation, onAction }: Props) {
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => { ref.current?.querySelector<HTMLButtonElement>("button")?.focus(); }, []);
    const item = (action: MapContextAction, label: string, disabled = false) =>
        <button key={action} role="menuitem" type="button" disabled={disabled} onClick={() => onAction(action)}>{label}</button>;
    let items;
    if (kind === "empty") items = readOnly ? [item("center", "⌖ Wyśrodkuj widok tutaj")] : [
        item("add-marker", "＋ Dodaj marker tutaj"), item("add-image", "▧ Dodaj obraz z Biblioteki tutaj"),
        item("add-text", "T Dodaj tekst tutaj"), item("start-drawing", "✎ Rozpocznij rysowanie tutaj"),
        item("center", "⌖ Wyśrodkuj widok tutaj"),
    ];
    else if (kind === "marker") items = readOnly ? [item("open", "Otwórz szczegóły")] : [
        item("open", "Otwórz szczegóły"), item("edit", "Edytuj"),
        item("toggle-lock", marker?.isPositionLocked ? "Odblokuj pozycję" : "Zablokuj pozycję"),
        item("toggle-visible", marker?.isPublished ? "Ukryj" : "Pokaż"), item("duplicate", "Duplikuj"), item("delete", "Usuń…"),
    ];
    else if (kind === "layer") items = readOnly ? [] : [
        item("select", "Zaznacz"), item("edit", "Edytuj transformację"),
        item("toggle-lock", layer?.isLocked ? "Odblokuj" : "Zablokuj"), item("toggle-visible", layer?.isVisible ? "Ukryj" : "Pokaż"),
        item("top", "Przenieś na wierzch"), item("up", "Przenieś wyżej"), item("down", "Przenieś niżej"), item("bottom", "Przenieś na spód"),
        item("duplicate", "Duplikuj"), item("delete", "Usuń z kompozycji…", Boolean(layer?.isLocked)),
    ];
    else items = readOnly ? [] : [
        item("select", "Zaznacz"), item("edit", annotation?.tool === "text" ? "Edytuj tekst i styl" : "Edytuj styl"),
        item("toggle-lock", annotation?.isLocked ? "Odblokuj" : "Zablokuj"), item("toggle-visible", annotation?.isVisible ? "Ukryj" : "Pokaż"),
        item("top", "Przenieś na wierzch"), item("up", "Przenieś wyżej"), item("down", "Przenieś niżej"), item("bottom", "Przenieś na spód"),
        item("duplicate", "Duplikuj"), item("delete", "Usuń", Boolean(annotation?.isLocked)),
    ];
    if (!items.length) return null;
    const keyboard = (event: React.KeyboardEvent<HTMLDivElement>) => {
        const buttons = [...event.currentTarget.querySelectorAll<HTMLButtonElement>("button:not(:disabled)")];
        const current = buttons.indexOf(document.activeElement as HTMLButtonElement);
        let next: number;
        if (event.key === "ArrowDown") next = (current + 1) % buttons.length;
        else if (event.key === "ArrowUp") next = (current - 1 + buttons.length) % buttons.length;
        else if (event.key === "Home") next = 0;
        else if (event.key === "End") next = buttons.length - 1;
        else return;
        event.preventDefault(); buttons[next]?.focus();
    };
    return <div ref={ref} className="map-context-menu full-context-menu" role="menu" style={{ left: x, top: y }} onKeyDown={keyboard}>{items}</div>;
}
