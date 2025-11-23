import { useCanvas, useMouseDown, useMouseMove, useMouseUp, usePointer } from '@/hooks/useCanvas';
import { useEditor } from '@/hooks/useEditor';
import { useSnap } from '@/hooks/useSnap';
import { Point, Wall } from '@/types';
import Line2, { LineSegment } from '@/utils/line2d';
import Vec2 from '@/utils/vec2d';
import WallUtils from '@/utils/wallUtils';
import { useMemo, useState } from 'react';

interface Connection {
    point: Point;
    index: number;
}
export interface WallLinesManagerProps {
    walls: Wall[];
}
export default function WallLinesManager({ walls }: WallLinesManagerProps) {

    const pointer = usePointer();
    const { snapGrid } = useSnap();
    const { updateWall } = useEditor();
    const { clientToWorldPoint } = useCanvas();
    const [movingId, setMovingId] = useState<string>();
    const hoveredId = useMemo(() => {
        if (!pointer) return;
        let min = Infinity;
        let id: any;
        for (const wall of walls) {
            const distance = Line2.getDistanceToSegment(pointer, wall.points);
            if (distance < min) {
                min = distance;
                id = wall.id;
            }
        }
        if (min < 4) return id;
    }, [pointer, walls]);
    const movingWall = useMemo(() => walls.find(wall => wall.id == movingId), [walls, movingId]);
    const [connections, setConnections] = useState<Connection[]>([]);
    const isMoving = Boolean(movingWall);

    useMouseDown((e) => {
        if (!hoveredId) return;
        e.preventDefault();
        e.currentTarget.style.cursor = "move";
        const wall = walls.find(wall => wall.id == hoveredId);
        if (!wall) return;
        const connections = wall.points.map(
            (point, index) =>
                WallUtils.findConnectedAtPoint(point, walls, wall).length > 0 ? { point, index } : null)
            .filter(e => e != null);
        setConnections(connections);
        setMovingId(hoveredId);
    }, [movingId, hoveredId, walls]);

    useMouseUp((e) => {
        if (!movingId) return;
        setMovingId(undefined);
    }, [movingId]);

    const [intersections, setIntersections] = useState<Wall[]>([]);

    useMouseMove((e) => {
        if (!movingWall) return;
        e.preventDefault();
        e.currentTarget.style.cursor = "move";

        const world = clientToWorldPoint({ x: e.clientX, y: e.clientY });
        const snapped = snapGrid(world);
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

        let intersections: any[] = []
        const p0Conection = connections.find(c => c.index == 0);
        const p1Conection = connections.find(c => c.index == 1);
        if (p0Conection && !Vec2.equal(p0, p0Conection.point)) {
            const origin = p0Conection.point;
            // console.log(p0)
            const overlaps = walls.filter(w => w.id != movingId).map(e => ({
                wall: e,
                segment: Line2.getOverlap(e.points, [origin, p0])
            })).filter((overlap) => {
                if (!overlap.segment) return false;
                return Line2.length(overlap.segment) > Line2.length(overlap.wall.points)
            });
            // console.log(overlaps)
            // ?.forEach(e => {
            //     intersections.push(e)
            // })
            // setIntersections(intersections);
            // console.log(intersections)

            // find p0 to origin exist line
            // console.log("Should inject new Wall at 0")
        }
        if (p1Conection && !Vec2.equal(p1, p1Conection.point)) {
            const origin = p1Conection.point;
            const overlaps = walls.filter(w => w.id != movingId).filter(wall => Line2.getOverlap(wall.points, [origin, p1]));
            if (overlaps.length > 0) {
                console.log("No need new wall");
            } else {
                console.log("Need new wall");
            }
        }
        // setIntersections(intersections);

        updateWall(movingWall.id, { points: [p0, p1] });
    }, [movingWall, walls, clientToWorldPoint, updateWall]);

    return (
        <>
            {walls.map((wall) => {
                const isHover = wall.id == hoveredId;
                return (
                    <line
                        key={wall.id}
                        x1={wall.points[0].x}
                        y1={wall.points[0].y}
                        x2={wall.points[1].x}
                        y2={wall.points[1].y}
                        stroke={isMoving ? "orange" : isHover ? 'green' : '#888'}
                        strokeWidth={!isMoving && isHover ? 8 : 4}
                        strokeLinecap={"square"}
                        strokeMiterlimit={5}
                        strokeLinejoin={"bevel"}
                        style={{
                            transition: !isMoving ? 'all 0.2s ease' : 'none',
                            opacity: (isHover && !isMoving) || movingId == wall.id ? 1 : 0
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