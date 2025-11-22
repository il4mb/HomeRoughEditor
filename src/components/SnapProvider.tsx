import { useEngine } from '@/hooks/useEngine';
import { SnapContext, SnapState } from '@/hooks/useSnap';
import { Point } from '@/types';
import { ReactNode, useCallback, useMemo } from 'react';

export interface SnapProviderProps {
    children?: ReactNode;
}
export default function SnapProvider({ children }: SnapProviderProps) {

    const { gridSize, view } = useEngine();

    const snapGrid = (point: Point, threshold = 25): Point => {
        const gx = Math.round(point.x / gridSize) * gridSize;
        const gy = Math.round(point.y / gridSize) * gridSize;
        const dx = Math.abs(point.x - gx);
        const dy = Math.abs(point.y - gy);

        if (dx > threshold && dy > threshold) {
            return point;
        }
        return { x: gx, y: gy };
    };



    const snapWall = useCallback((point: Point, threshold = 25): Point => {

        return { x: 0, y: 0 }
    }, [view]);
    const snap = useCallback((point: Point, threshold = 25): Point => {

        return { x: 0, y: 0 }
    }, [snapGrid, snapWall]);

    const value = useMemo<SnapState>(() => ({
        snapGrid,
        snapWall,
        snap
    }), []);

    return (
        <SnapContext.Provider value={value}>
            {children}
        </SnapContext.Provider>
    );
}