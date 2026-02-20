// utils/line.ts
// --------------------------------------------------
// Railway line utilities
// - Centripetal Catmull–Rom interpolation
// - Exact point interpolation (TIPLOC-safe)
// - Distance-based positioning
// - Geometry grouped by TIPLOC just passed
// --------------------------------------------------

import type { ServiceLocationWithCoords, ServiceLocationWithGeometry } from '$lib/types';

/* ---------- Types ---------- */

export type Point = {
	x: number; // projected longitude / x
	y: number; // projected latitude / y
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

/**
 * Linear interpolation
 */
export function lerp(a: Point, b: Point, t: number): Point {
	return {
		x: a.x + (b.x - a.x) * t,
		y: a.y + (b.y - a.y) * t
	};
}

/**
 * Centripetal parameterisation
 * (prevents overshoot with uneven spacing)
 */
function tj(ti: number, pi: Point, pj: Point): number {
	const dx = pj.x - pi.x;
	const dy = pj.y - pi.y;
	return ti + Math.sqrt(Math.sqrt(dx * dx + dy * dy));
}

/* ---------- Catmull–Rom spline ---------- */

/**
 * Generate interpolated points between p1 → p2
 * p0 and p3 are context points
 */
function catmullRomSegment(p0: Point, p1: Point, p2: Point, p3: Point, samples: number): Point[] {
	const t0 = 0;
	const t1 = tj(t0, p0, p1);
	const t2 = tj(t1, p1, p2);
	const t3 = tj(t2, p2, p3);

	const points: Point[] = [];

	for (let i = 0; i < samples; i++) {
		const alpha = (i + 0.5) / samples; // < 1
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

/* ---------- Flat smooth path ---------- */

/**
 * Create a smooth interpolating path
 * Passes through every input point exactly
 */
export function smoothPath(points: Point[], samplesPerSegment = 20): Point[] {
	if (points.length < 2) return points;

	const result: Point[] = [];

	for (let i = 0; i < points.length - 1; i++) {
		const p0 = i === 0 ? points[0] : points[i - 1];
		const p1 = points[i];
		const p2 = points[i + 1];
		const p3 = i + 2 >= points.length ? points[points.length - 1] : points[i + 2];

		const segment = catmullRomSegment(p0, p1, p2, p3, samplesPerSegment);

		result.push(...segment);
	}

	// Ensure last point is exact
	result.push(points[points.length - 1]);
	return result;
}

/* ---------- Distance utilities ---------- */

/**
 * Compute cumulative distances along a path
 */
export function cumulativeDistances(path: Point[]): number[] {
	const distances: number[] = [0];

	for (let i = 1; i < path.length; i++) {
		const dx = path[i].x - path[i - 1].x;
		const dy = path[i].y - path[i - 1].y;
		distances.push(distances[i - 1] + Math.hypot(dx, dy));
	}

	return distances;
}

/**
 * Interpolate a point at a given distance along a path
 */
export function pointAtDistance(path: Point[], distances: number[], target: number): Point {
	if (path.length === 0) {
		throw new Error('Empty path');
	}

	if (target <= 0) return path[0];
	if (target >= distances[distances.length - 1]) {
		return path[path.length - 1];
	}

	for (let i = 1; i < distances.length; i++) {
		if (distances[i] >= target) {
			const t = (target - distances[i - 1]) / (distances[i] - distances[i - 1]);

			return lerp(path[i - 1], path[i], t);
		}
	}

	return path[path.length - 1];
}

/* ---------- TIPLOC-grouped geometry ---------- */

/**
 * Smooth a TIPLOC path and group geometry by
 * the TIPLOC that has just been passed
 */
export function smoothPathByTiploc(
	points: ServiceLocationWithCoords[],
	samplesPerSegment = 20
): ServiceLocationWithGeometry[] {
	if (points.length < 2) return [];

	const result: ServiceLocationWithGeometry[] = [];

	for (let i = 0; i < points.length - 1; i++) {
		const p1 = points[i];
		const p2 = points[i + 1];

		// Phantom points for endpoints
		const p0 =
			i === 0
				? [
						p1.coords[0] + (p1.coords[0] - p2.coords[0]),
						p1.coords[1] + (p1.coords[1] - p2.coords[1])
					] // mirror
				: points[i - 1].coords;

		const p3 =
			i + 2 >= points.length
				? [
						p2.coords[0] + (p2.coords[0] - p1.coords[0]),
						p2.coords[1] + (p2.coords[1] - p1.coords[1])
					] // mirror
				: points[i + 2].coords;

		const segment = catmullRomSegment(
			{ x: p0[0], y: p0[1] },
			{ x: p1.coords[0], y: p1.coords[1] },
			{ x: p2.coords[0], y: p2.coords[1] },
			{ x: p3[0], y: p3[1] },
			samplesPerSegment
		);

		// Ensure the segment starts exactly at the TIPLOC
		segment.unshift({ x: p1.coords[0], y: p1.coords[1] });

		result.push({
			...p1,
			geometry: segment.map((p) => [p.x, p.y])
		});
	}

	return result;
}
