import { Engine } from "@/types";
import { createContext, Dispatch, SetStateAction, useContext } from "react";
export type EngineState = Engine & {
    updateView: (patch: Partial<Engine['view']>) => void;
    setGridSize: Dispatch<SetStateAction<number>>;
    setUnit: Dispatch<SetStateAction<Engine['unit']>>;
    setMode: Dispatch<SetStateAction<Engine['mode']>>;
    scalePixel: (pixel: number, min?: number, max?: number) => number;
}

export const EngineContext = createContext<EngineState | undefined>(undefined);

export const useEngine = () => {
    const ctx = useContext(EngineContext);
    if (!ctx) throw new Error("useEngine should call inside EngineProvider");
    return ctx;
}
