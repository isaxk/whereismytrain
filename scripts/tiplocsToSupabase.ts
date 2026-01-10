import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// --- ESM-compatible way to get __dirname equivalent ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // Use service_role_key for bulk imports
const supabase = createClient(supabaseUrl, supabaseKey);

const filePath = path.join(__dirname, './tiplocs.json'); // Path to your large JSON file

interface TiplocData {
	Tiploc: string;
	Name: string;
	Latitude: number;
	Longitude: number;
	Details: {
		CRS: string | null;
	};
	// Add other properties from your JSON if needed
}

async function seedData() {
	try {
		const rawData = fs.readFileSync(filePath, 'utf8');
		const tiplocList: TiplocData[] = JSON.parse(rawData).Tiplocs;

		console.log(`Starting import of ${tiplocList.length} records...`);

		// Supabase has a limit on the number of rows per insert.
		// It's best to batch inserts. For example, 1000 records per batch.
		const batchSize = 1000;
		for (let i = 0; i < tiplocList.length; i += batchSize) {
			const batch = tiplocList.slice(i, i + batchSize);

			const recordsToInsert = batch.map((item) => ({
				tiploc: item.Tiploc,
				name: item.Name,
				lat: item.Latitude,
				long: item.Longitude,
				crs: item.Details.CRS
				// If you created an original_data JSONB column:
				// original_data: item
			}));

			console.log(recordsToInsert);

			const { error } = await supabase.from('tiplocs').insert(recordsToInsert);

			if (error) {
				console.error(`Error inserting batch ${i / batchSize + 1}:`, error);
				// Depending on error, you might want to stop or retry
			} else {
				console.log(`Successfully inserted batch ${i / batchSize + 1} (${batch.length} records)`);
			}
		}

		console.log('Data import complete!');
	} catch (error) {
		console.error('Error during data seeding:', error);
	}
}

seedData();
