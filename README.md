# WhatsApp Bulk Messaging System — Updated Project

This archive contains the existing React/Vite frontend (UI kept in place), a new Express backend, Supabase SQL schema, environment templates, and Meta WhatsApp Cloud API integration.

## Folder layout
- `frontend/` — existing dashboard UI plus dynamic organization settings, quick admin selectors, contact Excel/CSV import/export, report PDF/Excel export, and optional backend mode.
- `backend/` — Express API, Supabase Auth/membership validation, contacts/import, campaigns, reports, Meta send service and webhook.

## First-time setup
1. Extract the ZIP.
2. In `backend/`, copy `.env.example` to `.env`, fill Supabase URL and server-side service role/secret key, then run `npm install` and `npm run dev`.
3. Run `backend/sql/schema.sql` in Supabase SQL Editor.
4. Create one Supabase Auth user for each organization administrator. To match the login quick-select cards, you can use `admin@codeshape-hospital.com`, `admin@codeshape-school.com`, `admin@codeshape-hotel.com`, and `admin@codeshape-business.com`. Set a unique password for each and add each user UUID to its organization in `organization_members` using the SQL example in `backend/README.md`.
5. In `frontend/`, copy `.env.example` to `.env`, set `VITE_USE_BACKEND=true`, `VITE_API_URL=http://localhost:5000/api`, Supabase URL and publishable key. Run `npm install` and `npm run dev`.
6. The login page's organization tiles fill the corresponding admin email. Enter the password for the Supabase Auth user. The demo mode remains available by setting `VITE_USE_BACKEND=false`.
7. Configure Meta variables in `backend/.env` after setting up the WhatsApp Business app, phone number ID, access token, and webhook.

## Security notes
- Never expose `SUPABASE_SERVICE_ROLE_KEY`, `META_ACCESS_TOKEN`, or `META_APP_SECRET` to the frontend.
- The frontend's quick-login cards are convenience email selectors, not separate authentication credentials. Create the users in Supabase Auth and set unique passwords yourself.
- Only opted-in contacts are eligible for backend campaign sending. Importing contacts does not count as consent.
- Meta-initiated messages generally require approved templates. A future-time campaign requires a production scheduler/queue; the API stores its schedule but does not run a background scheduler yet.
- Reports use real message rows in backend mode. In demo mode, daily figures are simulated from the bundled sample totals and are labeled as demo data.

## Validation caveat
The environment used to prepare this archive could not download npm packages, so run `npm install` in both folders and `npm run build` in `frontend/` locally. Configure your real Supabase and Meta credentials before end-to-end testing.
