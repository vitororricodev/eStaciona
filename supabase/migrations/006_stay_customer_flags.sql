-- eStaciona 1.0.11
-- Snapshot operacional da entrada: TAG e mensalista.
alter table public.stays
  add column if not exists has_parking_tag boolean not null default false,
  add column if not exists is_monthly boolean not null default false;

create index if not exists stays_org_monthly_open_idx
  on public.stays(organization_id, is_monthly, status);
