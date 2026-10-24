# WhatsApp Bulk Messaging Backend

## Setup
1. Create a Supabase project and run `sql/schema.sql` in SQL Editor.
2. In Supabase Auth, create a user for each organization admin. Copy the user's UUID.
3. Add membership for that user and organization, for example:

```sql
insert into public.organization_members(organization_id,user_id,role)
select id,'YOUR_SUPABASE_AUTH_USER_UUID'::uuid,'owner'
from public.organizations where slug='codeshape-hospital'
on conflict do nothing;
```

4. Copy `.env.example` to `.env`; set Supabase URL and the server-side service-role/secret key. Never put that key in frontend variables or Git.
5. `npm install`, then `npm run dev`.
6. Check `http://localhost:5000/api/health`.

## Authentication
Protected requests need `Authorization: Bearer <Supabase access token>` and `x-organization-id: <organization UUID>`. The API validates the token through Supabase Auth and checks organization membership before accessing data. Organization IDs must be UUIDs from Supabase, not frontend slug strings.

## API
- `GET /api/health`
- `GET /api/organizations`
- `GET /api/contacts?q=&group=&page=1&limit=100`
- `POST /api/contacts` JSON: `{name,phone,email?,group_name?,opted_in?}`
- `POST /api/contacts/import` multipart file field `file` (`.xlsx`, `.xls`, `.csv`)
- `PATCH /api/contacts/:id/consent` JSON: `{opted_in:true,source:"recorded opt-in"}`
- `DELETE /api/contacts/:id`
- `GET /api/reports`
- `GET /api/campaigns`
- `POST /api/campaigns` JSON: `{name,template_name,language?,group_name?,scheduled_at?,contact_ids:[]}`
- `POST /api/campaigns/:id/send`
- `GET /api/campaigns/:id/messages`
- Meta webhook `GET/POST /api/webhooks/whatsapp`

## Meta Cloud API
Set `META_GRAPH_VERSION`, `META_PHONE_NUMBER_ID`, `META_ACCESS_TOKEN`, `META_VERIFY_TOKEN`. Create and approve templates in WhatsApp Manager first. Campaign sending only queues contacts marked opted-in. The starter sends at most 500 queued messages per HTTP request; use a durable background queue, idempotent jobs, provider-aware throttling/retries, webhook signature validation, and monitoring before production/high-volume use. Do not send to people who have not opted in. Business-initiated conversations generally require approved templates.

## Notes
- `.env` is ignored by Git. Do not commit real keys.
- Contact import defaults `opted_in` to false unless the spreadsheet explicitly has a boolean `opted_in` column set to `true`; importing a file is not consent.
- The app intentionally does not expose the service-role key to the browser.
