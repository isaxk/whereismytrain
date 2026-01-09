import bbox from '@turf/bbox';
import type { Feature } from 'geojson';
import type { LngLatBoundsLike, LngLatLike } from 'maplibre-gl';

export function getBbox(feature: Feature): LngLatBoundsLike | undefined {
	const bboxResult = bbox(feature);
	if (bboxResult && (bboxResult.length === 4 || bboxResult.length === 6)) {
		if (bboxResult.length === 6) {
			// If it's a 6-element bbox, take the 2D part (first 4 elements)
			return [
				bboxResult[0], // minX (west)
				bboxResult[1], // minY (south)
				bboxResult[3], // maxX (east)
				bboxResult[4] // maxY (north)
			] as [number, number, number, number];
		} else {
			// bboxResult.length === 4
			return bboxResult as [number, number, number, number];
		}
	}
	return undefined; // Return undefined if bbox calculation fails or is empty
}

export function cameraForBoundsCustom(
	map: maplibregl.Map,
	bounds: number[],
	padding: { top: number; bottom: number; left: number; right: number }
) {
	let west = bounds[0];
	let south = bounds[1];
	let east = bounds[2] ?? bounds[3];
	let north = bounds[3] ?? bounds[4];
	if (west == null || south == null || east == null || north == null) {
		return null;
	}
	const x1 = (west + 180) / 360;
	const x2 = (east + 180) / 360;
	const radSouth = (south * Math.PI) / 180;
	const radNorth = (north * Math.PI) / 180;
	const y1 = (1 - Math.log(Math.tan(radSouth) + 1 / Math.cos(radSouth)) / Math.PI) / 2;
	const y2 = (1 - Math.log(Math.tan(radNorth) + 1 / Math.cos(radNorth)) / Math.PI) / 2;
	const dx = Math.abs(x2 - x1);
	const dy = Math.abs(y2 - y1);
	const container = map.getContainer();
	const width = container.clientWidth - (padding.left + padding.right);
	const height = container.clientHeight - (padding.top + padding.bottom);
	if (width <= 0 || height <= 0 || dx === 0 || dy === 0) {
		const cx = (west + east) / 2;
		const cy = (south + north) / 2;
		return { center: [cx, cy] as LngLatLike, zoom: Math.min(map.getZoom() ?? 7, 14) };
	}
	const world = 512;
	const scaleX = width / (dx * world);
	const scaleY = height / (dy * world);
	const scale = Math.min(scaleX, scaleY);
	const zoom = Math.min(Math.max(Math.log2(scale), map.getMinZoom() ?? 0), map.getMaxZoom() ?? 22);
	const cx = (x1 + x2) / 2;
	const cy = (y1 + y2) / 2;
	const lng = cx * 360 - 180;
	const lat = (Math.atan(Math.sinh(Math.PI * (1 - 2 * cy))) * 180) / Math.PI;
	return { center: [lng, lat] as LngLatLike, zoom };
}

let lastKey: string | null = null;

export function easeToIfChanged(
	map: maplibregl.Map,
	options: maplibregl.EaseToOptions,
	key: string
) {
	console.log(lastKey, key);
	if (lastKey !== key) {
		map.stop();
		map.easeTo(options);
		lastKey = key;
	}
}

export function setBounds(
	map: maplibregl.Map,
	bbox: LngLatBoundsLike,
	padding: { top: number; bottom: number; left: number; right: number },
	animate = true,
	key: string
) {
	if (map && bbox) {
		padding = {
			top: padding.top ?? 0,
			bottom: padding.bottom ?? 0,
			left: padding.left ?? 0,
			right: padding.right ?? 0
		};
		// console.log('padding', padding);
		const camera = cameraForBoundsCustom(map, bbox as number[], padding);
		// console.log('camera', camera);
		if (camera) {
			easeToIfChanged(
				map,
				{
					center: camera.center,
					zoom: camera.zoom,
					padding,
					animate
				},
				key
			);
		}
	}
}
