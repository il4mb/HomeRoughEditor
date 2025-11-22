import { Point } from "@/types";
import { createContext, useContext } from "react";

export type SnapState = {
    snapGrid: (point: Point, threshold?: number) => Point;
    snapWall: (point: Point, threshold?: number) => Point;
    snap: (point: Point, threshold?: number) => Point;
}
export const SnapContext = createContext<SnapState | undefined>(undefined);

export const useSnap = () => {
    const ctx = useContext(SnapContext);
    if (!ctx) throw new Error("useSnap should call inside SnapContext");
    return ctx;
}