import { ReactNode } from "react";
import clsx from "clsx";

export interface ActionButtonProps {
    children?: ReactNode;
    active?: boolean;
    disabled?: boolean;
    onClick?: () => void;
}

export default function ActionButton({
    children,
    active = false,
    disabled = false,
    onClick
}: ActionButtonProps) {

    return (
        <button
            className={clsx(
                "action-button",
                active && "is-active",
                disabled && "is-disabled"
            )}
            onClick={!disabled ? onClick : undefined}>
            {children}
        </button>
    );
}
