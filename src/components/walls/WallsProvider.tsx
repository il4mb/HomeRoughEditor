import { useEditor } from '@/hooks/useEditor';
import { useMemo } from 'react';
import { useEngine } from '@/hooks/useEngine';
import WallDrawer from './WallDrawer';
import { useWallGeometry, WallsPolygonContext } from '@/hooks/useWalls';
import WallVerticlesManager from './WallVerticlesManager';
import Poly2 from '@/utils/polygon2d';
import WallLinesManager from './WallLinesManager';


export interface WallProps {

}
export default function WallsProvider({ }: WallProps) {

    const { mode } = useEngine();
    const { data } = useEditor();
    const walls = useMemo(() => data.walls, [data.walls]);
    const { wallsPolygon } = useWallGeometry(walls);

    return (
        <WallsPolygonContext.Provider value={{ wallsPolygon }}>
            <g id='walls'>
                {walls.map((wall, i) => (
                    <path
                        key={i}
                        d={Poly2.toPath(wallsPolygon.get(wall.id) || [])}
                        fill='#666'
                        stroke='#999'
                        strokeWidth="0"
                        strokeLinecap="butt"
                        strokeLinejoin="miter"
                        strokeMiterlimit="4"
                        fillRule="nonzero" />
                ))}
            </g>
            <WallLinesManager walls={walls} />
            <WallVerticlesManager walls={walls} />
            {mode == "wall" && (
                <>
                    <WallDrawer />
                </>
            )}
        </WallsPolygonContext.Provider>
    );
}