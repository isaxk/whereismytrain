import csv from 'csv-parser';
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// CONFIG
const CSV_FILE_PATH = path.join(__dirname, './odm.csv');
const MIN_JOURNEYS = 500; // sensible threshold
const MAX_DESTS_PER_ORIGIN = 20;
const BATCH_SIZE = 1000;

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// SUPABASE
const supabase = createClient(
	process.env.SUPABASE_URL,
	process.env.SUPABASE_SERVICE_ROLE_KEY // REQUIRED for bulk inserts
);

// In-memory aggregation:
// origin_crs -> array of { destination_crs, journeys }
const originMap = new Map();

function maybeInsert(origin, destination, journeys) {
	if (!originMap.has(origin)) {
		originMap.set(origin, []);
	}

	const list = originMap.get(origin);

	list.push({ destination_crs: destination, journeys });

	// Keep list sorted and trimmed
	list.sort((a, b) => b.journeys - a.journeys);

	if (list.length > MAX_DESTS_PER_ORIGIN) {
		list.length = MAX_DESTS_PER_ORIGIN;
	}
}

async function flushToSupabase(rows) {
	const { error } = await supabase
		.from('station_journey_suggestions')
		.upsert(rows, { onConflict: 'origin_crs,destination_crs' });

	if (error) {
		console.error('Supabase insert error:', error);
		process.exit(1);
	}
}

const elizabethLine = ['PAD', 'TCR', 'BDS', 'ZFD', 'ZLW', 'CWX', 'LST'];

async function main() {
	console.log('Reading CSV...');

	await new Promise((resolve) => {
		fs.createReadStream(CSV_FILE_PATH)
			.pipe(csv())
			.on('data', (row) => {
				const journeys = Number(row.journeys);
				if (journeys < MIN_JOURNEYS) return;
				if (elizabethLine.includes(row.origin_tlc) && elizabethLine.includes(row.destination_tlc))
					return;
				if (
					row.origin_station_group === 'LONDON BR' &&
					row.destination_station_group === 'LONDON BR'
				)
					return;

				const origin = row.origin_tlc;
				const destination = row.destination_tlc;

				if (!origin || !destination) return;

				maybeInsert(origin, destination, journeys);
			})
			.on('end', resolve);
	});

	console.log(`Filtered to ${originMap.size} origin stations`);

	// Flatten data
	const allRows = [];
	for (const [origin, destinations] of originMap.entries()) {
		for (const d of destinations) {
			allRows.push({
				origin_crs: origin,
				destination_crs: d.destination_crs,
				journeys: d.journeys
			});
		}
	}

	console.log(`Uploading ${allRows.length} rows to Supabase...`);

	// Batch upload
	for (let i = 0; i < allRows.length; i += BATCH_SIZE) {
		const batch = allRows.slice(i, i + BATCH_SIZE);
		await flushToSupabase(batch);
		console.log(`Uploaded ${i + batch.length}/${allRows.length}`);
	}

	console.log('Done ✅');
}

main();
