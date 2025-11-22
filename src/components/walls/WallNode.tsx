import { useCanvas, useMouseMove, useMouseUp } from '@/hooks/useCanvas';
import { useEditor } from '@/hooks/useEditor';
import { useEngine } from '@/hooks/useEngine';
import { useSnap } from '@/hooks/useSnap';
import { createWallPolygon, getLineIntersection } from '@/utils/geometry';
import { Point, Wall as TypeWall } from '@/types';
import { lineIntersect } from '@/utils/geometry';
import { useEffect, useMemo, useState } from 'react';
import Vec2 from '@/utils/vec2d';

export interface WallProps {
    wall: TypeWall;
}
export default function WallNode({ wall }: WallProps) {

    const { scalePixel } = useEngine();
    const { snapGrid } = useSnap();
    const { updateWall, addWall, removeWall, data } = useEditor();
    const { clientToWorldPoint } = useCanvas();
    const [isHovered, setIsHovered] = useState(false);
    const [hoverIndex, setHoverIndex] = useState(-1);
    const [moveIndex, setMoveIndex] = useState(-1);

    const intersections = useMemo(() => {
        if (moveIndex < 0) return [];
        const walls = data.walls.filter(other => other.id !== wall.id);
        return walls.map(other => {
            return {
                point: getLineIntersection(
                    wall.points[0],
                    wall.points[1],
                    other.points[0],
                    other.points[1]
                ),
                wall: other
            }
        }).filter(intersec => {

            if (!intersec.point) return false;
            return true;//Vec2.dist(intersec.point, wall.points[moveIndex]!) > intersec.wall.thickness / 2;
        });
    }, [wall.points, moveIndex]);

    const neighbors = useMemo(() => {
        return data.walls.filter(other => {
            if (other.id === wall.id) return false;
            return other.points.some(op =>
                wall.points.some(p => p.x === op.x && p.y === op.y)
            );
        });
    }, [data.walls, wall]);

    const polygon = useMemo(() => {
        return createWallPolygon(wall, neighbors);
    }, [wall, neighbors]);

    const pointsPath = useMemo(() => {
        return wall.points.map(e => [e.x, e.y].join(",")).join(" ");
    }, [wall.points]);

    const mouseDown = (index: number) => () => {
        setMoveIndex(index);
    }

    useMouseUp(() => {
        setMoveIndex(-1);
        // const points = wall.points;
        // let pairs: Point[][] = [];
        // intersections.forEach(intersec => {
        //     for (let point of points) {
        //         const dist = Vec2.dist(intersec.point!, point);
        //         if (dist > intersec.wall.thickness / 2) {
        //             pairs.push([point, intersec.point!]);
        //         }
        //     }
        // });

        // if (pairs.length > 1) {
        //     pairs.map(points => {
        //         addWall({ points: points as any, thickness: wall.thickness })
        //     });
        //     removeWall(wall.id);
        // } else if (pairs.length == 1) {
        //     updateWall(wall.id, { points: pairs[0] as any });
        // }
    }, [intersections, wall.points]);

    useMouseMove((e) => {
        if (moveIndex < 0) return;
        const world = clientToWorldPoint({ x: e.clientX, y: e.clientY });

        const points = wall.points.map((point, i) => i == moveIndex ? snapGrid(world) : point) as TypeWall['points'];
        updateWall(wall.id, { points });
    }, [moveIndex, wall.id, wall.points, clientToWorldPoint, updateWall, snapGrid]);

    return (
        <g onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}>
            <path
                d={`M ${polygon.map(p => `${p.x} ${p.y}`).join(' L ')} Z`}
                fill='#666'
                stroke='#999'
                strokeWidth="0"
                strokeLinecap="butt"
                strokeLinejoin="miter"
                strokeMiterlimit="4"
                fillRule="nonzero"

            />

            {isHovered && moveIndex == -1 && (
                <polyline
                    points={pointsPath}
                    stroke='green'
                    strokeWidth={scalePixel(8)}
                    strokeLinejoin={"round"}
                    strokeLinecap={"round"} />
            )}
            {wall.points.map((point, index) => (
                <g key={index} onMouseEnter={() => setHoverIndex(index)}
                    onMouseLeave={() => setHoverIndex(-1)}>
                    <circle
                        onMouseDown={mouseDown(index)}
                        key={index}
                        cx={point.x}
                        cy={point.y}
                        r={scalePixel(5, 3, 150) + (hoverIndex == index || moveIndex == index ? scalePixel(2) : 0)}
                        fill='green'
                        style={{
                            transition: moveIndex < 0 ? 'all .2s ease' : 'none',
                            opacity: hoverIndex == index || moveIndex == index ? 1 : 0
                        }} />
                </g>
            ))}

            {intersections.map((intersection, index) => (
                <circle
                    key={index}
                    cx={intersection.point!.x}
                    cy={intersection.point!.y}
                    r={scalePixel(5, 3, 150)}
                    fill='green' />
            ))}
        </g>
    );
}