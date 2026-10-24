create extension if not exists pgcrypto;
create table if not exists public.organizations (
 id uuid primary key default gen_random_uuid(), slug text unique not null, name text not null,
 type text not null check(type in ('Hospital','School','Hotel','Business')), location text not null default '',
 settings jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.organization_members (
 organization_id uuid not null references public.organizations(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 role text not null default 'admin' check(role in ('owner','admin','staff','viewer')),
 created_at timestamptz not null default now(), primary key(organization_id,user_id)
);
create table if not exists public.contacts (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
 name text not null, phone text not null, email text, group_name text, opted_in boolean not null default false,
 consent_source text, consent_updated_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(organization_id,phone)
);
create index if not exists contacts_org_group_idx on public.contacts(organization_id,group_name);
create index if not exists contacts_org_phone_idx on public.contacts(organization_id,phone);
create table if not exists public.templates (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
 meta_name text not null, language text not null default 'en_US', category text, status text not null default 'pending', body text,
 created_at timestamptz not null default now(), unique(organization_id,meta_name,language)
);
create table if not exists public.campaigns (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
 name text not null, template_name text not null, language text not null default 'en_US', group_name text,
 status text not null default 'draft', scheduled_at timestamptz, recipient_count integer not null default 0,
 sent_count integer not null default 0, failed_count integer not null default 0, created_by uuid references auth.users(id),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.messages (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
 campaign_id uuid not null references public.campaigns(id) on delete cascade, contact_id uuid not null references public.contacts(id) on delete cascade,
 status text not null default 'queued', meta_message_id text unique, sent_at timestamptz, delivered_at timestamptz, read_at timestamptz,
 last_error text, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(campaign_id,contact_id)
);
create index if not exists messages_org_created_idx on public.messages(organization_id,created_at desc);
create index if not exists messages_status_idx on public.messages(organization_id,status);
insert into public.organizations(slug,name,type,location) values
 ('codeshape-hospital','Codeshape Hospital','Hospital','Varanasi, Uttar Pradesh'),
 ('codeshape-school','Codeshape School','School','Varanasi, Uttar Pradesh'),
 ('codeshape-hotel','Codeshape Hotel','Hotel','Varanasi, Uttar Pradesh'),
 ('codeshape-business','Codeshape Business','Business','Varanasi, Uttar Pradesh')
on conflict(slug) do nothing;
-- Enable RLS for direct browser access. The server uses the service role only after checking Auth and organization membership.
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.contacts enable row level security;
alter table public.templates enable row level security;
alter table public.campaigns enable row level security;
alter table public.messages enable row level security;
-- No anonymous/public policies are created intentionally. Access through authenticated backend routes.
