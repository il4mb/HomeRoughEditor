import { useEngine } from '@/hooks/useEngine';
import { ReactNode } from 'react';
import { HandGrab, SplinePointer } from "lucide-react";
import ActionButton from './ActionButton';

export interface SidebarProps {
    children?: ReactNode;
}
export default function Sidebar({ children }: SidebarProps) {
    const { mode, setMode } = useEngine();
    return (
        <div className='floorplan-sidebar'>
            <ActionButton active={mode == "wall"} onClick={() => setMode("wall")}>
                <SplinePointer size={16} />
            </ActionButton>
            <ActionButton active={mode == "pan"} onClick={() => setMode("pan")}>
                <HandGrab size={16} />
            </ActionButton>
        </div>
    );
}