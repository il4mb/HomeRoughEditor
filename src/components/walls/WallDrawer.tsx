import { useCanvas, useMouseDown, useMouseMove } from '@/hooks/useCanvas';
import { useEditor } from '@/hooks/useEditor';
import { useEngine } from '@/hooks/useEngine';
import { useSnap } from '@/hooks/useSnap';
import { Point } from '@/types';
import { useMemo, useState } from 'react';

export default function WallDrawer() {

    const { scalePixel, setMode } = useEngine();
    const { snapGrid } = useSnap();
    const { clientToWorldPoint } = useCanvas();
    const { addWall } = useEditor();
    const [startPoint, setStartPoint] = useState<Point>();
    const [current, setCurrent] = useState<Point>();

    const points = useMemo(() => {
        if (!startPoint || !current) return;
        return [startPoint, current].map(({ x, y }) => [x, y].join(',')).join(" ");
    }, [startPoint, current]);

    useMouseMove((e) => {
        const world = clientToWorldPoint({ x: e.clientX, y: e.clientY });
        setCurrent(snapGrid(world));
    }, [snapGrid, clientToWorldPoint]);

    useMouseDown((e) => {
        if (e.button == 0) {
            const world = snapGrid(clientToWorldPoint({ x: e.clientX, y: e.clientY }));
            if (!startPoint) {
                setStartPoint(world);
            } else {
                addWall({
                    points: [startPoint, world],
                    thickness: 20
                });
                setStartPoint(world);
            }
        } else {
            setStartPoint(undefined);
            setCurrent(undefined);
            setMode("idle");
        }
    }, [startPoint, clientToWorldPoint, snapGrid]);

    return (
        <>
            {startPoint && (
                <>
                    <circle cx={startPoint.x} cy={startPoint.y} r={scalePixel(5, 3, 150)} fill='green' />
                    {points && (
                        <>
                            <polyline points={points} fill='green' stroke='green' strokeWidth={scalePixel(5)} />
                            <circle cx={current!.x} cy={current!.y} r={scalePixel(5, 3, 150)} fill='green' />
                        </>
                    )}
                </>
            )}
        </>
    );
}