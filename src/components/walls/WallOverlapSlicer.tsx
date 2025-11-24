import { Wall } from '@/types';
import WallUtils from '@/utils/wallUtils';
import { useMemo } from 'react';

export interface WallOverlapSlicerProps {
    walls: Wall[];
}
export default function WallOverlapSlicer({ walls }: WallOverlapSlicerProps) {


    const overlaps = useMemo(() => {
        const overlaps = WallUtils.findAllOverlaps(walls);
        console.log(overlaps);
    }, [walls]);

    return (
        <>

        </>
    );
}