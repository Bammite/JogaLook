-- ==============================================================================
-- MIGRATION : HISTORIQUE DES RECHERCHES VISITEURS (search_history)
-- ==============================================================================
-- Enregistre les recherches des visiteurs connectés et anonymes.
-- Le backend doit fournir user_id pour un utilisateur connecté et session_id
-- pour identifier une visite anonyme (cookie jl_sid / header x-session-id).
-- Exécutez ce script dans Supabase -> SQL Editor.
-- ==============================================================================

-- Le middleware trafficTracker utilise déjà cette colonne pour les visites.
ALTER TABLE IF EXISTS public.site_visits
    ADD COLUMN IF NOT EXISTS session_id TEXT;

CREATE TABLE IF NOT EXISTS public.search_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    session_id TEXT,
    search_type VARCHAR(40) NOT NULL DEFAULT 'PRODUCT_GLOBAL',
    query_text TEXT NOT NULL CHECK (length(btrim(query_text)) > 0),
    source_path TEXT,
    results_count INTEGER CHECK (results_count IS NULL OR results_count >= 0),
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Une recherche doit toujours pouvoir être rattachée à un utilisateur
    -- connecté ou à une session visiteur anonyme.
    CONSTRAINT search_history_actor_check CHECK (
        user_id IS NOT NULL OR NULLIF(btrim(session_id), '') IS NOT NULL
    ),
    CONSTRAINT search_history_type_check CHECK (
        search_type IN ('PRODUCT_GLOBAL', 'CATALOG', 'CATEGORY_GROUP', 'NEWS')
    )
);

-- Requêtes utiles pour l'historique utilisateur, la session anonyme et les stats.
CREATE INDEX IF NOT EXISTS idx_search_history_created_at
    ON public.search_history(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_search_history_user_id_created_at
    ON public.search_history(user_id, created_at DESC)
    WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_search_history_session_id_created_at
    ON public.search_history(session_id, created_at DESC)
    WHERE session_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_search_history_type_created_at
    ON public.search_history(search_type, created_at DESC);

-- Recherche insensible à la casse sur les expressions enregistrées.
CREATE INDEX IF NOT EXISTS idx_search_history_query_text_lower
    ON public.search_history(LOWER(query_text));

-- Les écritures et lectures applicatives passent par supabaseAdmin/service_role.
-- La consultation par les administrateurs est également autorisée depuis Supabase.
ALTER TABLE public.search_history ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'search_history'
          AND policyname = 'Service role full access on search history'
    ) THEN
        CREATE POLICY "Service role full access on search history"
            ON public.search_history
            FOR ALL TO service_role
            USING (true)
            WITH CHECK (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'search_history'
          AND policyname = 'Admins can view search history'
    ) THEN
        CREATE POLICY "Admins can view search history"
            ON public.search_history
            FOR SELECT
            USING (
                EXISTS (
                    SELECT 1
                    FROM public.users
                    WHERE users.id = auth.uid()
                      AND users.role IN ('ADMIN', 'SUPER_ADMIN')
                )
            );
    END IF;
END $$;
