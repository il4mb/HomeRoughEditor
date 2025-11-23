import { ReactNode, useState, useEffect, useMemo } from 'react';
import { EditorContext } from './hooks/useEditor';
import Canvas from './components/Canvas';
import EngineProvider from './components/EngineProvider';
import "@/styles.scss";
import Sidebar from './components/Sidebar';
import { PlanData, Wall } from './types';

export interface EditorProps {
    children?: ReactNode;
}

const STORAGE_KEY = "floorplan:data";

export default function Editor({ children }: EditorProps) {

    const defaultWalls = useMemo<Wall[]>(() => [{
        points: [{ x: 0, y: 0 }, { x: 100, y: 0 }],
        id: 't-01',
        thickness: 0
    }], [])

    const [data, setData] = useState<PlanData>(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            return saved ? JSON.parse(saved) : { walls: [], node: [] };
        } catch {
            return { walls: [], node: [] };
        }
    });





    // sync to localStorage when data changes
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } catch { }
    }, [data]);

    return (
        <EditorContext.Provider value={{ data, setData }}>
            <EngineProvider>
                <div className='floorplan-editor'>
                    <Sidebar />
                    <Canvas />
                </div>
            </EngineProvider>
        </EditorContext.Provider>
    );
}
