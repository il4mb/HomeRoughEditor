// import { Point, Wall } from "@/types";
// import Vec2 from "./vec2d";

// // Geometry helpers (keep your existing ones)
// const sub = (a: Point, b: Point) => ({ x: a.x - b.x, y: a.y - b.y });
// const add = (a: Point, b: Point) => ({ x: a.x + b.x, y: a.y + b.y });
// const mul = (a: Point, s: number) => ({ x: a.x * s, y: a.y * s });
// const len = (a: Point) => Math.hypot(a.x, a.y);
// const normalize = (a: Point) => {
//     const L = len(a) || 1;
//     return { x: a.x / L, y: a.y / L };
// };
// const perp = (a: Point) => ({ x: -a.y, y: a.x });
// const dot = (a: Point, b: Point) => a.x * b.x + a.y * b.y;
// const cross = (v: Point, w: Point) => v.x * w.y - v.y * w.x;
// export const angle = (a: Point, b: Point) => Math.atan2(b.y - a.y, b.x - a.x);

// export function angleBetweenLines(lineA: Point[], lineB: Point[]) {
//     // pastikan masing-masing minimal 2 titik
//     if (lineA.length < 2 || lineB.length < 2) return 0;

//     const [a1, a2] = lineA;
//     const [b1, b2] = lineB;

//     const Ax = a2!.x - a1!.x;
//     const Ay = a2!.y - a1!.y;
//     const Bx = b2!.x - b1!.x;
//     const By = b2!.y - b1!.y;

//     const cross = Ax * By - Ay * Bx;
//     const dot = Ax * Bx + Ay * By;

//     return Math.atan2(cross, dot);
// }


// export function reorderPolygon(points: { x: number; y: number }[]) {
//     // cari pusat polygon
//     const cx = points.reduce((s, p) => s + p.x, 0) / points.length;
//     const cy = points.reduce((s, p) => s + p.y, 0) / points.length;

//     return [...points].sort((a, b) => {
//         const angleA = Math.atan2(a.y - cy, a.x - cx);
//         const angleB = Math.atan2(b.y - cy, b.x - cx);
//         return angleA - angleB; // clockwise
//     });
// }


// // Improved line intersection with bounds checking
// export function lineIntersect(p1: Point, d1: Point, p2: Point, d2: Point): Point | null {
//     const denom = cross(d1, d2);
//     if (Math.abs(denom) < 1e-9) return null;

//     const t = cross(sub(p2, p1), d2) / denom;
//     return add(p1, mul(d1, t));
// }


// // Asumsikan Anda sudah memiliki fungsi helper dari jawaban sebelumnya:
// // - Vec2 (utilitas vektor)
// // - computeMiterCorners (logika interseksi)
// // - findConnectedWalls (mencari neighbor)

// export function createWallPolygon(wall: Wall, allWalls: Wall[]): Point[] {
//     if (!wall.points || wall.points.length < 2) return [];

//     const halfThick = wall.thickness / 2;
//     const pStart = wall.points[0];
//     const pEnd = wall.points[1];

//     // 1. Cari neighbors
//     const startNeighbors = findConnectedWalls(pStart, allWalls, wall);
//     const endNeighbors = findConnectedWalls(pEnd, allWalls, wall);

//     // 2. Hitung sudut-sudut miter menggunakan logika interseksi garis
//     // Arah P1 -> P2
//     const dirStart = Vec2.normalize(Vec2.sub(pEnd, pStart));
//     const { left: sl, right: sr } = computeMiterCorners(pStart, dirStart, halfThick, startNeighbors);

//     // Arah P2 -> P1 (dibalik untuk perhitungan ujung)
//     const dirEnd = Vec2.normalize(Vec2.sub(pStart, pEnd));
//     const { left: el, right: er } = computeMiterCorners(pEnd, dirEnd, halfThick, endNeighbors);

//     // 3. Susun Poligon dengan Solusi "Center Pivot Injection"
//     const polygon: Point[] = [];

//     // --- Sisi Start ---
//     polygon.push(sl); // Start Left Corner

//     // --- Menuju Sisi End ---
//     polygon.push(el); // End Left Corner

//     // PERBAIKAN DISINI: Cek apakah ini sambungan 3 arah atau lebih?
//     // Jika neighbors >= 2, berarti total ada 3 dinding (diri sendiri + 2 neighbor).
//     if (endNeighbors.length >= 2) {
//         // Masukkan titik pivot pusat agar tidak ada lubang
//         polygon.push(pEnd);
//     }

//     polygon.push(er); // End Right Corner

//     // --- Kembali ke Sisi Start ---
//     polygon.push(sr); // Start Right Corner

//     // PERBAIKAN DISINI JUGA: Cek untuk sisi Start
//     if (startNeighbors.length >= 2) {
//         // Masukkan titik pivot pusat
//         polygon.push(pStart);
//     }

//     // (Poligon akan otomatis tertutup kembali ke titik pertama 'sl' saat dirender)

//     return reorderPolygon(polygon);
// }

// function findConnectedWalls(point: Point, allWalls: Wall[], excludeWall: Wall): Wall[] {
//     return allWalls.filter(w =>
//         w !== excludeWall &&
//         (Vec2.equal(w.points[0], point) || Vec2.equal(w.points[1], point))
//     );
// }





// interface CornerResult {
//     left: Point;
//     right: Point;
// }

// function computeMiterCorners(
//     pivot: Point,
//     myDir: Point,
//     halfThick: number,
//     neighbors: Wall[]
// ): CornerResult {

//     const myNormal = Vec2.perp(myDir);
//     const defaultLeft = Vec2.add(pivot, Vec2.mul(myNormal, halfThick));
//     const defaultRight = Vec2.add(pivot, Vec2.mul(myNormal, -halfThick));

//     if (neighbors.length === 0) {
//         return { left: defaultLeft, right: defaultRight };
//     }

//     // 1. Siapkan data sorting
//     // Kita perlu arah keluar (outward direction) untuk setiap neighbor relatif terhadap pivot
//     const neighborsData = neighbors.map(n => {
//         const isP1 = Vec2.equal(n.points[0], pivot);
//         const pOther = isP1 ? n.points[1] : n.points[0];
//         const dir = Vec2.normalize(Vec2.sub(pOther, pivot));
//         return {
//             wall: n,
//             dir: dir,
//             angle: Math.atan2(dir.y, dir.x),
//             halfThick: n.thickness / 2
//         };
//     });

//     // Masukkan dinding kita sendiri ke dalam list untuk sorting
//     const myAngle = Math.atan2(myDir.y, myDir.x);
//     const myData = { wall: null, dir: myDir, angle: myAngle, halfThick }; // wall null = self

//     const allSegments = [...neighborsData, myData];

//     // 2. Sortir CCW (Counter-Clockwise) berdasarkan sudut (-PI s/d PI)
//     allSegments.sort((a, b) => a.angle - b.angle);

//     // 3. Cari posisi dinding kita di array yang sudah disortir
//     const myIndex = allSegments.indexOf(myData);
//     const count = allSegments.length;

//     // 4. Cari Neighbor Sebelumnya (Right Side Connection) dan Berikutnya (Left Side Connection)
//     // Menggunakan modulus agar array bersifat sirkular
//     const nextSeg = allSegments[(myIndex + 1) % count]!;
//     const prevSeg = allSegments[(myIndex - 1 + count) % count]!;

//     // 5. Hitung Interseksi
//     // --- Sisi Kiri (Left) ---
//     // Sisi Kiri dinding KITA bertemu dengan Sisi Kanan dinding NEXT (karena arahnya keluar pusat)
//     const leftIntersection = computeIntersection(
//         pivot, myData.dir, myData.halfThick, // Garis Kita (offset +)
//         nextSeg.dir, nextSeg.halfThick * -1  // Garis Next (offset -, sisi kanannya dia)
//     );

//     // --- Sisi Kanan (Right) ---
//     // Sisi Kanan dinding KITA bertemu dengan Sisi Kiri dinding PREV
//     const rightIntersection = computeIntersection(
//         pivot, myData.dir, -myData.halfThick, // Garis Kita (offset -)
//         prevSeg.dir, prevSeg.halfThick        // Garis Prev (offset +, sisi kirinya dia)
//     );

//     // Gunakan hasil interseksi, atau fallback ke default jika gagal (parallel)
//     return {
//         left: leftIntersection || defaultLeft,
//         right: rightIntersection || defaultRight
//     };
// }

// /**
//  * Menghitung titik potong dua garis tepi yang digeser (offset)
//  * Line A: pivot + offsetA * normalA + t * dirA
//  * Line B: pivot + offsetB * normalB + u * dirB
//  */
// function computeIntersection(pivot: Point, dirA: Point, offsetA: number, dirB: Point, offsetB: number): Point | null {

//     // Normal vectors
//     const normA = Vec2.perp(dirA);
//     const normB = Vec2.perp(dirB);

//     // Titik awal garis tepi (secara virtual)
//     const startA = Vec2.add(pivot, Vec2.mul(normA, offsetA));
//     const startB = Vec2.add(pivot, Vec2.mul(normB, offsetB));

//     // Menggunakan rumus determinan untuk interseksi garis
//     // Persamaan: startA + t * dirA = startB + u * dirB
//     // t * dirA - u * dirB = startB - startA

//     const det = dirA.x * dirB.y - dirA.y * dirB.x;

//     // Jika determinan ~0, garis sejajar (collinear), tidak ada titik potong unik
//     if (Math.abs(det) < 1e-5) return null;

//     const diff = Vec2.sub(startB, startA);
//     const t = (diff.x * dirB.y - diff.y * dirB.x) / det;

//     // Miter Limit Check (PENTING untuk profesional look)
//     // Jika sudut terlalu tajam, titik potong bisa sangat jauh (spike).
//     // Kita batasi, misalnya max 3x ketebalan.
//     const limit = Math.abs(offsetA) * 5;
//     if (Math.abs(t) > limit) return null; // Atau fallback ke bevel logic di sini

//     return Vec2.add(startA, Vec2.mul(dirA, t));
// }


// const EPSILON = 1e-10;

// export const getLineIntersection = (a1: Point, a2: Point, b1: Point, b2: Point): Point | null => {
//     const denominator = (b2.y - b1.y) * (a2.x - a1.x) - (b2.x - b1.x) * (a2.y - a1.y);
//     if (Math.abs(denominator) < EPSILON) return null;
//     const ua = ((b2.x - b1.x) * (a1.y - b1.y) - (b2.y - b1.y) * (a1.x - b1.x)) / denominator;
//     const ub = ((a2.x - a1.x) * (a1.y - b1.y) - (a2.y - a1.y) * (a1.x - b1.x)) / denominator;
//     if (ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1) {
//         return {
//             x: a1.x + ua * (a2.x - a1.x),
//             y: a1.y + ua * (a2.y - a1.y)
//         };
//     }
//     return null;
// };