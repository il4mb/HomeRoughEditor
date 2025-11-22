import { Point, Rect } from "@/types";
import { createContext, useContext, useEffect } from "react";

export type EventName = "mousedown" | "mousemove" | "mouseup" | "mouseleave" | "mouseenter" | "contextmenu" | 'wheel';
export type EventListeners = Map<EventName, Map<string, Callback>>;
export type Callback = (e: MouseEvent) => void;
export type Unsubscribe = (() => void) | undefined;



export type CanvasState = {
    rect: Rect;
    addListener(event: EventName, callback: Callback): Unsubscribe;
    clientToWorldPoint: (point: Point) => Point;
    worldToScreenPoint: (point: Point) => Point;
}

export const CanvasContext = createContext<CanvasState | undefined>(undefined);


export const useCanvas = () => {
    const ctx = useContext(CanvasContext);
    if (!ctx) throw new Error("useCanvas should call inside <CanvasContext/>");
    return ctx;
}

function createMouseHook(eventName: EventName) {
    return function useMouseEvent(callback: Callback, deps: any[] = []) {
        const { addListener } = useCanvas();

        useEffect(() => {
            const unsub = addListener(eventName, callback);
            return unsub;
        }, deps);
    };
}

export const useMouseDown = createMouseHook("mousedown");
export const useMouseMove = createMouseHook("mousemove");
export const useMouseUp = createMouseHook("mouseup");
export const useMouseLeave = createMouseHook("mouseleave");
export const useMouseEnter = createMouseHook("mouseenter");
export const useContextMenu = createMouseHook("contextmenu");