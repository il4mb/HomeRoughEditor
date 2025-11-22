export interface Point {
    x: number;
    y: number;
}

export interface Rect extends Point {
    width: number;
    height: number;
}


export interface Engine {
    mode: string;
    view: {
        zoom: number;
        x: number;
        y: number;
    },
    gridSize: number;
    unit: 'meters' | 'feet' | 'pixels';
}

export interface Wall {
    id: string;
    points: [Point, Point],
    thickness: number;
}
export interface Node {
    id: string;
    coordinate: Point;
    rotation: number;
}
export interface PlanData {
    walls: Wall[];
    node: Node[];
}