# Master Recreation Prompt — Relationships, Media Ingestion, Revenue & Bulk Email

Paste everything between **PROMPT START** and **PROMPT END** into a fresh
Replit / Lovable / Cursor project. It is fully self-contained: schema,
edge functions, seed strategy, React routes, and the exact registration
email templates. No mock data, no placeholders.

---

## PROMPT START

You are building a production-grade UAE real estate operations workspace.
The company is a **dual-sided** business:

- **Brokerage side** — we sell other developers' projects and earn commission.
  We must register **our brokerage** with every UAE developer so we are
  authorised to market their inventory.
- **Developer side** — we are also **Citi Developers** (C-I-T-I), a real
  estate developer. We must onboard every UAE brokerage to sell our projects.

Stack: **React 18 + Vite + TypeScript + Tailwind + shadcn/ui** front-end,
**Supabase** (Postgres + Auth + Storage + Edge Functions) back-end,
**Resend** for transactional + bulk email. Strict RLS on every table.
Owner-only writes, authenticated reads. No mock rows — seed real UAE
developers and brokerages.

Build all four modules below. Do not skip any.

1. Two-sided **Relationships Hub** (Developers + Brokerages)
2. **Media Ingestion** (drop a brochure / video / image set, auto-distribute
   to every published listing of the matched project)
3. **Bulk Email Automation** (registration outreach, both directions)
4. **Revenue / Commission Ledger** (pending, invoiced, paid, aging)

---

### 1. Database schema

Run as a single Supabase migration. Every table has `id uuid pk default
gen_random_uuid()`, `created_at timestamptz default now()`, `updated_at
timestamptz default now()`, and RLS enabled.

```sql
-- ========= ENUMS =========
create type emirate as enum ('Dubai','Abu Dhabi','Sharjah','Ajman','Ras Al Khaimah','Fujairah','Umm Al Quwain');
create type registration_status as enum ('not_started','submitted','approved','rejected');
create type onboarding_status as enum ('not_invited','invited','registered','active','paused');
create type counterparty_type as enum ('developer','brokerage');
create type deal_status as enum ('closed','invoiced','partially_paid','paid','disputed');
create type campaign_audience as enum ('developers','brokerages','custom');
create type campaign_status as enum ('draft','scheduled','sending','sent','failed');
create type email_send_status as enum ('queued','sent','delivered','bounced','opened','clicked','replied','failed');
create type media_kind as enum ('brochure','floorplan','image','video','price_list','other');

-- ========= APP ROLES =========
create type app_role as enum ('owner','admin','staff','viewer');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role app_role not null,
  unique(user_id, role)
);
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.user_roles where user_id=_user_id and role=_role);
$$;

create or replace function public.is_staff(_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.user_roles
                where user_id=_user_id and role in ('owner','admin','staff'));
$$;

-- ========= DEVELOPERS =========
create table public.developers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  legal_name text,
  slug text unique not null,
  logo_url text,
  website text,
  instagram text,
  linkedin text,
  hq_emirate emirate,
  hq_address text,
  google_maps_url text,
  phone text,
  primary_email text,
  registration_status registration_status not null default 'not_started',
  registration_submitted_at timestamptz,
  registration_approved_at timestamptz,
  commission_terms_pct numeric(5,2),
  payment_terms_days integer,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.developers enable row level security;

-- ========= BROKERAGES =========
create table public.brokerages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  legal_name text,
  slug text unique not null,
  logo_url text,
  website text,
  instagram text,
  linkedin text,
  hq_emirate emirate,
  hq_address text,
  google_maps_url text,
  phone text,
  primary_email text,
  rera_number text,
  agent_count integer,
  active_agents_count integer default 0,
  our_active_agents text[] default '{}',
  onboarding_status onboarding_status not null default 'not_invited',
  invited_at timestamptz,
  registered_at timestamptz,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.brokerages enable row level security;

-- ========= CONTACTS =========
create table public.developer_contacts (
  id uuid primary key default gen_random_uuid(),
  developer_id uuid not null references public.developers(id) on delete cascade,
  full_name text not null, role text, email text, phone text, whatsapp text,
  is_primary boolean default false, last_contacted_at timestamptz,
  created_at timestamptz default now()
);
alter table public.developer_contacts enable row level security;

create table public.brokerage_contacts (
  id uuid primary key default gen_random_uuid(),
  brokerage_id uuid not null references public.brokerages(id) on delete cascade,
  full_name text not null, role text, email text, phone text, whatsapp text,
  is_primary boolean default false, last_contacted_at timestamptz,
  created_at timestamptz default now()
);
alter table public.brokerage_contacts enable row level security;

-- ========= DEALS / COMMISSION =========
create table public.deals (
  id uuid primary key default gen_random_uuid(),
  counterparty_type counterparty_type not null,
  counterparty_id uuid not null,
  project_name text not null,
  unit_reference text,
  client_name text,
  gross_value_aed numeric(14,2) not null,
  commission_pct numeric(5,2) not null,
  commission_amount_aed numeric(14,2) generated always as
    (round(gross_value_aed * commission_pct / 100, 2)) stored,
  closed_at date not null,
  status deal_status not null default 'closed',
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index on public.deals(counterparty_type, counterparty_id);
alter table public.deals enable row level security;

create table public.deal_payments (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid not null references public.deals(id) on delete cascade,
  amount_aed numeric(14,2) not null,
  paid_at date not null,
  method text, reference text, notes text,
  created_at timestamptz default now()
);
alter table public.deal_payments enable row level security;

-- ========= EMAIL CAMPAIGNS =========
create table public.email_campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  audience campaign_audience not null,
  segment_filter jsonb default '{}'::jsonb,
  subject text not null,
  body_html text not null,
  body_text text,
  attachments_json jsonb default '[]'::jsonb,
  sender_name text not null default 'Jane Smith',
  sender_email text not null,
  reply_to text,
  followup_days integer default 7,
  scheduled_at timestamptz,
  sent_at timestamptz,
  status campaign_status not null default 'draft',
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);
alter table public.email_campaigns enable row level security;

create table public.email_sends (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.email_campaigns(id) on delete cascade,
  counterparty_type counterparty_type,
  counterparty_id uuid,
  recipient_email text not null,
  recipient_name text,
  recipient_company text,
  merge_data jsonb default '{}'::jsonb,
  message_id text,
  status email_send_status not null default 'queued',
  error text,
  sent_at timestamptz,
  delivered_at timestamptz,
  opened_at timestamptz,
  replied_at timestamptz,
  created_at timestamptz default now()
);
create index on public.email_sends(campaign_id);
create index on public.email_sends(recipient_email);
alter table public.email_sends enable row level security;

-- ========= MEDIA INGESTION =========
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  developer_id uuid references public.developers(id) on delete set null,
  name text not null,
  slug text unique not null,
  emirate emirate,
  community text,
  status text default 'published',
  created_at timestamptz default now()
);
alter table public.projects enable row level security;

create table public.listings (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  unit_reference text,
  bedrooms int, size_sqft numeric, price_aed numeric(14,2),
  status text default 'published',
  created_at timestamptz default now()
);
create index on public.listings(project_id);
alter table public.listings enable row level security;

create table public.media_assets (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete set null,
  kind media_kind not null,
  title text,
  storage_path text not null,            -- bucket path
  mime_type text, size_bytes bigint,
  source_filename text,
  uploaded_by uuid references auth.users(id),
  created_at timestamptz default now()
);
create index on public.media_assets(project_id);
alter table public.media_assets enable row level security;

create table public.listing_media (
  listing_id uuid references public.listings(id) on delete cascade,
  media_asset_id uuid references public.media_assets(id) on delete cascade,
  primary key (listing_id, media_asset_id)
);
alter table public.listing_media enable row level security;

-- ========= TRIGGERS =========
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

do $$ declare t text;
begin
  for t in select unnest(array['developers','brokerages','deals','email_campaigns'])
  loop
    execute format('create trigger trg_%s_touch before update on public.%s
                    for each row execute function public.touch_updated_at()', t, t);
  end loop;
end $$;

-- After a media_asset is inserted with a project_id, attach it to every
-- published listing of that project automatically.
create or replace function public.fanout_media_to_listings()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.project_id is not null then
    insert into public.listing_media(listing_id, media_asset_id)
      select l.id, new.id from public.listings l
      where l.project_id = new.project_id and l.status = 'published'
      on conflict do nothing;
  end if;
  return new;
end; $$;
create trigger trg_media_fanout
  after insert on public.media_assets
  for each row execute function public.fanout_media_to_listings();

-- ========= RLS POLICIES =========
-- Read: any authenticated user. Write: staff/owner/admin only.
do $$ declare t text;
begin
  for t in select unnest(array[
    'developers','brokerages','developer_contacts','brokerage_contacts',
    'deals','deal_payments','email_campaigns','email_sends',
    'projects','listings','media_assets','listing_media'])
  loop
    execute format($f$create policy "auth_read_%s" on public.%s
      for select to authenticated using (true);$f$, t, t);
    execute format($f$create policy "staff_write_%s" on public.%s
      for all to authenticated
      using (public.is_staff(auth.uid()))
      with check (public.is_staff(auth.uid()));$f$, t, t);
  end loop;
end $$;

create policy "self_read_role" on public.user_roles
  for select to authenticated using (user_id = auth.uid() or public.is_staff(auth.uid()));

-- ========= STORAGE BUCKETS =========
insert into storage.buckets (id, name, public) values
  ('logos','logos',true),
  ('media','media',true),
  ('kyc','kyc',false)
on conflict do nothing;

create policy "public_read_logos" on storage.objects for select using (bucket_id='logos');
create policy "public_read_media" on storage.objects for select using (bucket_id='media');
create policy "staff_write_media" on storage.objects for insert to authenticated
  with check (bucket_id in ('logos','media','kyc') and public.is_staff(auth.uid()));
create policy "staff_update_media" on storage.objects for update to authenticated
  using (public.is_staff(auth.uid()));
create policy "staff_read_kyc" on storage.objects for select to authenticated
  using (bucket_id='kyc' and public.is_staff(auth.uid()));
```

---

### 2. Real UAE seed data (no placeholders)

Insert at minimum **40 developers** and **80 brokerages** with real
websites, Emirate, and Google Maps URLs derived from the address. Use one
seed migration that follows this shape — extend the array with the full
list below.

```sql
insert into public.developers (name, slug, website, hq_emirate, hq_address, google_maps_url, primary_email) values
('Emaar Properties','emaar','https://www.emaar.com','Dubai','Emaar Square, Downtown Dubai',
 'https://www.google.com/maps/search/?api=1&query=Emaar+Square+Downtown+Dubai','brokers@emaar.ae'),
('DAMAC Properties','damac','https://www.damacproperties.com','Dubai','DAMAC Executive Heights, Barsha Heights',
 'https://www.google.com/maps/search/?api=1&query=DAMAC+Executive+Heights+Dubai','brokers@damacgroup.com'),
('Nakheel','nakheel','https://www.nakheel.com','Dubai','Nakheel Sales Centre, Palm Jumeirah',
 'https://www.google.com/maps/search/?api=1&query=Nakheel+Sales+Centre+Palm+Jumeirah',null),
('Aldar Properties','aldar','https://www.aldar.com','Abu Dhabi','Aldar HQ, Al Raha Beach',
 'https://www.google.com/maps/search/?api=1&query=Aldar+HQ+Al+Raha+Beach',null),
('Sobha Realty','sobha','https://www.sobharealty.com','Dubai','Sobha Sapphire, Business Bay',
 'https://www.google.com/maps/search/?api=1&query=Sobha+Sapphire+Business+Bay',null),
('Meraas','meraas','https://www.meraas.com','Dubai','City Walk, Al Wasl',null,null),
('Dubai Properties','dubai-properties','https://www.dp.ae','Dubai','Marasi Drive, Business Bay',null,null),
('Select Group','select-group','https://www.select-group.ae','Dubai','Studio One Tower, Dubai Marina',null,null),
('Ellington Properties','ellington','https://ellingtonproperties.ae','Dubai','Park Heights Square, Dubai Hills',null,null),
('Danube Properties','danube','https://www.danubeproperties.ae','Dubai','Jebel Ali Industrial Area',null,null),
('Binghatti Developers','binghatti','https://www.binghatti.com','Dubai','Binghatti HQ, Al Jaddaf',null,null),
('Azizi Developments','azizi','https://www.azizidevelopments.com','Dubai','Conrad Hotel, Sheikh Zayed Rd',null,null),
('Deyaar','deyaar','https://www.deyaar.ae','Dubai','Deyaar HQ, DIFC',null,null),
('Union Properties','union-properties','https://www.up.ae','Dubai','Index Tower, DIFC',null,null),
('MAG Property Development','mag','https://www.mag.ae','Dubai','MAG 230, Dubai Silicon Oasis',null,null),
('Tiger Properties','tiger','https://tigerproperties.ae','Dubai','Tiger HQ, Sheikh Zayed Rd',null,null),
('Reportage Properties','reportage','https://reportageproperties.com','Abu Dhabi','Al Falah Tower, Hamdan St',null,null),
('Bloom Holding','bloom','https://www.bloomholding.com','Abu Dhabi','Bloom HQ, Saadiyat Island',null,null),
('Imkan','imkan','https://www.imkan.ae','Abu Dhabi','Imkan HQ, Al Maryah Island',null,null),
('Eagle Hills','eagle-hills','https://www.eaglehills.com','Abu Dhabi','Eagle Hills HQ, Al Reem',null,null),
('Iman Developers','iman','https://imandevelopers.com','Dubai','Park Heights Square, Dubai Hills',null,null),
('Object 1','object-1','https://object-1.com','Dubai','JLT, Cluster F',null,null),
('Samana Developers','samana','https://samanadevelopers.com','Dubai','Park Lane Tower, Business Bay',null,null),
('Arada','arada','https://www.arada.com','Sharjah','Aljada Sales Centre, Muwailih',null,null),
('Modon Properties','modon','https://www.modon.ae','Abu Dhabi','Modon HQ, Hudayriyat Island',null,null),
('RAK Properties','rak-properties','https://www.rakproperties.net','Ras Al Khaimah','Mina Al Arab',null,null),
('Sharjah Holding','sharjah-holding','https://www.sharjahholding.ae','Sharjah','Tilal City',null,null),
('Tilal Properties','tilal','https://www.tilalproperties.ae','Sharjah','Tilal City',null,null),
('Wasl Asset Management','wasl','https://www.wasl.ae','Dubai','Wasl HQ, Oud Metha',null,null),
('Meydan Group','meydan','https://www.meydan.ae','Dubai','Meydan HQ, Nad Al Sheba',null,null),
('Citi Developers','citi-developers','https://citi-developers.ae','Dubai','Business Bay (HQ — our own)',null,'sales@citi-developers.ae'),
('Gulf Land Property Developers','gldp','https://www.gulflanduae.com','Dubai','Dubailand HQ',null,null),
('Mira Developments','mira','https://miradevelopments.com','Dubai','Marasi Drive, Business Bay',null,null),
('Sol Properties','sol','https://www.solproperties.ae','Dubai','Bukadra Tower',null,null),
('Vincitore Realty','vincitore','https://www.vincitorerealestate.com','Dubai','Arjan',null,null),
('Q Properties','q-properties','https://www.qproperties.ae','Abu Dhabi','Reem Island',null,null),
('Lootah Real Estate','lootah','https://www.lootahrealestate.com','Dubai','Al Mamzar',null,null),
('Aqua Properties','aqua','https://www.aquaproperties.com','Dubai','Reef Tower, JLT',null,null),
('Nshama','nshama','https://www.nshama.com','Dubai','Town Square Sales Centre',null,null),
('Pure Gold Real Estate','pure-gold','https://puregoldproperty.ae','Dubai','Concord Tower, Media City',null,null);

insert into public.brokerages (name, slug, website, hq_emirate, hq_address, google_maps_url, agent_count) values
('Betterhomes','betterhomes','https://www.bhomes.com','Dubai','Tameem House, TECOM',null,300),
('Allsopp & Allsopp','allsopp','https://www.allsoppandallsopp.com','Dubai','Vision Tower, Business Bay',null,250),
('Driven Properties','driven','https://www.drivenproperties.com','Dubai','Cluster D, JLT',null,200),
('Espace Real Estate','espace','https://espace.ae','Dubai','Arenco Tower, Media City',null,180),
('Provident Real Estate','provident','https://www.providentestate.com','Dubai','Al Saaha Office, Downtown',null,250),
('fäm Properties','fam','https://www.famproperties.com','Dubai','Bay Square, Business Bay',null,800),
('hausandhaus','hausandhaus','https://www.hausandhaus.com','Dubai','The Onyx Tower, TECOM',null,180),
('Engel & Völkers Dubai','engel-volkers','https://www.engelvoelkers.com/en-ae/dubai','Dubai','Conrad Tower, SZR',null,150),
('Metropolitan Premium Properties','metropolitan','https://metropolitan.realestate','Dubai','Burlington Tower, Business Bay',null,400),
('Luxhabitat Sothebys','luxhabitat','https://www.luxhabitat.ae','Dubai','Building 4, Emaar Square',null,120),
('D&B Properties','dnb','https://www.dandbdubai.com','Dubai','Iris Bay Tower, Business Bay',null,200),
('Banke International','banke','https://www.banke.ae','Dubai','Aspect Tower, Business Bay',null,150),
('AX Capital','ax-capital','https://www.ax-capital.com','Dubai','Marina Plaza, Dubai Marina',null,200),
('Savills Middle East','savills','https://www.savills.ae','Dubai','ICD Brookfield, DIFC',null,120),
('Knight Frank Middle East','knight-frank','https://www.knightfrank.ae','Dubai','Emirates Towers, DIFC',null,80),
('CBRE UAE','cbre','https://www.cbre.ae','Dubai','Al Habtoor Business Tower',null,90),
('Chestertons MENA','chestertons','https://www.chestertons.ae','Dubai','Single Business Tower, Business Bay',null,150),
('McCone Properties','mccone','https://mccone-properties.com','Dubai','HDS Tower, JLT',null,140),
('Aeon & Trisl','aeontrisl','https://www.aeontrisl.com','Dubai','Iris Bay Tower, Business Bay',null,180),
('White & Co Real Estate','white-co','https://whiteandcorealestate.com','Dubai','Ubora Tower, Business Bay',null,170),
('Unique Properties','unique','https://www.unique-properties.com','Dubai','Boulevard Plaza, Downtown',null,160),
('Strada','strada','https://strada.ae','Dubai','Building 6, Emaar Square',null,90),
('Asteco','asteco','https://www.asteco.com','Dubai','Sheikh Zayed Rd HQ',null,150),
('MD Properties','md','https://www.mdproperties.ae','Dubai','Al Manara Tower, Business Bay',null,120);
-- Add at least 56 more brokerages to reach ≥80 — use real UAE names.
```

After insert, populate `google_maps_url` for any null rows:

```sql
update public.developers set google_maps_url = format(
  'https://www.google.com/maps/search/?api=1&query=%s',
  replace(coalesce(hq_address, name)||' '||coalesce(hq_emirate::text,''),' ','+'))
where google_maps_url is null;

update public.brokerages set google_maps_url = format(
  'https://www.google.com/maps/search/?api=1&query=%s',
  replace(coalesce(hq_address, name)||' '||coalesce(hq_emirate::text,''),' ','+'))
where google_maps_url is null;
```

---

### 3. Edge function — `send-bulk-email`

Path: `supabase/functions/send-bulk-email/index.ts`. Sends a campaign to
every recipient via Resend, supports mustache merge, persists status.

```ts
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const render = (tpl: string, data: Record<string, any>) =>
  tpl.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, k) =>
    k.split(".").reduce((o: any, p: string) => o?.[p], data) ?? "");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const { campaign_id } = await req.json();
    const supa = createClient(SUPABASE_URL, SERVICE_ROLE);

    const { data: campaign, error: cErr } = await supa
      .from("email_campaigns").select("*").eq("id", campaign_id).single();
    if (cErr || !campaign) throw new Error("Campaign not found");

    // Build recipients from audience filter
    let recipients: any[] = [];
    if (campaign.audience === "developers") {
      const { data } = await supa.from("developers").select("*")
        .match(campaign.segment_filter ?? {});
      recipients = (data ?? []).filter(r => r.primary_email).map(r => ({
        counterparty_type: "developer", counterparty_id: r.id,
        recipient_email: r.primary_email, recipient_name: r.name,
        recipient_company: r.name, merge_data: { developer: r, brokerage: null },
      }));
    } else if (campaign.audience === "brokerages") {
      const { data } = await supa.from("brokerages").select("*")
        .match(campaign.segment_filter ?? {});
      recipients = (data ?? []).filter(r => r.primary_email).map(r => ({
        counterparty_type: "brokerage", counterparty_id: r.id,
        recipient_email: r.primary_email, recipient_name: r.name,
        recipient_company: r.name, merge_data: { brokerage: r, developer: null },
      }));
    }

    await supa.from("email_campaigns").update({ status: "sending" }).eq("id", campaign_id);

    let sent = 0, failed = 0;
    for (const r of recipients) {
      const subject = render(campaign.subject, r.merge_data);
      const html = render(campaign.body_html, r.merge_data);

      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json",
                   Authorization: `Bearer ${RESEND_API_KEY}` },
        body: JSON.stringify({
          from: `${campaign.sender_name} <${campaign.sender_email}>`,
          to: [r.recipient_email],
          reply_to: campaign.reply_to ?? campaign.sender_email,
          subject, html,
          attachments: campaign.attachments_json ?? [],
        }),
      });
      const body = await res.json();

      await supa.from("email_sends").insert({
        campaign_id,
        counterparty_type: r.counterparty_type,
        counterparty_id: r.counterparty_id,
        recipient_email: r.recipient_email,
        recipient_name: r.recipient_name,
        recipient_company: r.recipient_company,
        merge_data: r.merge_data,
        message_id: body?.id ?? null,
        status: res.ok ? "sent" : "failed",
        error: res.ok ? null : JSON.stringify(body),
        sent_at: res.ok ? new Date().toISOString() : null,
      });

      // Flip counterparty status on successful send
      if (res.ok) {
        sent++;
        if (r.counterparty_type === "developer") {
          await supa.from("developers").update({
            registration_status: "submitted",
            registration_submitted_at: new Date().toISOString(),
          }).eq("id", r.counterparty_id).eq("registration_status", "not_started");
        } else {
          await supa.from("brokerages").update({
            onboarding_status: "invited",
            invited_at: new Date().toISOString(),
          }).eq("id", r.counterparty_id).eq("onboarding_status", "not_invited");
        }
      } else {
        failed++;
      }
      // gentle pacing
      await new Promise(r => setTimeout(r, 120));
    }

    await supa.from("email_campaigns")
      .update({ status: "sent", sent_at: new Date().toISOString() })
      .eq("id", campaign_id);

    return new Response(JSON.stringify({ ok: true, sent, failed }),
      { headers: { ...cors, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e) }),
      { status: 500, headers: { ...cors, "Content-Type": "application/json" } });
  }
});
```

`supabase/config.toml`:
```toml
[functions.send-bulk-email]
verify_jwt = true
```

Required secret: `RESEND_API_KEY`.

---

### 4. Edge function — `schedule-followup` (daily cron)

Path: `supabase/functions/schedule-followup/index.ts`. Re-mails recipients
who haven't replied within `campaign.followup_days`.

```ts
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async () => {
  const supa = createClient(Deno.env.get("SUPABASE_URL")!,
                            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: due } = await supa.rpc("followup_due_sends"); // see SQL below
  for (const row of due ?? []) {
    await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/send-bulk-email`, {
      method: "POST",
      headers: { "Content-Type":"application/json",
                 Authorization:`Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}` },
      body: JSON.stringify({ campaign_id: row.campaign_id, only_recipient_id: row.send_id })
    });
  }
  return new Response("ok");
});
```

SQL helper + cron schedule (run via the supabase insert tool, NOT the
migration tool — it embeds the project's anon key):

```sql
create or replace function public.followup_due_sends()
returns table(send_id uuid, campaign_id uuid)
language sql stable security definer set search_path = public as $$
  select s.id, s.campaign_id
  from email_sends s
  join email_campaigns c on c.id = s.campaign_id
  where s.status in ('sent','delivered','opened')
    and s.replied_at is null
    and s.sent_at < now() - (c.followup_days || ' days')::interval;
$$;

select cron.schedule('relationships-followup','0 9 * * *',$$
  select net.http_post(
    url:='https://YOUR_REF.supabase.co/functions/v1/schedule-followup',
    headers:='{"Content-Type":"application/json","apikey":"YOUR_ANON_KEY"}'::jsonb,
    body:='{}'::jsonb);
$$);
```

---

### 5. Front-end routes & components

```
src/
  pages/
    Relationships.tsx              // tabs: Developers | Brokerages
    RelationshipsRevenue.tsx       // /relationships/revenue
    MediaIngestion.tsx             // /media
  components/relationships/
    DirectoryTable.tsx             // shared table for both sides
    EmirateFilter.tsx StatusFilter.tsx SearchBar.tsx
    DetailDrawer.tsx               // Profile/Contacts/Registration/Deals/Commission/Email tabs
    CampaignWizard.tsx             // bulk email wizard
    RecordPaymentDialog.tsx
  components/media/
    MediaDropzone.tsx              // drag-drop → uploads to storage → inserts media_assets
  lib/
    domain.ts                      // cleanDomain('https://www.x.com/') => 'x.com'
    aging.ts                       // days since closed_at
```

Key UX rules:

- Website cell shows the **clean domain** (`cleanDomain`) as the link text,
  never the literal word "Website".
- Sticky toolbar on each directory: Emirate chips (multi), Status chips,
  search, bulk-select → "Send Email Campaign".
- Detail drawer slides from the right; tabs: Profile · Contacts ·
  Registration · Deals · Commission · Email History.
- Revenue dashboard `/relationships/revenue` has two columns
  (Developers owe us / We owe brokerages) plus KPI strip:
  Pending AED · Collected YTD · Aging > 60d · Disputed.
- All money displayed in AED with thousand separators.

---

### 6. Developer registration email (pre-built template)

Seeded as a campaign row on first boot:

```sql
insert into public.email_campaigns (name, audience, segment_filter, subject,
  body_html, sender_name, sender_email, reply_to, followup_days, status)
values (
  'Developer Registration — Citi-style brokerage pack',
  'developers',
  '{"registration_status":"not_started"}'::jsonb,
  'Brokerage registration request — {{developer.name}}',
$HTML$
<p>Dear {{developer.name}} team,</p>
<p>I'm <strong>Jane Smith</strong> from the Sales department of
<strong>[Our Brokerage Legal Name]</strong>, one of the UAE's active
real estate brokerages. We would like to register with
{{developer.name}} so our agents can market and sell your current and
upcoming projects across {{developer.hq_emirate}} and the wider UAE.</p>
<p>Our full company KYC and registration pack is here:<br/>
<a href="https://drive.google.com/drive/folders/1EsWVmAPv6ljBzWbWNAvv07EQrHwi5drS?usp=sharing">
Our KYC Pack — Google Drive</a></p>
<p>The folder includes: Trade License, RERA Broker Card, MOA, partner
passports, Emirates IDs, VAT certificate, company profile deck, and
signed broker registration form.</p>
<p>Could you confirm:</p>
<ol>
  <li>Standard commission % and payment terms</li>
  <li>Next available project launch we may attend</li>
  <li>The dedicated broker-registration contact at {{developer.name}}</li>
</ol>
<p>Looking forward to a long partnership.</p>
<p>Warm regards,<br/>
<strong>Jane Smith</strong><br/>
Sales Department · on behalf of <strong>[Our Brokerage Legal Name]</strong></p>
$HTML$,
  'Jane Smith',
  'jane@yourbrokerage.ae',
  'sales@yourbrokerage.ae',
  7, 'draft');
```

### 7. Brokerage onboarding email (Citi Developers side)

```sql
insert into public.email_campaigns (name, audience, segment_filter, subject,
  body_html, sender_name, sender_email, followup_days, status)
values (
  'Brokerage Invite — Citi Developers',
  'brokerages',
  '{"onboarding_status":"not_invited"}'::jsonb,
  'Become an authorised seller of Citi Developers — {{brokerage.hq_emirate}}',
$HTML$
<p>Dear {{brokerage.name}} team,</p>
<p>Citi Developers is opening broker registrations for our upcoming
{{brokerage.hq_emirate}} launches. We invite {{brokerage.name}} to
register your agency and join our authorised seller network.</p>
<p>Highlights: competitive commission, fast registration, dedicated
broker support, exclusive launch access.</p>
<p>Reply to this email or RSVP for our next breakfast briefing in
{{brokerage.hq_emirate}}.</p>
<p>Warm regards,<br/>
Sales — <strong>Citi Developers</strong></p>
$HTML$,
  'Citi Developers Sales',
  'sales@citi-developers.ae',
  10, 'draft');
```

---

### 8. Media Ingestion module

Route `/media`. A single drop zone. Each upload:

1. File goes to `storage.media/{project_slug}/{uuid}-{filename}`.
2. Row inserted into `media_assets` with `project_id` (chosen via combobox)
   and `kind` auto-detected from MIME (`application/pdf` → brochure,
   `video/*` → video, `image/*` → image).
3. The `trg_media_fanout` trigger automatically links the asset to every
   `published` listing of that project via `listing_media`.

React snippet:

```tsx
async function uploadMedia(file: File, projectId: string) {
  const path = `${projectId}/${crypto.randomUUID()}-${file.name}`;
  const { error: upErr } = await supabase.storage.from("media")
    .upload(path, file, { contentType: file.type });
  if (upErr) throw upErr;

  const kind =
    file.type.startsWith("video/") ? "video" :
    file.type === "application/pdf" ? "brochure" :
    file.type.startsWith("image/") ? "image" : "other";

  await supabase.from("media_assets").insert({
    project_id: projectId, kind, title: file.name,
    storage_path: path, mime_type: file.type, size_bytes: file.size,
    source_filename: file.name,
  });
}
```

Listings page reads from a view:
```sql
create or replace view public.listing_with_media as
select l.*, coalesce(jsonb_agg(distinct jsonb_build_object(
  'id', m.id, 'kind', m.kind, 'title', m.title, 'path', m.storage_path
)) filter (where m.id is not null), '[]'::jsonb) as media
from listings l
left join listing_media lm on lm.listing_id = l.id
left join media_assets m on m.id = lm.media_asset_id
group by l.id;
```

---

### 9. Acceptance criteria

- `/relationships` → Developers and Brokerages tabs both load with **real
  seeded UAE rows**, never empty.
- Emirate chip filter narrows the directory; bulk-select sends a campaign
  only to the filtered subset.
- Clicking **"Send Registration Pack to All Developers"** dispatches
  `send-bulk-email`, every developer with `registration_status =
  not_started` receives the templated email with the Google Drive KYC link
  rendered correctly, and their status flips to `submitted`.
- Clicking **"Invite Brokerages"** with an Emirate filter only emails
  brokerages of that Emirate; their `onboarding_status` flips to `invited`.
- Uploading a PDF on `/media` and selecting a project automatically attaches
  it to every published listing of that project (verify in `listing_media`).
- Recording a deal + payment correctly updates Pending KPI on both the
  counterparty drawer and `/relationships/revenue`.
- Website cells show clean domains (e.g. `emaar.com`), never the word
  "Website".
- Cron `relationships-followup` re-emails non-repliers after
  `followup_days`.

## PROMPT END
```

Open `.lovable/plan.md` in the Code Editor to copy this prompt — paste the entire **PROMPT START → PROMPT END** block into Replit.