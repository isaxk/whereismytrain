# Where is my train?

[train.isaxk.com](https://train.isaxk.com)

Better uk train information with notifications. Powered by official National Rail data.

## Development

### Optional backend
The backend is formed of 2 optional databases:
- a supabase postgressql database of location coordinates, required for the map function
- convex for the notification service.

Both are disabled by default, so if you wish to contribute to the core app, you do not need to set them up.

### National Rail APIs
1. [Live Departure Board - Staff Version](https://raildata.org.uk/dashboard/dataProduct/P-53613c24-0205-4d3b-919a-b338858e130e/overview) - set to env: `ACCESS_TOKEN`
2. [Query Services & Service Details](https://raildata.org.uk/dashboard/dataProduct/P-9a4b5235-d06a-483d-b12f-7d0d95b06b18/overview) - set to env: `SERVICES_DETAILS_TOKEN`

### Supabase (locations backend) setup:

1. [Obtain a TIPLOC locations file from the Rail Data Markplace](https://raildata.org.uk/dashboard/dataProduct/P-0284e55c-cebe-4736-accf-ac69fde71502/overview)
1. Move to the scripts folder as `tiplocs.json`
1. Create a supabase project and run the following SQL:
```sql
CREATE TABLE tiplocs (
  id int8 PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  tiploc text,
  name text,
  lat float8,
  long float8,
  crs text
);
```
4. Set the `SUPABASE_URL`, `SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` environment variables
5. Run: `pnpm run tiplocs`
6. The database should now be populated with the TIPLOC locations.

### Convex (notification service) setup:

```bash
pnpx convex dev
```

### Frontend

```bash
pnpm install
pnpm dev
```

To enable the map and notification functions, set their respective environment variables to `true`:
```bash
PUBLIC_MAP_ENABLED=true
PUBLIC_NOTIFICATIONS_ENABLED=true
```
