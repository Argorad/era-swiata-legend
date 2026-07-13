import {
    useEffect,
    useRef,
    useState,
} from "react";

interface Props {
    onCreateSubfolder: () => void;
    onRename: () => void;
    onMove: () => void;
    onArchive: () => void;
    onTrash: () => void;
}

export default function FolderActions({
    onCreateSubfolder,
    onRename,
    onMove,
    onArchive,
    onTrash,
}: Props) {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        const handlePointerDown = (
            event: PointerEvent,
        ) => {
            if (
                menuRef.current &&
                !menuRef.current.contains(
                    event.target as Node,
                )
            ) {
                setIsOpen(false);
            }
        };

        window.addEventListener(
            "pointerdown",
            handlePointerDown,
        );

        return () =>
            window.removeEventListener(
                "pointerdown",
                handlePointerDown,
            );
    }, [isOpen]);

    const runAction = (action: () => void) => {
        setIsOpen(false);
        action();
    };

    return (
        <div
            className="folder-actions"
            ref={menuRef}
        >
            <button
                type="button"
                className="folder-actions-trigger"
                aria-label="Akcje folderu"
                aria-expanded={isOpen}
                onClick={() =>
                    setIsOpen(
                        (current) => !current,
                    )
                }
            >
                ⋮
            </button>

            {isOpen && (
                <div className="folder-actions-menu">
                    <button
                        type="button"
                        onClick={() =>
                            runAction(
                                onCreateSubfolder,
                            )
                        }
                    >
                        <span>＋</span>
                        Nowy podfolder
                    </button>

                    <button
                        type="button"
                        onClick={() =>
                            runAction(onRename)
                        }
                    >
                        <span>✎</span>
                        Zmień nazwę
                    </button>

                    <button
                        type="button"
                        onClick={() =>
                            runAction(onMove)
                        }
                    >
                        <span>↪</span>
                        Przenieś...
                    </button>

                    <button
                        type="button"
                        onClick={() =>
                            runAction(onArchive)
                        }
                    >
                        <span>▣</span>
                        Archiwizuj
                    </button>

                    <button
                        type="button"
                        className="folder-action-danger"
                        onClick={() =>
                            runAction(onTrash)
                        }
                    >
                        <span>⌫</span>
                        Przenieś do kosza
                    </button>
                </div>
            )}
        </div>
    );
}