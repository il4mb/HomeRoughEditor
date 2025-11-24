import { PortalContext } from '@/hooks/usePortal';
import { nanoid } from 'nanoid';
import {
    ReactNode,
    useCallback,
    useRef,
    useState,
    useMemo,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface PortalProviderProps {
    children?: ReactNode;
}

export default function CanvasPortal({ children }: PortalProviderProps) {
    // Use state to make the map reactive
    const [portalsMap, setPortalsMap] = useState(new Map<string, () => ReactNode>());
    const triggersRef = useRef<Map<string, () => void>>(new Map());

    const updateRerender = useCallback((id: string) => {
        triggersRef.current.get(id)?.();
    }, []);

    const createPortal = useCallback((render: () => ReactNode) => {
        const id = nanoid();
        setPortalsMap(prev => {
            const newMap = new Map(prev);
            newMap.set(id, render);
            return newMap;
        });
        return id;
    }, []);

    const updatePortal = useCallback((id: string, render: () => ReactNode) => {
        setPortalsMap(prev => {
            if (!prev.has(id)) return prev;
            const newMap = new Map(prev);
            newMap.set(id, render);
            return newMap;
        });
        updateRerender(id);
        return true;
    }, [updateRerender]);

    const removePortal = useCallback((id: string) => {
        setPortalsMap(prev => {
            const newMap = new Map(prev);
            newMap.delete(id);
            return newMap;
        });
        triggersRef.current.delete(id);
        updateRerender(id);
    }, [updateRerender]);

    const contextValue = useMemo(
        () => ({ createPortal, updatePortal, removePortal }),
        [createPortal, updatePortal, removePortal]
    );

    return (
        <PortalContext.Provider value={contextValue}>
            {children}

            {/* Render area with AnimatePresence for exit animations */}
            <div className="canvas-portal">
                <AnimatePresence mode="popLayout">
                    {Array.from(portalsMap.entries()).map(([id, content]) => (
                        <PortalSlot
                            key={id}
                            id={id}
                            content={content}
                            triggersRef={triggersRef}
                        />
                    ))}
                </AnimatePresence>
            </div>
        </PortalContext.Provider>
    );
}

interface SlotProps {
    id: string;
    content: () => ReactNode;
    triggersRef: React.RefObject<Map<string, () => void>>;
}

function PortalSlot({ id, content, triggersRef }: SlotProps) {
    const [, setTick] = useState(0);

    // Register trigger once
    useMemo(() => {
        if (!triggersRef.current.has(id)) {
            triggersRef.current.set(id, () => setTick(prev => prev + 1));
        }
    }, [id, triggersRef]);

    return (
        <motion.div
            className='portal-slot'
            data-portal={id}
            // Enter animation
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            // Exit animation
            exit={{ opacity: 0, y: -20 }}
            // Transition settings
            transition={{
                type: "spring",
                stiffness: 300,
                damping: 25,
                duration: 0.2
            }}
            layout>
            {content()}
        </motion.div>
    );
}