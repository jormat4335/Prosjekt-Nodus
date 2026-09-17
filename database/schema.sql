create table public.organizations (
 id uuid primary key default gen_random_uuid(), name text not null, created_at timestamptz not null default now()
);
create table public.organization_members (
 organization_id uuid not null references public.organizations(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 role text not null default 'viewer' check(role in ('admin','viewer')),
 primary key(organization_id,user_id)
);
create index organization_members_user_idx on public.organization_members(user_id,organization_id);
create table public.sites (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id),
 name text not null, address text, description text, timezone text not null default 'Europe/Oslo',
 created_at timestamptz not null default now(), is_test boolean not null default false, unique(organization_id,id)
);
create table public.integrations (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null, site_id uuid not null,
 name text not null, kind text not null check(kind in ('mqtt','wago','belimo','manual')),
 external_id text, enabled boolean not null default false, last_seen_at timestamptz,
 unique(organization_id,site_id,id),
 foreign key(organization_id,site_id) references public.sites(organization_id,id)
);
create table public.sensors (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null, site_id uuid not null, integration_id uuid,
 name text not null, metric text not null, unit text not null,
 external_id text, source_topic text, source_address text,
 stale_after_seconds integer not null default 900 check(stale_after_seconds between 30 and 604800),
 created_at timestamptz not null default now(),
 unique(organization_id,site_id,id), unique(integration_id,external_id),
 foreign key(organization_id,site_id) references public.sites(organization_id,id),
 foreign key(organization_id,site_id,integration_id) references public.integrations(organization_id,site_id,id)
);
create table public.readings (
 organization_id uuid not null, site_id uuid not null, sensor_id uuid not null,
 observed_at timestamptz not null, received_at timestamptz not null default now(),
 value double precision not null check(value > '-Infinity'::double precision and value < 'Infinity'::double precision),
 quality text not null default 'good' check(quality in ('good','uncertain','bad')),
 primary key(sensor_id,observed_at),
 foreign key(organization_id,site_id,sensor_id) references public.sensors(organization_id,site_id,id)
);
create index readings_scope_time_idx on public.readings(organization_id,site_id,observed_at desc);
create index readings_sensor_scope_idx on public.readings(organization_id,site_id,sensor_id);
create table public.alarms (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null, site_id uuid not null, sensor_id uuid,
 title text not null, description text, severity text not null check(severity in ('critical','warning','info')),
 state text not null default 'active' check(state in ('active','resolved')),
 occurred_at timestamptz not null default now(), resolved_at timestamptz,
 foreign key(organization_id,site_id) references public.sites(organization_id,id),
 foreign key(organization_id,site_id,sensor_id) references public.sensors(organization_id,site_id,id),
 check((state='active' and resolved_at is null) or (state='resolved' and resolved_at>=occurred_at))
);
create table public.events (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null, site_id uuid not null,
 occurred_at timestamptz not null default now(), kind text not null, message text not null,
 foreign key(organization_id,site_id) references public.sites(organization_id,id)
);
create table public.reports (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null, site_id uuid not null,
 title text not null, period_start timestamptz not null, period_end timestamptz not null,
 created_at timestamptz not null default now(),
 status text not null default 'draft' check(status in ('draft','ready','failed')),
 summary text, content text, findings jsonb not null default '[]'::jsonb check(jsonb_typeof(findings)='array'), check(period_end > period_start),
 foreign key(organization_id,site_id) references public.sites(organization_id,id)
);
create table public.analysis_runs (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null, site_id uuid not null,
 created_at timestamptz not null default now(),
 status text not null default 'queued' check(status in ('queued','running','completed','failed')),
 model text, input_from timestamptz, input_to timestamptz, findings jsonb, error_message text,
 foreign key(organization_id,site_id) references public.sites(organization_id,id)
);
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
create policy member_self on public.organization_members for select to authenticated using(user_id=(select auth.uid()));
create policy member_org on public.organizations for select to authenticated using(id in (select organization_id from public.organization_members where user_id=(select auth.uid())));
do $$
declare t text;
begin
 foreach t in array array['sites','integrations','sensors','readings','alarms','events','reports','analysis_runs'] loop
 execute format('alter table public.%I enable row level security', t);
 execute format('create policy member_read on public.%I for select to authenticated using(organization_id in (select organization_id from public.organization_members where user_id=(select auth.uid())))',t);
 if t <> 'readings' then
 execute format('create index %I on public.%I(organization_id, %I)',t||'_scope_idx',t,case when t='sites' then 'id' else 'site_id' end);
 end if;
 end loop;
end $$;
create index sensors_integration_idx on public.sensors(organization_id,site_id,integration_id);
create index alarms_sensor_idx on public.alarms(organization_id,site_id,sensor_id);
create view public.latest_readings with (security_invoker=true) as
 select s.organization_id,s.site_id,s.id as sensor_id,r.observed_at,r.received_at,r.value,r.quality
 from public.sensors s
 join lateral (select observed_at,received_at,value,quality from public.readings r where r.sensor_id=s.id order by observed_at desc limit 1) r on true;
revoke all on public.organizations,public.organization_members,public.sites,public.integrations,public.sensors,public.readings,public.alarms,public.events,public.reports,public.analysis_runs,public.latest_readings from anon,authenticated;
grant select on public.organizations,public.organization_members,public.sites,public.integrations,public.sensors,public.readings,public.alarms,public.events,public.reports,public.analysis_runs,public.latest_readings to authenticated;
comment on table public.integrations is 'Read-only acquisition metadata. Credentials belong in server secrets, never in this table.';
comment on table public.analysis_runs is 'Reserved for future advisory AI analysis. No actuation or control commands.';
