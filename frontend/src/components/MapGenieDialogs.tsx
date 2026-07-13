import { useState } from "react";
import { api, apiBaseUrl } from "../services/api";
import type { FileAttachment } from "../types/FileAttachment";
import type { Folder } from "../types/Folder";
import type { MapMarker, SaveMapMarker } from "../types/MapMarker";
import type { MapImageLayer, SaveMapImageLayer } from "../types/MapComposition";
import type { MarkerCategory, SaveMarkerCategory } from "../types/MarkerCategory";
import type { Page } from "../types/Page";
import type { SaveWorldMap, WorldMapModel, WorldMapType } from "../types/WorldMap";
import ModalPortal from "./ModalPortal";

interface MapDialogProps {
    worldId: string;
    map: WorldMapModel | null;
    folders: Folder[];
    onSave: (value: SaveWorldMap) => Promise<void>;
    onClose: () => void;
}

export function MapDialog({ worldId, map, folders, onSave, onClose }: MapDialogProps) {
    const normalFolders = folders.filter((folder) => folder.type === 0);
    const [name, setName] = useState(map?.name ?? "");
    const [description, setDescription] = useState(map?.description ?? "");
    const [type, setType] = useState<WorldMapType>(map?.type ?? 0);
    const [isPublished, setIsPublished] = useState(map?.isPublished ?? false);
    const [folderId, setFolderId] = useState(normalFolders[0]?.id ?? "");
    const [image, setImage] = useState<File | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const submit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!name.trim()) { setError("Podaj nazwę mapy."); return; }
        if (!map && (!image || !folderId)) { setError("Wybierz obraz mapy i zwykły folder do jego bezpiecznego zapisu."); return; }
        if (image && !image.type.startsWith("image/")) { setError("Obraz bazowy musi być plikiem graficznym."); return; }
        try {
            setIsSaving(true);
            let imageFileId = map?.imageFileId ?? "";
            if (image) {
                const form = new FormData();
                form.append("file", image);
                const response = await api.post<FileAttachment>(`/worlds/${worldId}/folders/${folderId}/files/map-image`, form);
                imageFileId = response.data.id;
            }
            await onSave({ name: name.trim(), description: description.trim(), type, imageFileId, isPublished });
            onClose();
        } catch {
            setError("Nie udało się zapisać mapy ani jej obrazu.");
        } finally { setIsSaving(false); }
    };

    return <ModalPortal><div className="page-dialog-backdrop"><form className="page-dialog map-dialog" onSubmit={submit}>
        <span className="page-dialog-kicker">Mini-MapGenie</span><h3>{map ? "Edytuj mapę" : "Nowa mapa"}</h3>
        <label htmlFor="map-name">Nazwa</label><input id="map-name" value={name} maxLength={200} onChange={(event) => setName(event.target.value)} autoFocus disabled={isSaving} />
        <label htmlFor="map-description">Opis</label><textarea id="map-description" value={description} maxLength={2000} rows={4} onChange={(event) => setDescription(event.target.value)} disabled={isSaving} />
        <label htmlFor="map-type">Typ</label><select id="map-type" value={type} onChange={(event) => setType(Number(event.target.value) as WorldMapType)} disabled={isSaving}><option value={0}>Świat</option><option value={1}>Region</option><option value={2}>Miasto</option><option value={3}>Loch</option></select>
        <label htmlFor="map-folder">Folder przechowujący obraz</label><select id="map-folder" value={folderId} onChange={(event) => setFolderId(event.target.value)} disabled={isSaving || normalFolders.length === 0}><option value="">Wybierz zwykły folder</option>{normalFolders.map((folder) => <option key={folder.id} value={folder.id}>{folder.name}</option>)}</select>
        <label htmlFor="map-image">{map ? "Nowy obraz (opcjonalnie)" : "Obraz bazowy"}</label><input id="map-image" type="file" accept=".png,.jpg,.jpeg,.webp,.avif,image/png,image/jpeg,image/webp,image/avif" onChange={(event) => setImage(event.target.files?.[0] ?? null)} disabled={isSaving} />
        {map && <small className="dialog-hint">Pozostaw puste, aby zachować obecny obraz. Zmiana obrazu nie usuwa markerów.</small>}
        <label className="dialog-checkbox"><input type="checkbox" checked={isPublished} onChange={(event) => setIsPublished(event.target.checked)} disabled={isSaving} /> Opublikowana dla graczy</label>
        {error && <p className="page-dialog-error">{error}</p>}<div className="page-dialog-actions"><button type="button" className="page-button page-button--ghost" onClick={onClose} disabled={isSaving}>Anuluj</button><button type="submit" className="page-button page-button--primary" disabled={isSaving}>{isSaving ? "Zapisywanie..." : "Zapisz mapę"}</button></div>
    </form></div></ModalPortal>;
}

interface CategoryDialogProps {
    category: MarkerCategory | null;
    suggestedOrder: number;
    onSave: (value: SaveMarkerCategory) => Promise<void>;
    onClose: () => void;
}

export function CategoryDialog({ category, suggestedOrder, onSave, onClose }: CategoryDialogProps) {
    const [name, setName] = useState(category?.name ?? "");
    const [icon, setIcon] = useState(category?.icon ?? "◆");
    const [color, setColor] = useState(category?.color ?? "#c89b4b");
    const [sortOrder, setSortOrder] = useState(category?.sortOrder ?? suggestedOrder);
    const [isActive, setIsActive] = useState(category?.isActive ?? true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const submit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!name.trim() || !icon.trim() || !/^#[0-9a-f]{6}$/i.test(color)) { setError("Podaj nazwę, ikonę i kolor w formacie #RRGGBB."); return; }
        try { setIsSaving(true); await onSave({ name: name.trim(), icon: icon.trim(), color, sortOrder, isActive }); onClose(); }
        catch { setError("Nie udało się zapisać kategorii."); }
        finally { setIsSaving(false); }
    };
    return <ModalPortal><div className="page-dialog-backdrop"><form className="page-dialog page-dialog--compact" onSubmit={submit}>
        <span className="page-dialog-kicker">Kategorie markerów</span><h3>{category ? "Edytuj kategorię" : "Nowa kategoria"}</h3>
        <label htmlFor="category-name">Nazwa</label><input id="category-name" value={name} maxLength={100} onChange={(event) => setName(event.target.value)} autoFocus disabled={isSaving} />
        <div className="marker-position-fields"><label htmlFor="category-icon">Ikona<input id="category-icon" value={icon} maxLength={40} onChange={(event) => setIcon(event.target.value)} disabled={isSaving} /></label><label htmlFor="category-color">Kolor<input id="category-color" type="color" value={color} onChange={(event) => setColor(event.target.value)} disabled={isSaving} /></label></div>
        <label htmlFor="category-order">Kolejność</label><input id="category-order" type="number" min={0} max={10000} value={sortOrder} onChange={(event) => setSortOrder(Number(event.target.value))} disabled={isSaving} />
        <label className="dialog-checkbox"><input type="checkbox" checked={isActive} onChange={(event) => setIsActive(event.target.checked)} disabled={isSaving} /> Kategoria aktywna</label>
        {error && <p className="page-dialog-error">{error}</p>}<div className="page-dialog-actions"><button type="button" className="page-button page-button--ghost" onClick={onClose} disabled={isSaving}>Anuluj</button><button type="submit" className="page-button page-button--primary" disabled={isSaving}>{isSaving ? "Zapisywanie..." : "Zapisz kategorię"}</button></div>
    </form></div></ModalPortal>;
}

interface MarkerDialogProps {
    marker: MapMarker | null;
    currentMapId: string;
    position: { x: number; y: number };
    categories: MarkerCategory[];
    maps: WorldMapModel[];
    folders: Folder[];
    pages: Page[];
    onSave: (value: SaveMapMarker) => Promise<void>;
    onClose: () => void;
}

export function MarkerDialog({ marker, currentMapId, position, categories, maps, folders, pages, onSave, onClose }: MarkerDialogProps) {
    const initialCategory = categories.find((item) => item.id === marker?.categoryId) ?? categories.find((item) => item.isActive) ?? categories[0];
    const [categoryId, setCategoryId] = useState(initialCategory?.id ?? "");
    const [name, setName] = useState(marker?.name ?? "");
    const [description, setDescription] = useState(marker?.description ?? "");
    const [icon, setIcon] = useState(marker?.icon ?? initialCategory?.icon ?? "◆");
    const [color, setColor] = useState(marker?.color ?? initialCategory?.color ?? "#c89b4b");
    const [isPublished, setIsPublished] = useState(marker?.isPublished ?? false);
    const [isPositionLocked, setIsPositionLocked] = useState(marker?.isPositionLocked ?? false);
    const [folderId, setFolderId] = useState(marker?.folderId ?? "");
    const [pageId, setPageId] = useState(marker?.pageId ?? "");
    const [targetMapId, setTargetMapId] = useState(marker?.targetMapId ?? "");
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const selectCategory = (id: string) => { setCategoryId(id); const category = categories.find((item) => item.id === id); if (category && !marker) { setIcon(category.icon); setColor(category.color); } };
    const submit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!name.trim() || !categoryId || !icon.trim()) { setError("Podaj nazwę, kategorię i ikonę markera."); return; }
        try {
            setIsSaving(true);
            await onSave({ categoryId, name: name.trim(), description: description.trim(), icon: icon.trim(), color, positionX: marker?.positionX ?? position.x, positionY: marker?.positionY ?? position.y, isPublished, isPositionLocked, folderId: folderId || null, pageId: pageId || null, targetMapId: targetMapId || null });
            onClose();
        } catch { setError("Nie udało się zapisać markera. Sprawdź powiązania."); }
        finally { setIsSaving(false); }
    };
    return <ModalPortal><div className="page-dialog-backdrop"><form className="page-dialog map-dialog" onSubmit={submit}>
        <span className="page-dialog-kicker">Punkt na mapie</span><h3>{marker ? "Edytuj marker" : "Dodaj marker"}</h3>
        <label htmlFor="marker-name">Nazwa</label><input id="marker-name" value={name} maxLength={200} onChange={(event) => setName(event.target.value)} autoFocus disabled={isSaving} />
        <label htmlFor="marker-description">Opis</label><textarea id="marker-description" value={description} maxLength={2000} rows={4} onChange={(event) => setDescription(event.target.value)} disabled={isSaving} />
        <label htmlFor="marker-category">Kategoria</label><select id="marker-category" value={categoryId} onChange={(event) => selectCategory(event.target.value)} disabled={isSaving}>{categories.map((category) => <option key={category.id} value={category.id}>{category.icon} {category.name}{category.isActive ? "" : " (wyłączona)"}</option>)}</select>
        <div className="marker-position-fields"><label htmlFor="marker-icon">Ikona<input id="marker-icon" value={icon} maxLength={40} onChange={(event) => setIcon(event.target.value)} disabled={isSaving} /></label><label htmlFor="marker-color">Kolor<input id="marker-color" type="color" value={color} onChange={(event) => setColor(event.target.value)} disabled={isSaving} /></label></div>
        <label htmlFor="marker-folder">Powiązany folder</label><select id="marker-folder" value={folderId} onChange={(event) => { setFolderId(event.target.value); setPageId(""); }} disabled={isSaving}><option value="">Bez folderu</option>{folders.map((folder) => <option key={folder.id} value={folder.id}>{folder.name}</option>)}</select>
        <label htmlFor="marker-page">Powiązana strona</label><select id="marker-page" value={pageId} onChange={(event) => { const id = event.target.value; setPageId(id); const page = pages.find((item) => item.id === id); if (page) setFolderId(page.folderId); }} disabled={isSaving}><option value="">Bez strony</option>{pages.filter((page) => !folderId || page.folderId === folderId).map((page) => <option key={page.id} value={page.id}>{page.title}</option>)}</select>
        <label htmlFor="marker-map-link">Powiązana mapa</label><select id="marker-map-link" value={targetMapId} onChange={(event) => setTargetMapId(event.target.value)} disabled={isSaving}><option value="">Bez mapy</option>{maps.filter((item) => item.id !== currentMapId).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
        <label className="dialog-checkbox"><input type="checkbox" checked={isPublished} onChange={(event) => setIsPublished(event.target.checked)} disabled={isSaving} /> Widoczny dla graczy</label>
        <label className="dialog-checkbox"><input type="checkbox" checked={isPositionLocked} onChange={(event) => setIsPositionLocked(event.target.checked)} disabled={isSaving} /> Zablokuj pozycję markera</label>
        {error && <p className="page-dialog-error">{error}</p>}<div className="page-dialog-actions"><button type="button" className="page-button page-button--ghost" onClick={onClose} disabled={isSaving}>Anuluj</button><button type="submit" className="page-button page-button--primary" disabled={isSaving}>{isSaving ? "Zapisywanie..." : "Zapisz marker"}</button></div>
    </form></div></ModalPortal>;
}

interface ConfirmDialogProps { title: string; message: string; confirmation?: string; busy: boolean; onConfirm: () => void; onClose: () => void; }
export function ConfirmDialog({ title, message, confirmation, busy, onConfirm, onClose }: ConfirmDialogProps) {
    const [typed, setTyped] = useState("");
    const enabled = !confirmation || typed === confirmation;
    return <ModalPortal><div className="page-dialog-backdrop"><section className="page-dialog page-dialog--compact" role="dialog" aria-modal="true"><span className="page-dialog-kicker">Potwierdzenie operacji</span><h3>{title}</h3><p className="danger-copy">{message}</p>{confirmation && <><label htmlFor="confirm-map-action">Wpisz {confirmation}</label><input id="confirm-map-action" value={typed} onChange={(event) => setTyped(event.target.value)} autoFocus /></>}<div className="page-dialog-actions"><button type="button" className="page-button page-button--ghost" onClick={onClose} disabled={busy}>Anuluj</button><button type="button" className="page-button page-button--danger" onClick={onConfirm} disabled={busy || !enabled}>{busy ? "Wykonywanie..." : "Potwierdź"}</button></div></section></div></ModalPortal>;
}

interface LayerDialogProps {
    worldId: string;
    layer: MapImageLayer | null;
    images: FileAttachment[];
    initialPosition: { x: number; y: number } | null;
    nextOrder: number;
    onSave: (value: SaveMapImageLayer) => Promise<void>;
    onClose: () => void;
}

export function LayerDialog({ worldId, layer, images, initialPosition, nextOrder, onSave, onClose }: LayerDialogProps) {
    const [fileAttachmentId, setFileAttachmentId] = useState(layer?.fileAttachmentId ?? images[0]?.id ?? "");
    const selectedFile = images.find((file) => file.id === fileAttachmentId);
    const [name, setName] = useState(layer?.name ?? selectedFile?.originalName ?? "Warstwa obrazu");
    const [positionX, setPositionX] = useState(layer?.positionX ?? initialPosition?.x ?? 0);
    const [positionY, setPositionY] = useState(layer?.positionY ?? initialPosition?.y ?? 0);
    const [scale, setScale] = useState(layer?.scale ?? 1);
    const [rotation, setRotation] = useState(layer?.rotation ?? 0);
    const [sortOrder, setSortOrder] = useState(layer?.sortOrder ?? nextOrder);
    const [isVisible, setIsVisible] = useState(layer?.isVisible ?? true);
    const [isVisibleToPlayers, setIsVisibleToPlayers] = useState(layer?.isVisibleToPlayers ?? true);
    const [isLocked, setIsLocked] = useState(layer?.isLocked ?? false);
    const [opacity, setOpacity] = useState(layer?.opacity ?? 1);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [query, setQuery] = useState("");
    const matchingImages = images.filter((file) => file.originalName.toLocaleLowerCase("pl").includes(query.trim().toLocaleLowerCase("pl")));
    const submit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!fileAttachmentId || !name.trim()) { setError("Wybierz obraz i podaj nazwę warstwy."); return; }
        try {
            setSaving(true);
            await onSave({ fileAttachmentId, name: name.trim(), positionX, positionY, scale, rotation, sortOrder, isVisible, isVisibleToPlayers, isLocked, opacity });
            onClose();
        } catch { setError(layer?.isLocked ? "Element jest zablokowany" : "Nie udało się zapisać warstwy."); }
        finally { setSaving(false); }
    };
    return <ModalPortal><div className="page-dialog-backdrop"><form className="page-dialog map-dialog" onSubmit={submit}>
        <span className="page-dialog-kicker">Aktualna kompozycja mapy</span><h3>{layer ? "Ustawienia warstwy" : "Dodaj obraz z Biblioteki"}</h3>
        {!layer && <><p className="dialog-hint">Wybrany obraz zostanie dodany jako kolejna warstwa do tej mapy. Oryginalny plik pozostanie nietknięty.</p><label htmlFor="layer-search">Szukaj obrazu</label><input id="layer-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Nazwa JPG, PNG, WebP lub AVIF…" /><div className="library-image-picker" role="listbox" aria-label="Obrazy w Bibliotece">{matchingImages.map((file) => <button key={file.id} type="button" role="option" aria-selected={fileAttachmentId === file.id} className={fileAttachmentId === file.id ? "is-selected" : ""} onClick={() => { setFileAttachmentId(file.id); setName(file.originalName); }}><img src={`${apiBaseUrl}/worlds/${worldId}/files/${file.id}/download`} alt="" loading="lazy" /><span><strong>{file.originalName}</strong><small>{file.contentType.replace("image/", "").toUpperCase()} · {(file.size / 1024 / 1024).toFixed(1)} MB</small></span></button>)}</div>{matchingImages.length === 0 && images.length > 0 && <p className="dialog-hint">Brak obrazów pasujących do wyszukiwania.</p>}</>}
        {layer && <><label htmlFor="layer-file">Plik źródłowy</label><input id="layer-file" value={selectedFile?.originalName ?? layer.fileName} disabled /></>}
        {images.length === 0 && <p className="page-dialog-error">Brak bezpiecznych obrazów PNG, JPG, WebP lub AVIF w Bibliotece.</p>}
        <label htmlFor="layer-name">Nazwa</label><input id="layer-name" value={name} maxLength={200} onChange={(event) => setName(event.target.value)} disabled={saving} />
        <div className="marker-position-fields"><label>Pozycja X<input type="number" step="1" value={positionX} onChange={(event) => setPositionX(Number(event.target.value))} /></label><label>Pozycja Y<input type="number" step="1" value={positionY} onChange={(event) => setPositionY(Number(event.target.value))} /></label></div>
        <div className="marker-position-fields"><label>Skala<input type="number" min="0.05" max="20" step="0.05" value={scale} onChange={(event) => setScale(Number(event.target.value))} /></label><label>Obrót °<input type="number" min="-3600" max="3600" step="1" value={rotation} onChange={(event) => setRotation(Number(event.target.value))} /></label></div>
        <label>Kolejność<input type="number" min="0" max="100000" value={sortOrder} onChange={(event) => setSortOrder(Number(event.target.value))} /></label>
        <label>Krycie: {Math.round(opacity * 100)}%<input type="range" min="0" max="1" step="0.05" value={opacity} onChange={(event) => setOpacity(Number(event.target.value))} /></label>
        <label className="dialog-checkbox"><input type="checkbox" checked={isVisible} onChange={(event) => setIsVisible(event.target.checked)} /> Warstwa widoczna</label>
        <label className="dialog-checkbox"><input type="checkbox" checked={isVisibleToPlayers} onChange={(event) => setIsVisibleToPlayers(event.target.checked)} /> Widoczna dla graczy</label>
        <label className="dialog-checkbox"><input type="checkbox" checked={isLocked} onChange={(event) => setIsLocked(event.target.checked)} /> Zablokowana</label>
        {error && <p className="page-dialog-error">{error}</p>}<div className="page-dialog-actions"><button type="button" className="page-button page-button--ghost" onClick={onClose}>Anuluj</button><button type="submit" className="page-button page-button--primary" disabled={saving || images.length === 0}>{saving ? "Zapisywanie..." : "Zapisz warstwę"}</button></div>
    </form></div></ModalPortal>;
}
