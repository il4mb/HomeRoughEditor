import { Point } from "@/types";

const EPSILON = 1e-9;

const Vec2 = {

    len(v: Point): number {
        return Math.hypot(v.x, v.y);
    },
    /**
     * Create a new vector (optional helper)
     */
    new(x: number, y: number): Point {
        return { x, y };
    },

    /**
     * Addition: a + b
     */
    add(a: Point, b: Point): Point {
        return { x: a.x + b.x, y: a.y + b.y };
    },

    /**
     * Subtraction: a - b
     */
    sub(a: Point, b: Point): Point {
        return { x: a.x - b.x, y: a.y - b.y };
    },

    /**
     * Multiplication by scalar: a * s
     */
    mul(a: Point, scalar: number): Point {
        return { x: a.x * scalar, y: a.y * scalar };
    },

    /**
     * Division by scalar: a / s
     */
    div(a: Point, scalar: number): Point {
        if (scalar === 0) return { x: 0, y: 0 };
        return { x: a.x / scalar, y: a.y / scalar };
    },

    /**
     * Magnitude (Length)
     * √(x² + y²)
     */
    mag(v: Point): number {
        return Math.sqrt(v.x * v.x + v.y * v.y);
    },

    /**
     * Magnitude Squared
     * x² + y²
     * (Faster than mag() because it avoids Math.sqrt. Use for comparisons)
     */
    magSq(v: Point): number {
        return v.x * v.x + v.y * v.y;
    },

    /**
     * Distance between two points
     */
    dist(a: Point, b: Point): number {
        return Math.sqrt(this.distSq(a, b));
    },

    /**
     * Distance squared between two points
     */
    distSq(a: Point, b: Point): number {
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        return dx * dx + dy * dy;
    },

    /**
     * Dot Product
     * a · b = ax*bx + ay*by
     * (Positive if same direction, 0 if perpendicular, negative if opposite)
     */
    dot(a: Point, b: Point): number {
        return a.x * b.x + a.y * b.y;
    },

    /**
     * 2D Cross Product (Determinant)
     * Returns scalar (z-component of 3D cross product)
     * Useful for checking parallel lines or winding order
     */
    cross(a: Point, b: Point): number {
        return a.x * b.y - a.y * b.x;
    },

    /**
     * Normalize (make length 1)
     */
    normalize(v: Point): Point {
        const m = this.mag(v);
        if (m < EPSILON) return { x: 0, y: 0 };
        return { x: v.x / m, y: v.y / m };
    },

    /**
     * Linear Interpolation
     * Returns a point t% between a and b
     */
    lerp(a: Point, b: Point, t: number): Point {
        return {
            x: a.x + (b.x - a.x) * t,
            y: a.y + (b.y - a.y) * t
        };
    },

    /**
     * Perpendicular vector (rotated 90 degrees)
     * Used for wall thickness calculations
     */
    perp(v: Point): Point {
        return { x: -v.y, y: v.x };
    },

    equal: (a: Point, b: Point, tolerance = 0.01) => Math.abs(a.x - b.x) < tolerance && Math.abs(a.y - b.y) < tolerance,

    nearest(origin: Point, points: Point[]) {
        let min = Infinity;
        let index = -1;

        for (let i = 0; i < points.length; i++) {
            const d = Vec2.dist(origin, points[i]!);
            if (d < min) {
                min = d;
                index = i;
            }
        }

        return {
            index,
            point: points[index]!,
            distance: min
        };
    },

    inRadius(origin: Point, points: Point[], radius: number) {

        const result: { index: number; point: Point; distance: number }[] = [];
        const r2 = radius * radius;

        for (let i = 0; i < points.length; i++) {
            const p = points[i]!;
            const dx = origin.x - p.x;
            const dy = origin.y - p.y;
            const dist2 = dx * dx + dy * dy;

            if (dist2 <= r2) {
                result.push({
                    index: i,
                    point: p,
                    distance: Math.sqrt(dist2),
                });
            }
        }

        return result;
    }
};

export default Vec2;