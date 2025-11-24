import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Wall } from "@/types";
import Vec2 from "@/utils/vec2d";
import WallUtils from "@/utils/wallUtils";
import { Polygon } from '@/utils/polygon2d';
import { useEditor } from './useEditor';


export type WallEngineState = {
    wallsPolygon: Map<string, Polygon>;
    mode: "line-hover" | "line-drag" | "vert-hover" | "vert-drag" | undefined;
    setMode(mode: WallEngineState['mode']): void;
}
const hasWallChanged = (w1: Wall, w2: Wall) => {
    if (w1.thickness !== w2.thickness) return true;
    return !Vec2.equal(w1.points[0], w2.points[0]) || !Vec2.equal(w1.points[1], w2.points[1]);
};
export const useWallEngine = () => {
    const ctx = useContext(WallEngineContext);
    if (!ctx) throw new Error("useWallsPolygonProvider should call inside <WallsPolygonProvider/>")
    return ctx;
}

export const WallEngineContext = createContext<WallEngineState | undefined>(undefined);
export const useWallGeometry = (walls: Wall[]) => {

    // Store polygons in a map for O(1) read/write
    const [wallsPolygon, setWallsPolygons] = useState<Map<string, Polygon>>(new Map());

    // Keep track of previous walls to perform diffing
    const prevWallsRef = useRef<Map<string, Wall>>(new Map());

    useEffect(() => {
        const currWallsMap = new Map(walls.map(w => [w.id, w]));
        const prevWallsMap = prevWallsRef.current;

        // 1. Identify "Dirty" IDs (Walls that changed + their neighbors)
        const dirtyIds = new Set<string>();
        const deletedIds = new Set<string>();

        // A. Check for Updates and New Walls
        for (const wall of walls) {
            const prevWall = prevWallsMap.get(wall.id);

            // If new wall OR geometry changed
            if (!prevWall || hasWallChanged(prevWall, wall)) {
                dirtyIds.add(wall.id);

                // Add Neighbors of the CURRENT position to dirty set
                const neighbors = WallUtils.findConnectedAtPoint(wall.points[0], walls, wall)
                    .concat(WallUtils.findConnectedAtPoint(wall.points[1], walls, wall));

                neighbors.forEach(n => dirtyIds.add(n.wall.id));

                // If it existed before, Add Neighbors of the PREVIOUS position 
                // (In case we broke a connection by moving it away)
                if (prevWall) {
                    // Note: We scan 'walls' (current list) using previous coordinates
                    // to find who *was* connected to us
                    const prevNeighbors = walls.filter(w =>
                        w.id !== wall.id &&
                        (Vec2.dist(w.points[0], prevWall.points[0]) < 1e-9 ||
                            Vec2.dist(w.points[1], prevWall.points[0]) < 1e-9 ||
                            Vec2.dist(w.points[0], prevWall.points[1]) < 1e-9 ||
                            Vec2.dist(w.points[1], prevWall.points[1]) < 1e-9)
                    );
                    prevNeighbors.forEach(n => dirtyIds.add(n.id));
                }
            }
        }

        // B. Check for Deleted Walls
        for (const [id, prevWall] of prevWallsMap) {
            if (!currWallsMap.has(id)) {
                deletedIds.add(id);
                // The wall is gone, but its former neighbors need to heal (become square ends)
                const formerNeighbors = walls.filter(w =>
                    w.id !== id &&
                    (Vec2.dist(w.points[0], prevWall.points[0]) < 1e-9 ||
                        Vec2.dist(w.points[1], prevWall.points[0]) < 1e-9 ||
                        Vec2.dist(w.points[0], prevWall.points[1]) < 1e-9 ||
                        Vec2.dist(w.points[1], prevWall.points[1]) < 1e-9)
                );
                formerNeighbors.forEach(n => dirtyIds.add(n.id));
            }
        }

        // 2. Optimization: If nothing dirty, do nothing
        if (dirtyIds.size === 0 && deletedIds.size === 0) {
            return;
        }

        // 3. Update State
        setWallsPolygons(prev => {
            const next = new Map(prev);

            // Remove deleted
            deletedIds.forEach(id => next.delete(id));

            // Update only dirty
            dirtyIds.forEach(id => {
                // Ensure wall still exists (it might have been in dirty set but deleted)
                const wallToUpdate = currWallsMap.get(id);
                if (wallToUpdate) {
                    // This is the heavy calculation
                    const polygon = WallUtils.createPolygon(wallToUpdate, walls);
                    next.set(id, polygon);
                }
            });

            return next;
        });

        // 4. Update Ref for next cycle
        prevWallsRef.current = currWallsMap;

    }, [walls]);

    return { wallsPolygon };
};


// For Clients
export const useWallPolygon = (id: string) => {
    const context = useWallEngine();
    return useMemo(() => context.wallsPolygon.get(id), [context.wallsPolygon, id]);
}
export const useWallsPolygon = () => {
    const context = useWallEngine();
    return useMemo(() => context.wallsPolygon, [context.wallsPolygon]);
}
export const useClearShortWalls = () => {

    const { data, setData } = useEditor();
    const invalidWalls = useMemo(() => {
        return data.walls.filter(w => Vec2.dist(w.points[0], w.points[1]) < w.thickness)
    }, [data.walls]);

    return useCallback(() => {
        if (invalidWalls.length === 0) return;
        setData(prev => ({
            ...prev,
            walls: prev.walls.filter(
                w => !invalidWalls.includes(w)
            )
        }));
    }, [invalidWalls, setData]);
};
