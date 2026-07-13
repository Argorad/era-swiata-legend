import type { ReactNode } from "react";
import { createPortal } from "react-dom";

interface Props {
    children: ReactNode;
}

export default function ModalPortal({ children }: Props) {
    const host = document.fullscreenElement ?? document.body;
    return createPortal(children, host);
}
