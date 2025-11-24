import { createContext, ReactNode, useContext, useEffect, useRef } from "react";

interface PortalState {
    createPortal: (render: () => ReactNode) => string;
    updatePortal: (id: string, render: () => ReactNode) => boolean;
    removePortal: (id: string) => void;
}

export const PortalContext = createContext<PortalState | undefined>(undefined);

export const useCreatePortal = (render: () => ReactNode, deps: any[]) => {
    const ctx = useContext(PortalContext);
    if (!ctx) throw new Error("useCreatePortal should call inside PortalProvider");

    const portalIdRef = useRef<string | null>(null);

    useEffect(() => {
        if (!portalIdRef.current) {
            portalIdRef.current = ctx.createPortal(render);
        } else {
            ctx.updatePortal(portalIdRef.current, render);
        }
    }, deps);

    useEffect(() => {
        return () => {
            if (portalIdRef.current) {
                ctx.removePortal(portalIdRef.current);
                portalIdRef.current = null;
            }
        };
    }, [ctx]);
};

// Alternative hook with more explicit control
export const usePortal = () => {
    const ctx = useContext(PortalContext);
    if (!ctx) throw new Error("usePortal should call inside PortalProvider");

    return {
        createPortal: ctx.createPortal,
        updatePortal: ctx.updatePortal,
        removePortal: ctx.removePortal,
    };
};