import { useCanvas, useMouseDown, useMouseMove, useMouseUp, usePointer } from '@/hooks/useCanvas';
import { useEditor } from '@/hooks/useEditor';
import { useSnap } from '@/hooks/useSnap';
import { useWallEngine } from '@/hooks/useWallEngine';
import { Point, Wall } from '@/types';
import Line2, { LineSegment } from '@/utils/line2d';
import Vec2 from '@/utils/vec2d';
import WallUtils, { WallConnect } from '@/utils/wallUtils';
import { useCallback, useEffect, useMemo, useState } from 'react';

interface Connection {
    point: Point;
    index: number;
    connections: WallConnect[];
}
export interface WallLinesManagerProps {
    walls: Wall[];
}
export default function WallLinesManager({ walls }: WallLinesManagerProps) {

    const { snapGrid } = useSnap();
    const { updateWalls } = useEditor();
    const { clientToWorldPoint } = useCanvas();

    const [hoveredId, setHoveredId] = useState<string>();
    const [movingId, setMovingId] = useState<string>();
    const [connections, setConnections] = useState<Connection[]>([]);
    const cuttedLines = useMemo<{ id: string, segment: LineSegment }[]>(() => walls.map(wall => {
        const segment = Line2.extendSegment(wall.points, -Math.max(Math.abs((wall.thickness / 2) + wall.thickness / 4), 17));
        return {
            id: wall.id,
            segment
        }
    }), [walls]);
    const movingWall = useMemo(() => walls.find(wall => wall.id == movingId), [walls, movingId]);
    const isMoving = Boolean(movingWall);

    const findNearestId = useCallback((world: Point) => {
        let min = Infinity;
        let id: any;
        for (const cWall of cuttedLines) {
            const distance = Line2.getDistanceToSegment(world, cWall.segment);
            if (distance < min) {
                min = distance;
                id = cWall.id;
            }
        }
        if (min <= 4) return id;
    }, [cuttedLines]);

    useMouseDown((e) => {
        if (!hoveredId) return;
        e.preventDefault();
        e.currentTarget.style.cursor = "move";
        const wall = walls.find(wall => wall.id == hoveredId);
        if (!wall) return;

        const connections = wall.points.map((point, index) => {
            const connections = WallUtils.findConnectedAtPoint(point, walls, wall);
            if (connections.length > 0) return { connections, point, index }
            return null;
        }).filter(e => e != null);
        setConnections(connections);

        setMovingId(hoveredId);
    }, [movingId, hoveredId, walls]);

    useMouseUp((e) => {
        if (!movingId) return;
        setMovingId(undefined);
        setHoveredId(undefined);
    }, [movingId]);

    const [intersections, setIntersections] = useState<Wall[]>([]);

    useMouseMove((e) => {
        if (e.isDefaultPrevented()) return;

        const world = clientToWorldPoint({ x: e.clientX, y: e.clientY });
        const snapped = snapGrid(world);

        if (movingWall) {

            e.preventDefault();
            e.currentTarget.style.cursor = "move";
            const seg: LineSegment = movingWall.points;
            const signedDist = Line2.getSignedDistanceToSegment(snapped, seg);

            // compute offset
            const normal = Line2.normal(seg);
            const offset = Vec2.mul(normal, signedDist);

            // apply to both endpoints
            const p0 = Vec2.add(seg[0], offset);
            const p1 = Vec2.add(seg[1], offset);
            setIntersections([]);

            if (Vec2.dist(p0, p1) < movingWall.thickness) return;

            const p0Conection = connections.find(c => c.index == 0);
            const p1Conection = connections.find(c => c.index == 1);
            const updateStack: [string, Record<string, any>][] = [
                [movingWall.id, { points: [p0, p1] }]
            ];
            if (p0Conection) {
                const origin = p0Conection.point;
                p0Conection.connections.forEach(connection => {
                    const segment = connection.wall.points;
                    updateStack.push([
                        connection.wall.id,
                        {
                            points: segment.map((point, i) => i == connection.index ? p0 : point) as LineSegment
                        }
                    ]);
                });

            }
            if (p1Conection) {
                const origin = p1Conection.point;
                p1Conection.connections.forEach(connection => {
                    const segment = connection.wall.points;
                    updateStack.push([
                        connection.wall.id,
                        {
                            points: segment.map((point, i) => i == connection.index ? p1 : point) as LineSegment
                        }
                    ]);
                });
            }


            const ids = updateStack.map(d => d[0]);
            const patchs = updateStack.map(d => d[1]);
            updateWalls(ids, patchs);
        } else {
            const nearest = findNearestId(world);
            setHoveredId(nearest);
            if (nearest) {
                e.preventDefault();
            }
        }

    }, [movingWall, walls, clientToWorldPoint, updateWalls, findNearestId]);


    return (
        <>
            {walls.map((wall) => {
                const isLineHover = wall.id == hoveredId;
                const points = cuttedLines.find(cl => cl.id == wall.id)?.segment;
                return points && (
                    <line
                        key={wall.id}
                        x1={points[0].x}
                        y1={points[0].y}
                        x2={points[1].x}
                        y2={points[1].y}
                        stroke={isMoving ? "orange" : isLineHover ? 'green' : '#888'}
                        strokeWidth={!isMoving && isLineHover ? 12 : 8}
                        strokeLinecap={"square"}
                        strokeMiterlimit={5}
                        strokeLinejoin={"bevel"}
                        style={{
                            transition: !isMoving ? 'all 0.2s ease' : 'none',
                            opacity: (isLineHover && !isMoving) || movingId == wall.id ? 1 : 0
                        }} />
                )
            })}


            {intersections.map((wall) => {
                return (
                    <line
                        key={wall.id}
                        x1={wall.points[0].x}
                        y1={wall.points[0].y}
                        x2={wall.points[1].x}
                        y2={wall.points[1].y}
                        stroke={'red'}
                        strokeWidth={4}
                        strokeLinecap={"square"}
                        strokeMiterlimit={5}
                        strokeLinejoin={"bevel"} />
                )
            })}


        </>
    );
} 