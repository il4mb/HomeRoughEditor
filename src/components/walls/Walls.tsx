import { useEditor } from '@/hooks/useEditor';
import { useMemo } from 'react';
import WallNode from './WallNode';
import { useEngine } from '@/hooks/useEngine';
import WallDrawer from './WallDrawer';

export interface WallProps {

}
export default function Walls({ }: WallProps) {

    const { mode } = useEngine();
    const { data } = useEditor();
    const walls = useMemo(() => data.walls, [data.walls]);

    return (
        <>
            {walls.map((wall, i) => <WallNode wall={wall} key={i} />)}
            {mode == "wall" && (
                <WallDrawer />
            )}
        </>
    );
}