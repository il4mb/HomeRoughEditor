import { Point } from "@/types";
import Vec2 from "./vec2d";
import Line2, { LineSegment } from "./line2d";

export type Polygon = Point[];
export interface CornerResult {
    left: Point;
    right: Point;
}
export interface LinePolyable {
    points: LineSegment;
    thickness: number
}

const Poly2 = {

    computeMiterCorners(pivot: Point, myDir: Point, halfThick: number, neighbors: LinePolyable[]): CornerResult {

        const myNormal = Vec2.perp(myDir);
        const defaultLeft = Vec2.add(pivot, Vec2.mul(myNormal, halfThick));
        const defaultRight = Vec2.add(pivot, Vec2.mul(myNormal, -halfThick));

        if (neighbors.length === 0) {
            return { left: defaultLeft, right: defaultRight };
        }

        // 1. Siapkan data sorting
        // Kita perlu arah keluar (outward direction) untuk setiap neighbor relatif terhadap pivot
        const neighborsData = neighbors.map(n => {
            const isP1 = Vec2.equal(n.points[0], pivot);
            const pOther = isP1 ? n.points[1] : n.points[0];
            const dir = Vec2.normalize(Vec2.sub(pOther, pivot));
            return {
                wall: n,
                dir: dir,
                angle: Math.atan2(dir.y, dir.x),
                halfThick: n.thickness / 2
            };
        });

        // Masukkan dinding kita sendiri ke dalam list untuk sorting
        const myAngle = Math.atan2(myDir.y, myDir.x);
        const myData = { wall: null, dir: myDir, angle: myAngle, halfThick }; // wall null = self

        const allSegments = [...neighborsData, myData];

        // 2. Sortir CCW (Counter-Clockwise) berdasarkan sudut (-PI s/d PI)
        allSegments.sort((a, b) => a.angle - b.angle);

        // 3. Cari posisi dinding kita di array yang sudah disortir
        const myIndex = allSegments.indexOf(myData);
        const count = allSegments.length;

        // 4. Cari Neighbor Sebelumnya (Right Side Connection) dan Berikutnya (Left Side Connection)
        // Menggunakan modulus agar array bersifat sirkular
        const nextSeg = allSegments[(myIndex + 1) % count]!;
        const prevSeg = allSegments[(myIndex - 1 + count) % count]!;

        // 5. Hitung Interseksi
        // --- Sisi Kiri (Left) ---
        // Sisi Kiri dinding KITA bertemu dengan Sisi Kanan dinding NEXT (karena arahnya keluar pusat)
        const leftIntersection = this.computeIntersection(
            pivot, myData.dir, myData.halfThick, // Garis Kita (offset +)
            nextSeg.dir, nextSeg.halfThick * -1  // Garis Next (offset -, sisi kanannya dia)
        );

        // --- Sisi Kanan (Right) ---
        // Sisi Kanan dinding KITA bertemu dengan Sisi Kiri dinding PREV
        const rightIntersection = this.computeIntersection(
            pivot, myData.dir, -myData.halfThick, // Garis Kita (offset -)
            prevSeg.dir, prevSeg.halfThick        // Garis Prev (offset +, sisi kirinya dia)
        );

        // Gunakan hasil interseksi, atau fallback ke default jika gagal (parallel)
        return {
            left: leftIntersection || defaultLeft,
            right: rightIntersection || defaultRight
        };
    },

    computeIntersection(pivot: Point, dirA: Point, offsetA: number, dirB: Point, offsetB: number): Point | null {

        // Normal vectors
        const normA = Vec2.perp(dirA);
        const normB = Vec2.perp(dirB);

        // Titik awal garis tepi (secara virtual)
        const startA = Vec2.add(pivot, Vec2.mul(normA, offsetA));
        const startB = Vec2.add(pivot, Vec2.mul(normB, offsetB));

        // Menggunakan rumus determinan untuk interseksi garis
        // Persamaan: startA + t * dirA = startB + u * dirB
        // t * dirA - u * dirB = startB - startA

        const det = dirA.x * dirB.y - dirA.y * dirB.x;

        // Jika determinan ~0, garis sejajar (collinear), tidak ada titik potong unik
        if (Math.abs(det) < 1e-5) return null;

        const diff = Vec2.sub(startB, startA);
        const t = (diff.x * dirB.y - diff.y * dirB.x) / det;

        // Miter Limit Check (PENTING untuk profesional look)
        // Jika sudut terlalu tajam, titik potong bisa sangat jauh (spike).
        // Kita batasi, misalnya max 3x ketebalan.
        const limit = Math.abs(offsetA) * 5;
        if (Math.abs(t) > limit) return null; // Atau fallback ke bevel logic di sini

        return Vec2.add(startA, Vec2.mul(dirA, t));
    },

    reorders(points: Point[]) {
        const cx = points.reduce((s, p) => s + p.x, 0) / points.length;
        const cy = points.reduce((s, p) => s + p.y, 0) / points.length;

        return [...points].sort((a, b) => {
            const angleA = Math.atan2(a.y - cy, a.x - cx);
            const angleB = Math.atan2(b.y - cy, b.x - cx);
            return angleA - angleB; // clockwise
        });
    },

    /**
     * Remove duplicate points (within tolerance)
     */
    removeDuplicate(points: Point[], tolerance: number = 1e-9): Point[] {
        const unique: Point[] = [];

        for (const point of points) {
            if (!unique.some(p => Vec2.dist(p, point) < tolerance)) {
                unique.push(point);
            }
        }

        return unique;
    },
    
    polygonFromLine(seg: LineSegment, thickness: number) {

        const [start, end] = seg;
        const dir = Vec2.normalize(Vec2.sub(end, start));
        const normal = { x: -dir.y, y: dir.x };

        const halfThickness = thickness / 2;
        const offset = Vec2.mul(normal, halfThickness);

        return [
            Vec2.sub(start, offset),
            Vec2.sub(end, offset),
            Vec2.add(end, offset),
            Vec2.add(start, offset)
        ];
    },


    /**
     * Find all intersection points between two polygons
     */
    findIntersecPoints(polyA: Point[], polyB: Point[]): Point[] {
        const points: Point[] = [];

        for (let i = 0; i < polyA.length; i++) {
            const edgeA = [polyA[i], polyA[(i + 1) % polyA.length]] as LineSegment;

            for (let j = 0; j < polyB.length; j++) {
                const edgeB = [polyB[j], polyB[(j + 1) % polyB.length]] as LineSegment;

                const intersection = Line2.getLineIntersection(edgeA, edgeB);
                if (intersection) {
                    points.push(intersection);
                }
            }
        }

        return this.removeDuplicate(points);
    },


    /**
     * Calculate polygon intersection using Weiler-Atherton algorithm (simplified)
     */
    getIntersec(polyA: Point[], polyB: Point[]): Point[] {
        // Simple implementation - for production use consider robust polygon clipping library
        const intersectionPoints: Point[] = [];

        // Find all intersection points between polygon edges
        for (let i = 0; i < polyA.length; i++) {
            const edgeA = [polyA[i], polyA[(i + 1) % polyA.length]]! as LineSegment;

            for (let j = 0; j < polyB.length; j++) {
                const edgeB = [polyB[j], polyB[(j + 1) % polyB.length]] as LineSegment;

                const intersection = Line2.getLineIntersection(edgeA, edgeB);
                if (intersection) {
                    intersectionPoints.push(intersection);
                }
            }
        }

        // Add points from polyA that are inside polyB
        for (const point of polyA) {
            if (this.isPointInside(point, polyB)) {
                intersectionPoints.push(point);
            }
        }

        // Add points from polyB that are inside polyA
        for (const point of polyB) {
            if (this.isPointInside(point, polyA)) {
                intersectionPoints.push(point);
            }
        }

        // Sort points in clockwise order and remove duplicates
        return this.reorders(this.removeDuplicate(intersectionPoints));
    },


    /**
     * Check if point is inside polygon using ray casting algorithm
     */
    isPointInside(point: Point, polygon: Point[]): boolean {
        let inside = false;
        for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
            const xi = polygon[i]!.x, yi = polygon[i]!.y;
            const xj = polygon[j]!.x, yj = polygon[j]!.y;

            const intersect = ((yi > point.y) !== (yj > point.y)) &&
                (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);
            if (intersect) inside = !inside;
        }
        return inside;
    },


    /**
     * Calculate polygon area using shoelace formula
     */
    calculateArea(polygon: Point[]): number {
        let area = 0;
        const n = polygon.length;

        for (let i = 0; i < n; i++) {
            const j = (i + 1) % n;
            area += polygon[i]!.x * polygon[j]!.y;
            area -= polygon[j]!.x * polygon[i]!.y;
        }

        return Math.abs(area) / 2;
    },

    toPath(points: Point[], closed: boolean = true): string {
        if (!points || points.length === 0) return "";

        // Start dari titik pertama
        let d = `M ${points[0]!.x} ${points[0]!.y}`;

        // Garis ke titik berikutnya
        for (let i = 1; i < points.length; i++) {
            const p = points[i]!;
            d += ` L ${p.x} ${p.y}`;
        }

        if (closed) d += " Z";
        return d;
    },

}

export default Poly2;