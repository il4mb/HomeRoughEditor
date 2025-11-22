import { useGrid } from '@/hooks/useGrid';

export interface GridPointsProps {
}
export default function GridPoints({  }: GridPointsProps) {
    const { points } = useGrid();
    return (
        <>
            {/* {points.map(({ x, y }, i) => (
                <circle cx={x} cy={y} r={2} fill='#999' key={i} />
            ))} */}
        </>
    );
}