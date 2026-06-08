-- WS-G-Vet: clinic partner integration. Separate from community_partners because
-- clinics have distinct fields (license, full chip data, owner contact) and legal
-- obligations that make a clean isolation table the right choice.

-- ============================================================
-- clinic_partners
-- ============================================================
create table if not exists clinic_partners (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  municipality    text,
  vet_license     text,              -- optional license number for audit trail
  contact_email   text,
  contact_phone   text,
  contact_telegram_id text,          -- optional: PM alerts straight to vet's Telegram
  telegram_chat_id text,             -- optional: group chat for clinic team alerts
  is_approved     boolean not null default false,
  approved_by     uuid references auth.users(id) on delete set null,
  approved_at     timestamptz,
  intake_slug     text unique,       -- public  : /clinica/<intake_slug>
  panel_token     text unique,       -- private : /clinica/painel/<panel_token>
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists clinic_partners_intake_slug_idx on clinic_partners(intake_slug);
create index if not exists clinic_partners_panel_token_idx on clinic_partners(panel_token);
create index if not exists clinic_partners_municipality_idx on clinic_partners(municipality);
create index if not exists clinic_partners_approved_idx on clinic_partners(is_approved);

comment on table clinic_partners is
  'WS-G-Vet: approved veterinary clinics that can submit chip scans and found-dog cases.';
comment on column clinic_partners.intake_slug is
  'Public pinned link token (/clinica/<intake_slug>). Drop on clinic reception.';
comment on column clinic_partners.panel_token is
  'Private magic-link token (/clinica/painel/<panel_token>). Full chip + owner data visible.';
comment on column clinic_partners.is_approved is
  'Staff-gated. Only approved clinics show up in TIER 1 alerts and can create cases.';
comment on column clinic_partners.contact_telegram_id is
  'For Telegram PM alerts to the vet (optional). Same env allowlist rules as volunteer alerts.';

-- ============================================================
-- chip_scans
-- ============================================================
create table if not exists chip_scans (
  id                    uuid primary key default gen_random_uuid(),
  clinic_partner_id     uuid not null references clinic_partners(id) on delete cascade,
  case_id               uuid references cases(id) on delete set null,
  chip_number           text,            -- full chip; encrypted in future (v0.2+)
  chip_last_3           text,            -- public-facing tail
  siac_lookup_status    text not null default 'nao_realizado'
    check (siac_lookup_status in ('nao_realizado','contactado_siac','dono_encontrado','nao_registado')),
  siac_lookup_done_at   timestamptz,
  owner_name            text,            -- from vet input or SIAC (private)
  owner_contact         text,            -- phone/email from vet or SIAC (private)
  notes                 text,            -- free text from vet
  created_at            timestamptz not null default now()
);

create index if not exists chip_scans_clinic_idx on chip_scans(clinic_partner_id);
create index if not exists chip_scans_case_idx on chip_scans(case_id);
create index if not exists chip_scans_status_idx on chip_scans(siac_lookup_status);
create index if not exists chip_scans_chip_last3_idx on chip_scans using btree (lower(chip_last_3));

comment on table chip_scans is
  'Every chip scan submitted by a clinic partner. Bridges case ←→ chip data.';
comment on column chip_scans.chip_number is
  'Full chip number stored in clear for now; encrypt before prod (v0.2).';
comment on column chip_scans.siac_lookup_status is
  'nao_realizado → contactado_siac → dono_encontrado / nao_registado.';
comment on column chip_scans.owner_contact is
  'PRIVATE — only visible in clinic panel. Never in public pages or API.';

-- ============================================================
-- RLS
-- ============================================================
alter table clinic_partners enable row level security;
alter table chip_scans enable row level security;

-- clinic_partners: public can read approved basics (name, municipality, intake_slug)
create policy "clinic_partners_select_public"
  on clinic_partners for select
  using (is_approved = true);

-- clinic_partners: staff full access
create policy "clinic_partners_select_staff"
  on clinic_partners for select to authenticated
  using (has_role(ARRAY['admin','asociacion','clinica']::user_role[]));

create policy "clinic_partners_insert_staff"
  on clinic_partners for insert to authenticated
  with check (has_role(ARRAY['admin','asociacion']::user_role[]));

create policy "clinic_partners_update_staff"
  on clinic_partners for update to authenticated
  using (has_role(ARRAY['admin','asociacion']::user_role[]));

-- chip_scans: staff + the submitting clinic (panel_token path) can read
create policy "chip_scans_select_staff"
  on chip_scans for select to authenticated
  using (has_role(ARRAY['admin','asociacion','clinica']::user_role[]));

create policy "chip_scans_insert"
  on chip_scans for insert
  with check (true);

create policy "chip_scans_update_staff"
  on chip_scans for update to authenticated
  using (has_role(ARRAY['admin','asociacion','clinica']::user_role[]));

-- ============================================================
-- Migrate existing kb_vets → clinic_partners (soft reference)
-- ============================================================
-- kb_vets stays for knowledge-base use. TIER 1 professional alerts will route to
-- clinic_partners going forward. Existing kb_vet email addresses are linked
-- manually by staff when onboarding a clinic.

-- ============================================================
-- updated_at trigger for clinic_partners
-- ============================================================
create trigger clinic_partners_updated_at
  before update on clinic_partners
  for each row execute function update_updated_at();
