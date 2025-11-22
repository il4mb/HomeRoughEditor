import { PlanData, Wall } from "@/types";
import { createContext, Dispatch, SetStateAction, useCallback, useContext } from "react";
import { nanoid } from "nanoid";
export type EditorState = {
    data: PlanData;
    setData: Dispatch<SetStateAction<PlanData>>
}

export const EditorContext = createContext<EditorState | undefined>(undefined);

export const useEditor = () => {
    const ctx = useContext(EditorContext);
    if (!ctx) throw new Error("useEditor should call inside EditorProvider");
    const { data, setData } = ctx;

    const addWall = (wall: Omit<Wall, 'id'>) => setData(prev => ({ ...prev, walls: [...prev.walls, { ...wall, id: nanoid() }] }));

    const updateWall = useCallback((id: string, partial: Partial<Wall>) =>
        setData(prev => ({
            ...prev,
            walls: prev.walls.map(w => w.id === id ? { ...w, ...partial } : w)
        })), [])

    const removeWall = useCallback((id: string) =>
        setData(prev => ({
            ...prev,
            walls: prev.walls.filter(w => w.id !== id)
        })), []);

    const addNode = useCallback((node: Node) =>
        setData(prev => ({ ...prev, nodes: [...prev.node, node] })), []);

    const updateNode = useCallback((id: string, partial: Partial<Node>) =>
        setData(prev => ({
            ...prev,
            node: prev.node.map(n => n.id === id ? { ...n, ...partial } : n)
        })), []);

    const removeNode = useCallback((id: string) =>
        setData(prev => ({
            ...prev,
            node: prev.node.filter(n => n.id !== id)
        })), []);

    return {
        data,
        setData,
        addWall,
        updateWall,
        removeWall,
        addNode,
        updateNode,
        removeNode
    };
};
