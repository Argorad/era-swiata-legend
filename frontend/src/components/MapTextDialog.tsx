import { useEffect, useState } from "react";
import ModalPortal from "./ModalPortal";

export interface MapTextStyle {
    text: string;
    fontSize: number;
    color: string;
    fillColor: string;
    hasBorder: boolean;
}

interface Props {
    initialText: string;
    fontSize: number;
    color: string;
    fillColor: string;
    hasBorder: boolean;
    onSave: (value: MapTextStyle) => Promise<void>;
    onClose: () => void;
}

export default function MapTextDialog(props: Props) {
    const [text, setText] = useState(props.initialText);
    const [fontSize, setFontSize] = useState(props.fontSize);
    const [color, setColor] = useState(props.color);
    const [fillColor, setFillColor] = useState(props.fillColor);
    const [hasBorder, setHasBorder] = useState(props.hasBorder);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const onClose = props.onClose;
    useEffect(() => {
        const escape = (event: KeyboardEvent) => {
            if (event.key === "Escape" && !saving) onClose();
        };
        document.addEventListener("keydown", escape);
        return () => document.removeEventListener("keydown", escape);
    }, [onClose, saving]);

    const submit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!text.trim()) { setError("Wpisz treść tekstu."); return; }
        try {
            setSaving(true);
            await props.onSave({ text: text.trim(), fontSize, color, fillColor, hasBorder });
            props.onClose();
        } catch { setError("Nie udało się zapisać tekstu."); }
        finally { setSaving(false); }
    };

    const shortcut = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
            event.preventDefault();
            event.currentTarget.form?.requestSubmit();
        }
    };

    return <ModalPortal><div className="page-dialog-backdrop"><form data-testid="map-text-dialog" className="page-dialog map-text-dialog" onSubmit={submit}>
        <span className="page-dialog-kicker">Adnotacja mapy</span><h3>Dodaj tekst</h3>
        <label htmlFor="map-text-content">Treść</label>
        <textarea id="map-text-content" data-testid="map-text-content" value={text} maxLength={2000} rows={6} autoFocus disabled={saving} onKeyDown={shortcut} onChange={(event) => setText(event.target.value)} />
        <div className="marker-position-fields"><label>Rozmiar<input type="number" min="8" max="240" value={fontSize} disabled={saving} onChange={(event) => setFontSize(Number(event.target.value))} /></label><label>Kolor<input type="color" value={color} disabled={saving} onChange={(event) => setColor(event.target.value)} /></label></div>
        <label className="dialog-checkbox"><input type="checkbox" checked={fillColor !== "transparent"} disabled={saving} onChange={(event) => setFillColor(event.target.checked ? "#f1d28a" : "transparent")} /> Tło tekstu</label>
        <label className="dialog-checkbox"><input type="checkbox" checked={hasBorder} disabled={saving} onChange={(event) => setHasBorder(event.target.checked)} /> Ramka</label>
        <small className="dialog-hint">Ctrl+Enter zapisuje, Escape anuluje.</small>
        {error && <p className="page-dialog-error">{error}</p>}
        <div className="page-dialog-actions"><button type="button" className="page-button page-button--ghost" disabled={saving} onClick={props.onClose}>Anuluj</button><button type="submit" className="page-button page-button--primary" disabled={saving}>{saving ? "Zapisywanie…" : "Dodaj tekst"}</button></div>
    </form></div></ModalPortal>;
}
