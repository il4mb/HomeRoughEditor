import { useCanvas, useMouseDown, useMouseMove } from '@/hooks/useCanvas';
import { useEditor } from '@/hooks/useEditor';
import { useEngine } from '@/hooks/useEngine';
import { useCreatePortal } from '@/hooks/usePortal';
import { useSnap } from '@/hooks/useSnap';
import { Point } from '@/types';
import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Pencil, Ruler, MousePointer2 } from 'lucide-react';
import Vec2 from '@/utils/vec2d';

export default function WallDrawer() {
    const { scalePixel, setMode } = useEngine();
    const { snapGrid } = useSnap();
    const { clientToWorldPoint } = useCanvas();
    const { addWall } = useEditor();
    const [startPoint, setStartPoint] = useState<Point>();
    const [current, setCurrent] = useState<Point>();

    const isDrawing = Boolean(startPoint);
    const wallLength = useMemo(() => {
        if (!startPoint || !current) return 0;
        return Vec2.dist(startPoint, current);
    }, [startPoint, current]);

    const points = useMemo(() => {
        if (!startPoint || !current) return;
        return [startPoint, current].map(({ x, y }) => [x, y].join(',')).join(" ");
    }, [startPoint, current]);

    // Portal for wall drawing UI
    useCreatePortal(() => (
        <div style={{
            display: "flex",
            alignItems: 'center',
            justifyContent: "space-between",
            gap: 12,
            padding: '8px 16px',
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: 12,
            border: `2px solid ${isDrawing ? '#3b82f6' : '#6b7280'}`,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            minWidth: 280
        }}>
            <div style={{ display: "flex", alignItems: 'center', gap: 8 }}>
                <motion.div
                    animate={{
                        scale: isDrawing ? 1.2 : 1,
                        rotate: isDrawing ? 5 : 0
                    }}
                    transition={{ type: "spring", stiffness: 300 }}
                >
                    <Pencil size={20} color={isDrawing ? '#3b82f6' : '#6b7280'} />
                </motion.div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{
                        fontWeight: 700,
                        fontSize: '14px',
                        color: isDrawing ? '#3b82f6' : '#6b7280',
                        lineHeight: 1.2
                    }}>
                        Wall Drawing
                    </span>
                    <span style={{
                        fontSize: '12px',
                        color: isDrawing ? '#3b82f6' : '#666',
                        opacity: 0.8
                    }}>
                        {isDrawing ? 'Click to place endpoint' : 'Click to start drawing'}
                    </span>
                </div>
            </div>

            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 8px',
                background: isDrawing ? '#3b82f6' : '#6b7280',
                borderRadius: 8,
                color: 'white',
                fontWeight: 700,
                fontSize: '14px',
                minWidth: 24,
                justifyContent: 'center'
            }}>
                <AnimatePresence mode="wait">
                    <motion.div
                        key={isDrawing ? 'drawing' : 'idle'}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                    >
                        {isDrawing ? (
                            <>
                                <Ruler size={14} />
                                {wallLength.toFixed(0)}mm
                            </>
                        ) : (
                            <>
                                <MousePointer2 size={14} />
                                Ready
                            </>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    ), [isDrawing, wallLength]);

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
                    thickness: 20,
                    floor: 0
                });
                setStartPoint(world); // Continue drawing from the last point
            }
        } else {
            // Right click to cancel
            setStartPoint(undefined);
            setCurrent(undefined);
            setMode("idle");
        }
    }, [startPoint, clientToWorldPoint, snapGrid, addWall, setMode]);

    return (
        <>
            <AnimatePresence>
                {startPoint && (
                    <>
                        {/* Start point indicator */}
                        <motion.circle
                            cx={startPoint.x}
                            cy={startPoint.y}
                            r={scalePixel(6, 4, 200)}
                            fill='#3b82f6'
                            stroke='white'
                            strokeWidth={scalePixel(1.5)}
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                            transition={{ type: "spring", stiffness: 400 }}
                        />

                        {/* Drawing guide line */}
                        {points && current && (
                            <>
                                <motion.polyline
                                    points={points}
                                    fill='none'
                                    stroke='#3b82f6'
                                    strokeWidth={scalePixel(4)}
                                    strokeDasharray={scalePixel(8)}
                                    strokeLinecap="round"
                                    initial={{ opacity: 0, pathLength: 0 }}
                                    animate={{ opacity: 0.8, pathLength: 1 }}
                                    exit={{ opacity: 0, pathLength: 0 }}
                                    transition={{ duration: 0.2 }}
                                />

                                {/* Current point indicator */}
                                <motion.circle
                                    cx={current.x}
                                    cy={current.y}
                                    r={scalePixel(5, 3, 150)}
                                    fill='#3b82f6'
                                    stroke='white'
                                    strokeWidth={scalePixel(1.5)}
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    exit={{ scale: 0 }}
                                    transition={{ type: "spring", stiffness: 400 }}
                                />

                                {/* Length measurement text */}
                                {wallLength > 50 && (
                                    <motion.text
                                        x={(startPoint.x + current.x) / 2}
                                        y={(startPoint.y + current.y) / 2 - 10}
                                        textAnchor="middle"
                                        fill="#3b82f6"
                                        fontSize={scalePixel(12)}
                                        fontWeight="600"
                                        initial={{ opacity: 0, y: -5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -5 }}
                                        style={{
                                            pointerEvents: 'none',
                                            userSelect: 'none'
                                        }}
                                    >
                                        {wallLength.toFixed(0)} mm
                                    </motion.text>
                                )}
                            </>
                        )}
                    </>
                )}
            </AnimatePresence>

            {/* Always show current cursor position indicator when not drawing */}
            <AnimatePresence>
                {current && !startPoint && (
                    <motion.circle
                        cx={current.x}
                        cy={current.y}
                        r={scalePixel(3, 2, 100)}
                        fill='#6b7280'
                        stroke='white'
                        strokeWidth={scalePixel(1)}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        transition={{ duration: 0.1 }}
                    />
                )}
            </AnimatePresence>
        </>
    );
}