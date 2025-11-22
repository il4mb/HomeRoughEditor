import { Point } from "@/types";

/**
 * Utilitas Vektor 2D Sederhana untuk operasi geometri
 */
const Vec2 = {
    add: (a: Point, b: Point) => ({ x: a.x + b.x, y: a.y + b.y }),
    sub: (a: Point, b: Point) => ({ x: a.x - b.x, y: a.y - b.y }),
    mul: (a: Point, s: number) => ({ x: a.x * s, y: a.y * s }),
    // Dot product
    dot: (a: Point, b: Point) => a.x * b.x + a.y * b.y,
    // Cross product (2D z-component) - berguna untuk menentukan arah belokan
    cross: (a: Point, b: Point) => a.x * b.y - a.y * b.x,
    // Magnitude squared (lebih cepat dari length biasa)
    magSq: (a: Point) => a.x * a.x + a.y * a.y,
    normalize: (a: Point) => {
        const len = Math.hypot(a.x, a.y);
        return len === 0 ? { x: 0, y: 0 } : { x: a.x / len, y: a.y / len };
    },
    // Rotasi 90 derajat searah jarum jam (tergantung sistem koordinat, sesuaikan jika terbalik)
    perp: (a: Point) => ({ x: -a.y, y: a.x }),
    dist: (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y),
    equal: (a: Point, b: Point, tolerance = 0.01) => Math.abs(a.x - b.x) < tolerance && Math.abs(a.y - b.y) < tolerance
};

export default Vec2;