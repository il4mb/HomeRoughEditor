import { useCanvas, useMouseDown, useMouseMove, useMouseUp } from '@/hooks/useCanvas';
import { useEditor } from '@/hooks/useEditor';
import { useEngine } from '@/hooks/useEngine';
import { useSnap } from '@/hooks/useSnap';
import { useClearInvalidWalls, useWallEngine } from '@/hooks/useWallEngine';
import { Point, Wall } from '@/types';
import { LineSegment } from '@/utils/line2d';
import Poly2 from '@/utils/polygon2d';
import Vec2 from '@/utils/vec2d';
import WallUtils from '@/utils/wallUtils';
import { useCallback, useEffect, useMemo, useState } from 'react';

type Moving = {
    wallId: Wall['id'];
    wallPointIndex: number;
}

export interface Props {
    walls: Wall[];
}
export default function WallVerticlesManager({ walls }: Props) {

    const { updateWall } = useEditor();
    const { clientToWorldPoint } = useCanvas();
    const { scalePixel } = useEngine();
    const { snapGrid } = useSnap();
    const cleanWalls = useClearInvalidWalls();
    const [moving, setMoving] = useState<Moving[]>([]);
    const [hoveredIndex, setHoveredIndex] = useState(-1);
    const [movingIndex, setMovingIndex] = useState(-1);
    const isMoving = useMemo(() => Boolean(moving.length > 0), [moving]);

    const CLICK_THRESHOLD = useMemo(() => scalePixel(15), [scalePixel]);

    const points = useMemo(() => {
        return Poly2.removeDuplicate(walls.map(wall => wall.points).flat());
    }, [walls]);

    const handleMoveWalls = useCallback((point: Point) => {
        const snap = snapGrid(point);
        moving.forEach((move) => {
            const wall = walls.find(w => w.id == move.wallId);
            if (!wall) return;
            const wallLineSeg = wall.points;
            const index = move.wallPointIndex;
            const points = wallLineSeg.map((x, i) => i == index ? snap : x) as LineSegment;
            updateWall(wall.id, { points });
        })
    }, [snapGrid, moving, walls]);

    useMouseDown((e) => {
        const world = clientToWorldPoint({ x: e.clientX, y: e.clientY });
        const nearest = Vec2.nearest(world, points);
        if (nearest.distance < CLICK_THRESHOLD) {
            const nearestPoint = nearest.point;
            const moving = WallUtils.findConnectedAtPoint(nearestPoint, walls).map((connection) => ({
                wallId: connection.wall.id,
                wallPointIndex: connection.index
            }));
            setMoving(moving);
            setMovingIndex(nearest.index);
        }
    }, [points, CLICK_THRESHOLD, clientToWorldPoint]);

    useMouseUp(() => {
        if (!isMoving) return;
        cleanWalls();
        setMoving([]);
        setMovingIndex(-1);
        setHoveredIndex(-1);
    }, [cleanWalls, isMoving]);

    useMouseMove((e) => {
        if (e.isDefaultPrevented()) return;
        const world = clientToWorldPoint({ x: e.clientX, y: e.clientY });
        if (isMoving) {
            e.preventDefault();
            e.currentTarget.style.cursor = "move";
            handleMoveWalls(world);
        } else {
            const nearest = Vec2.nearest(world, points);
            const vertIndex = nearest.distance < CLICK_THRESHOLD ? nearest.index : -1;
            setHoveredIndex(vertIndex);
            if (vertIndex > -1) {
                e.preventDefault();
            }
        }
    }, [clientToWorldPoint, handleMoveWalls, isMoving, CLICK_THRESHOLD]);

    return (
        <>

            {points.map(({ x, y }, i) => (
                <circle
                    key={i}
                    cx={x}
                    cy={y}
                    r={scalePixel(5, 3, 150) + (!isMoving && hoveredIndex == i ? scalePixel(2) : 0)}
                    fill={isMoving ? 'orange' : 'green'}
                    className={!isMoving && hoveredIndex == i ? 'animate-breath' : ''}
                    style={{
                        opacity: hoveredIndex == i || movingIndex == i ? 1 : 0,
                        cursor: "move"
                    }} />
            ))}

        </>
    );
}