-- Signalements de contenu : produits aujourd'hui, mais extensible aux boutiques,
-- avis, actualités ou tout autre contenu demain.
create table if not exists public.content_reports (
  id uuid primary key default gen_random_uuid(),
  content_type text not null default 'product',
  content_reference text,
  product_id uuid references public.products(id) on delete set null,
  product_name text,
  reason text not null check (reason in (
    'INAPPROPRIATE_CONTENT',
    'COPYRIGHT_INFRINGEMENT',
    'COUNTERFEIT_OR_TRADEMARK',
    'MISLEADING_OR_FRAUDULENT',
    'PRIVACY_OR_PERSONAL_DATA',
    'OTHER'
  )),
  reporter_contact text,
  description text,
  status text not null default 'PENDING' check (status in ('PENDING', 'UNDER_REVIEW', 'RESOLVED', 'REJECTED')),
  reviewed_at timestamptz,
  reviewed_by uuid,
  resolution_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint content_reports_description_length check (char_length(coalesce(description, '')) <= 4000),
  constraint content_reports_contact_length check (char_length(coalesce(reporter_contact, '')) <= 255)
);

create index if not exists content_reports_status_created_at_idx
  on public.content_reports (status, created_at desc);

create index if not exists content_reports_product_id_idx
  on public.content_reports (product_id);

-- La création et la consultation se font via l'API serveur (clé service Supabase).
-- Aucune politique publique n'est volontairement ajoutée pour éviter qu'un visiteur
-- puisse lire les coordonnées ou les signalements d'autres personnes.
alter table public.content_reports enable row level security;

-- Optionnel : maintient updated_at à jour lors d'un traitement dans Supabase.
create or replace function public.set_content_reports_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists content_reports_set_updated_at on public.content_reports;
create trigger content_reports_set_updated_at
before update on public.content_reports
for each row execute function public.set_content_reports_updated_at();
