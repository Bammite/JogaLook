-- ==============================================================================
-- MIGRATION : TABLE DE SUIVI DU TRAFIC & DES VISITES (site_visits)
-- ==============================================================================
-- Exécutez ce script dans Supabase -> SQL Editor.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.site_visits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    path TEXT NOT NULL,
    method VARCHAR(10) DEFAULT 'GET',
    ip_address VARCHAR(45),
    user_agent TEXT,
    referer TEXT,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index de performance pour l'analyse analytique
CREATE INDEX IF NOT EXISTS idx_site_visits_created_at ON public.site_visits(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_site_visits_path ON public.site_visits(path);
CREATE INDEX IF NOT EXISTS idx_site_visits_user_id ON public.site_visits(user_id);

-- Activer Row Level Security (RLS)
ALTER TABLE public.site_visits ENABLE ROW LEVEL SECURITY;

-- Politique : les administrateurs peuvent consulter le trafic
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'site_visits' AND policyname = 'Admins can view site visits'
    ) THEN
        CREATE POLICY "Admins can view site visits" ON public.site_visits
            FOR SELECT USING (
                EXISTS (
                    SELECT 1 FROM public.users
                    WHERE users.id = auth.uid()
                    AND users.role IN ('ADMIN', 'SUPER_ADMIN')
                )
            );
    END IF;
END $$;
