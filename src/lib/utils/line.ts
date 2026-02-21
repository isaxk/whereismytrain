// utils/line.ts
// --------------------------------------------------
// Railway line utilities
// - Smooth centripetal Catmull–Rom spline
// - Exact TIPLOC interpolation
// - Exclusive TIPLOC segments
// - Distance-based train positioning
// --------------------------------------------------

import type { ServiceLocationWithCoords, ServiceLocationWithGeometry } from '$lib/types';

/* ---------- Types ---------- */

export type Point = {
	x: number; // projected x / lon
	y: number; // projected y / lat
};

export type TiplocPoint = {
	tiploc: string;
	crs: string | null;
	x: number;
	y: number;
};

export type TiplocGeometry = {
	tiploc: string;
	crs: string | null;
	coords: [number, number];
	geometry: [number, number][];
};

/* ---------- Core helpers ---------- */

/** Linear interpolation */
export function lerp(a: Point, b: Point, t: number): Point {
	return {
		x: a.x + (b.x - a.x) * t,
		y: a.y + (b.y - a.y) * t
	};
}

/** Centripetal parameterisation */
function tj(ti: number, pi: Point, pj: Point): number {
	const dx = pj.x - pi.x;
	const dy = pj.y - pi.y;
	return ti + Math.sqrt(Math.sqrt(dx * dx + dy * dy));
}

/* ---------- Catmull–Rom spline ---------- */

function catmullRomSegment(p0: Point, p1: Point, p2: Point, p3: Point, samples: number): Point[] {
	const t0 = 0;
	const t1 = tj(t0, p0, p1);
	const t2 = tj(t1, p1, p2);
	const t3 = tj(t2, p2, p3);

	const points: Point[] = [];

	for (let i = 0; i < samples; i++) {
		const alpha = (i + 0.5) / samples; // stay within [t1, t2)
		const t = t1 + alpha * (t2 - t1);

		const A1 = lerp(p0, p1, (t - t0) / (t1 - t0));
		const A2 = lerp(p1, p2, (t - t1) / (t2 - t1));
		const A3 = lerp(p2, p3, (t - t2) / (t3 - t2));

		const B1 = lerp(A1, A2, (t - t0) / (t2 - t0));
		const B2 = lerp(A2, A3, (t - t1) / (t3 - t1));

		const C = lerp(B1, B2, (t - t1) / (t2 - t1));
		points.push(C);
	}

	return points;
}

/* ---------- Full smooth path ---------- */

/**
 * Generates a single smooth path through all points
 * Handles start/end points via mirrored phantom points
 */
export function smoothPath(points: Point[], samplesPerSegment = 20): Point[] {
	if (points.length < 2) return points;

	const result: Point[] = [];

	for (let i = 0; i < points.length - 1; i++) {
		const p1 = points[i];
		const p2 = points[i + 1];

		const p0 =
			i === 0
				? { x: p1.x + (p1.x - p2.x), y: p1.y + (p1.y - p2.y) } // mirror first
				: points[i - 1];

		const p3 =
			i + 2 >= points.length
				? { x: p2.x + (p2.x - p1.x), y: p2.y + (p2.y - p1.y) } // mirror last
				: points[i + 2];

		const segment = catmullRomSegment(p0, p1, p2, p3, samplesPerSegment);
		result.push(...segment);
	}

	// Ensure first and last points are exact
	result.unshift({ x: points[0].x, y: points[0].y });
	result.push({ x: points[points.length - 1].x, y: points[points.length - 1].y });

	return result;
}

/* ---------- Distance utilities ---------- */

/** Cumulative distance along a path */
export function cumulativeDistances(path: Point[]): number[] {
	const distances: number[] = [0];

	for (let i = 1; i < path.length; i++) {
		const dx = path[i].x - path[i - 1].x;
		const dy = path[i].y - path[i - 1].y;
		distances.push(distances[i - 1] + Math.hypot(dx, dy));
	}

	return distances;
}

function findTIPLOCIndices(fullPath: Point[], tiplocs: ServiceLocationWithCoords[]): number[] {
	const indices: number[] = [];
	let start = 0;

	for (const t of tiplocs) {
		let bestIdx = start;
		let minDist = Infinity;

		for (let i = start; i < fullPath.length; i++) {
			const fp = fullPath[i];
			const d = Math.hypot(fp.x - t.coords[0], fp.y - t.coords[1]);
			if (d < minDist) {
				minDist = d;
				bestIdx = i;
			}
		}

		indices.push(bestIdx);
		start = bestIdx; // ensure strictly increasing
	}

	return indices;
}

/** Interpolate a point at a given distance along a path */
export function pointAtDistance(path: Point[], distances: number[], target: number): Point {
	if (target <= 0) return path[0];
	if (target >= distances.at(-1)!) return path.at(-1)!;

	for (let i = 1; i < distances.length; i++) {
		if (distances[i] >= target) {
			const t = (target - distances[i - 1]) / (distances[i] - distances[i - 1]);
			return lerp(path[i - 1], path[i], t);
		}
	}

	return path.at(-1)!;
}

function projectPointToPath(path: Point[], distances: number[], target: Point): number {
	let bestDist = 0;
	let minSq = Infinity;

	for (let i = 1; i < path.length; i++) {
		const a = path[i - 1];
		const b = path[i];

		const dx = b.x - a.x;
		const dy = b.y - a.y;
		const lenSq = dx * dx + dy * dy;
		if (lenSq === 0) continue;

		const t = ((target.x - a.x) * dx + (target.y - a.y) * dy) / lenSq;

		const clamped = Math.max(0, Math.min(1, t));

		const px = a.x + clamped * dx;
		const py = a.y + clamped * dy;

		const sq = (px - target.x) ** 2 + (py - target.y) ** 2;

		if (sq < minSq) {
			minSq = sq;
			bestDist = distances[i - 1] + Math.hypot(px - a.x, py - a.y);
		}
	}

	return bestDist;
}

/* ---------- TIPLOC-segmented geometry ---------- */

/**
 * Generate TIPLOC segments with **exclusive geometry**
 * Each segment contains only points between this TIPLOC and the next TIPLOC
 */
export function smoothPathByTiploc(
	points: ServiceLocationWithCoords[],
	samplesPerSegment = 20
): ServiceLocationWithGeometry[] {
	if (points.length < 2) return [];

	const basePoints: Point[] = points.map((p) => ({
		x: p.coords[0],
		y: p.coords[1]
	}));

	const fullPath = smoothPath(basePoints, samplesPerSegment);
	const distances = cumulativeDistances(fullPath);

	// Project each TIPLOC onto the path
	const tiplocDistances = points.map((p) =>
		projectPointToPath(fullPath, distances, { x: p.coords[0], y: p.coords[1] })
	);

	const segments: ServiceLocationWithGeometry[] = [];

	for (let i = 0; i < points.length - 1; i++) {
		const startDist = tiplocDistances[i];
		const endDist = tiplocDistances[i + 1];

		// Middle points strictly between A and B
		const middle = fullPath
			.map((p, idx) => ({ p, d: distances[idx] }))
			.filter((pt) => pt.d > startDist && pt.d < endDist)
			.map((pt) => [pt.p.x, pt.p.y] as [number, number]);

		// Exact endpoints
		const startPoint: [number, number] = [points[i].coords[0], points[i].coords[1]];

		const endInterp = pointAtDistance(fullPath, distances, endDist);
		const endPoint: [number, number] = [endInterp.x, endInterp.y];

		segments.push({
			...points[i],
			geometry: [startPoint, ...middle, endPoint]
		});
	}

	return segments;
}
