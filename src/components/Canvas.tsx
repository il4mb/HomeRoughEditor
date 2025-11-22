import { Callback, CanvasContext, CanvasState, EventListeners, EventName, Unsubscribe } from '@/hooks/useCanvas';
import { useEngine } from '@/hooks/useEngine';
import { Point, Rect } from '@/types';
import { MouseEvent, ReactNode, useCallback, useEffect, useMemo, useRef, useState, WheelEvent } from 'react';
import FixedGridCanvas from './FixedGridCanvas';
import Walls from './walls/Walls';
import GridPoints from './grids/GridPoints';

export interface canvasProps {
    children?: ReactNode;
}
export default function Canvas({ }: canvasProps) {

    const [listeners,] = useState<EventListeners>(new Map());
    const { gridSize, view, updateView } = useEngine();
    const svgRef = useRef<SVGSVGElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isInitialized, setIsInitialized] = useState(false);
    const [rect, setRect] = useState<Rect>({ width: 0, height: 0, x: 0, y: 0 });
    const viewBox = useMemo(() => `0 0 ${rect.width} ${rect.height}`, [rect]);

    const invokeListeners = useCallback((event: EventName, e: MouseEvent) => {
        listeners.get(event)?.forEach((callback) => {
            try {
                callback(e as any);
            } catch (e) {
                console.error(e);
            }
        });
    }, [listeners]);

    const addListener = useCallback((event: EventName, callback: Callback): Unsubscribe => {
        let eventMap = listeners.get(event);
        if (!eventMap) {
            eventMap = new Map();
            listeners.set(event, eventMap);
        }

        const id = crypto.randomUUID();
        eventMap.set(id, callback);

        return () => {
            eventMap?.delete(id);
        };
    }, [listeners]);

    const clientToWorldPoint = useCallback(({ x, y }: Point): Point => {
        const svg = svgRef.current;
        if (!svg) return { x: 0, y: 0 };

        const rect = svg.getBoundingClientRect();
        const screenX = x - rect.left;
        const screenY = y - rect.top;

        const worldX = (screenX / view.zoom) + view.x;
        const worldY = (screenY / view.zoom) + view.y;

        return { x: worldX, y: worldY };
    }, [view.zoom, view.x, view.y]);

    const worldToScreenPoint = useCallback(({ x, y }: Point): Point => {
        const screenX = (x - view.x) * view.zoom;
        const screenY = (y - view.y) * view.zoom;
        return { x: screenX, y: screenY };
    }, [view.zoom, view.x, view.y]);

    const handleContextMenu = (e: MouseEvent) => {
        e.preventDefault();
        invokeListeners("contextmenu", e);
    }

    const handleMouseDown = useCallback((e: MouseEvent) => {
        invokeListeners("mousedown", e);
        if (e.isDefaultPrevented()) return;
    }, [clientToWorldPoint, invokeListeners]);


    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        invokeListeners("mousemove", e);
        if (e.isDefaultPrevented()) return;
    }, [clientToWorldPoint, invokeListeners]);

    // Then use it in handleMouseUp:
    const handleMouseUp = useCallback((e: MouseEvent) => {
        invokeListeners("mouseup", e);
        if (e.isDefaultPrevented()) return;
    }, [clientToWorldPoint, invokeListeners]);

    const handleMouseLeave = useCallback((e: MouseEvent) => {
        invokeListeners("mouseleave", e);
        if (e.isDefaultPrevented()) return;
    }, [clientToWorldPoint, invokeListeners]);

    const handleMouseEnter = useCallback((e: MouseEvent) => {
        invokeListeners("mouseenter", e);
        if (e.isDefaultPrevented()) return;
    }, [clientToWorldPoint, invokeListeners]);

    const handleWheel = useCallback((e: WheelEvent) => {
        invokeListeners("wheel", e);
        if (e.isDefaultPrevented()) return;
        e.preventDefault();

        const rect = svgRef.current!.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const zoomIntensity = 0.001;
        const delta = -e.deltaY * zoomIntensity;
        const newZoom = Math.max(0.1, Math.min(10, view.zoom + delta));

        // Get mouse position in world coordinates before zoom
        const mouseWorldPos = clientToWorldPoint({ x: e.clientX, y: e.clientY });

        // Calculate new view position to zoom to mouse pointer
        const newX = mouseWorldPos.x - (mouseX / newZoom);
        const newY = mouseWorldPos.y - (mouseY / newZoom);
        updateView({
            zoom: newZoom,
            x: newX,
            y: newY
        });
    }, [clientToWorldPoint, invokeListeners]);

    useEffect(() => {
        if (rect.width > 0 && rect.height > 0 && !isInitialized) {
            const centerX = -rect.width / (2 * view.zoom);
            const centerY = -rect.height / (2 * view.zoom);
            updateView({
                x: centerX,
                y: centerY
            });
            setIsInitialized(true);
        }
    }, [rect, view.zoom, isInitialized]);

    useEffect(() => {
        if (!containerRef.current) return;
        const updateRect = (container: HTMLElement) => {
            const rect = container.getBoundingClientRect()
            setRect(rect);
        }
        const observer = new ResizeObserver(() => {
            if (!containerRef.current) return;
            updateRect(containerRef.current);
        });
        updateRect(containerRef.current);
        observer.observe(containerRef.current);

        return () => {
            observer.disconnect();
        }
    }, [containerRef]);


    const value = useMemo<CanvasState>(() => ({
        rect,
        clientToWorldPoint,
        worldToScreenPoint,
        addListener
    }), [rect, clientToWorldPoint, worldToScreenPoint, addListener]);

    return (
        <CanvasContext.Provider value={value}>
            <div ref={containerRef} className='floorplan-canvas'>
                <FixedGridCanvas
                    width={rect.width}
                    height={rect.height}
                    zoom={view.zoom}
                    gridSize={gridSize}
                    viewOffset={view} />
                <svg ref={svgRef}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseLeave}
                    onMouseEnter={handleMouseEnter}
                    onContextMenu={handleContextMenu}
                    onWheel={handleWheel}
                    width={'100%'}
                    height={'100%'}
                    viewBox={viewBox} 
                    xmlns="http://www.w3.org/2000/svg">
                    <g transform={`translate(${-view.x * view.zoom}, ${-view.y * view.zoom}) scale(${view.zoom})`}>
                        <circle cx={0} cy={0} r={4} fill='orange' />
                        <GridPoints />
                        <Walls />
                    </g>

                    {/* Debug info */}
                    <text x="10" y="20" fill="#888" fontSize="12" fontFamily="monospace">
                        Zoom: {view.zoom.toFixed(2)} | View: ({view.x.toFixed(1)}, {view.y.toFixed(1)})
                    </text>

                    <text x="10" y="50" fill="#10b981" fontSize="12" fontFamily="monospace">
                        Center: (0,0) is at center of canvas
                    </text>
                </svg>
            </div>
        </CanvasContext.Provider>
    );
}