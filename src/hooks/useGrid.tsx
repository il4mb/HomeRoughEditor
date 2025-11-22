import { Point } from "@/types";
import { createContext, useContext } from "react";

export type GridPoint = Point & {
    type: "major" | "minor";
}
export type GridState = {
    disabled?: boolean;
    points: GridPoint[];
    setPoints: (points: GridPoint[]) => void;
    setDisabled: (disabled: boolean) => void;
}
export const GridContext = createContext<GridState | undefined>(undefined);

export const useGrid = () => {
    const ctx = useContext(GridContext);
    if (!ctx) throw new Error("useGrid should call inside GridContext");
    return ctx;
}