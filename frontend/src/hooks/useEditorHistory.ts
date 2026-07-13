import { useCallback, useState } from "react";

export interface EditorHistoryCommand {
    label: string;
    undo: () => Promise<void>;
    redo: () => Promise<void>;
}

export function useEditorHistory(onError: (message: string) => void) {
    const [undoStack, setUndoStack] = useState<EditorHistoryCommand[]>([]);
    const [redoStack, setRedoStack] = useState<EditorHistoryCommand[]>([]);
    const [busy, setBusy] = useState(false);
    const record = useCallback((command: EditorHistoryCommand) => {
        setUndoStack((current) => [...current.slice(-99), command]);
        setRedoStack([]);
    }, []);

    const undo = useCallback(async () => {
        const command = undoStack.at(-1);
        if (!command || busy) return;
        setUndoStack((current) => current.slice(0, -1));
        setBusy(true);
        try {
            await command.undo();
            setRedoStack((current) => [...current, command]);
        } catch {
            setUndoStack((current) => [...current, command]);
            onError(`Nie udało się cofnąć: ${command.label}`);
        } finally {
            setBusy(false);
        }
    }, [busy, onError, undoStack]);

    const redo = useCallback(async () => {
        const command = redoStack.at(-1);
        if (!command || busy) return;
        setRedoStack((current) => current.slice(0, -1));
        setBusy(true);
        try {
            await command.redo();
            setUndoStack((current) => [...current, command]);
        } catch {
            setRedoStack((current) => [...current, command]);
            onError(`Nie udało się ponowić: ${command.label}`);
        } finally {
            setBusy(false);
        }
    }, [busy, onError, redoStack]);

    const clear = useCallback(() => {
        setUndoStack([]);
        setRedoStack([]);
    }, []);

    return {
        record, undo, redo, clear, busy,
        undoCount: undoStack.length,
        redoCount: redoStack.length,
        undoLabel: undoStack.at(-1)?.label,
        redoLabel: redoStack.at(-1)?.label,
    };
}
