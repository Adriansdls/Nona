-- Proactive classifieds scanner: tables for scraping dog-for-sale listings from
-- OLX.pt, CustoJusto.pt, etc., embedding their images with MegaDescriptor-L-384,
-- and matching against active perdido cases for potential theft detection.
--
-- Thresholds:
--   >= 0.70  →  high-confidence alert (owner + admin notification)
--   0.60-0.70  →  medium review (admin queue)
--   < 0.60  →  log only
--
-- Never auto-marks suspected_theft — always human review.

-- ============================================================
-- classified_sources: sites we monitor
-- ============================================================
CREATE TABLE classified_sources (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name            text NOT NULL UNIQUE,          -- 'olx_pt', 'custojusto_pt'
    display_name    text NOT NULL,                 -- 'OLX.pt', 'CustoJusto.pt'
    base_url        text NOT NULL,                 -- 'https://www.olx.pt/animais/caes/'
    scan_enabled    boolean NOT NULL DEFAULT true,
    last_scan_at    timestamptz,
    last_scan_status text,                         -- 'ok', 'blocked', 'error', 'no_listings'
    rate_limit_rpm  int NOT NULL DEFAULT 12,        -- max requests per minute
    next_scan_at    timestamptz,                   -- scheduler respects this over interval
    session_cookies jsonb DEFAULT '{}',            -- persisted cookies between scans
    config          jsonb DEFAULT '{}',            -- source-specific settings (regions, categories)
    created_at      timestamptz DEFAULT now()
);

-- ============================================================
-- classified_listings: raw scraped data (one row per listing)
-- ============================================================
CREATE TABLE classified_listings (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id       uuid NOT NULL REFERENCES classified_sources ON DELETE CASCADE,
    external_id     text NOT NULL,                  -- listing ID from source (dedup key)
    title           text,
    price           text,                            -- '€150', 'Negociável', etc.
    location_raw    text,                            -- free-text from listing (e.g., 'Faro, Algarve')
    municipality    text,                            -- normalized PT municipality or NULL
    description     text,
    listing_url     text NOT NULL,
    image_urls      text[] DEFAULT '{}',            -- CDN URLs extracted from listing
    posted_at       timestamptz,                    -- when listing was originally posted
    scraped_at      timestamptz NOT NULL DEFAULT now(),
    is_dog          boolean DEFAULT true,            -- classifier: title/description heuristics
    is_active       boolean DEFAULT true,            -- set false when listing disappears on re-scan
    scan_batch_id   uuid,
    breed_hint      text,                            -- extracted breed hint (e.g., 'Galgo', 'Yorkshire')
    size_hint        text,                            -- extracted size hint (e.g., 'pequeno', 'grande')
    color_hint       text,                            -- extracted color (e.g., 'branco', 'preto e castanho')

    UNIQUE(source_id, external_id)
);

CREATE INDEX idx_classified_listings_source ON classified_listings(source_id);
CREATE INDEX idx_classified_listings_scraped ON classified_listings(scraped_at DESC);
CREATE INDEX idx_classified_listings_municipality ON classified_listings(municipality) WHERE is_dog AND is_active;

-- ============================================================
-- classified_images: embeddings of listing images (mirrors case_images pattern)
-- ============================================================
CREATE TABLE classified_images (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id      uuid NOT NULL REFERENCES classified_listings ON DELETE CASCADE,
    image_url       text NOT NULL,                  -- original CDN URL
    storage_path    text,                            -- staged in case-images-original/classifieds/<batch>/
    embedding       vector(1536),
    quality_score   real,
    processed_at     timestamptz,
    created_at      timestamptz DEFAULT now()
);

CREATE INDEX idx_classified_images_listing ON classified_images(listing_id);

-- ============================================================
-- suspicious_matches: ML matches against active perdido cases (admin review queue)
-- ============================================================
CREATE TABLE suspicious_matches (
    id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    classified_listing_id   uuid NOT NULL REFERENCES classified_listings ON DELETE CASCADE,
    classified_image_id    uuid REFERENCES classified_images ON DELETE SET NULL,
    case_id                 uuid NOT NULL REFERENCES cases ON DELETE CASCADE,
    case_image_id           uuid REFERENCES case_images ON DELETE SET NULL,
    similarity_score        real NOT NULL,           -- cosine similarity from ML pipeline
    priority                text NOT NULL DEFAULT 'medium',  -- 'high' (>=0.70), 'medium' (0.60-0.70)
    status                  match_status NOT NULL DEFAULT 'pendente',
    reviewed_by             uuid REFERENCES auth.users ON DELETE SET NULL,
    reviewed_at             timestamptz,
    notes                   text,
    owner_alerted           boolean NOT NULL DEFAULT false,
    owner_alerted_at        timestamptz,
    created_at              timestamptz DEFAULT now()
);

CREATE INDEX idx_suspicious_matches_status ON suspicious_matches(status, created_at DESC);
CREATE INDEX idx_suspicious_matches_case ON suspicious_matches(case_id);
CREATE INDEX idx_suspicious_matches_listing ON suspicious_matches(classified_listing_id);
CREATE INDEX idx_suspicious_matches_priority ON suspicious_matches(priority, created_at DESC) WHERE status = 'pendente';

-- ============================================================
-- RLS: staff-only access to scanner tables
-- ============================================================
ALTER TABLE classified_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE classified_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE classified_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE suspicious_matches ENABLE ROW LEVEL SECURITY;

-- Service role has full access (bot + scanner use this)
CREATE POLICY "Service role can do everything on classified_sources"
    ON classified_sources FOR ALL
    TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role can do everything on classified_listings"
    ON classified_listings FOR ALL
    TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role can do everything on classified_images"
    ON classified_images FOR ALL
    TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role can do everything on suspicious_matches"
    ON suspicious_matches FOR ALL
    TO service_role USING (true) WITH CHECK (true);

-- Authenticated users can read suspicious_matches (for admin UI)
CREATE POLICY "Authenticated users can read suspicious_matches"
    ON suspicious_matches FOR SELECT
    TO authenticated USING (true);

-- Authenticated users can update suspicious_matches (review actions)
CREATE POLICY "Authenticated users can update suspicious_matches"
    ON suspicious_matches FOR UPDATE
    TO authenticated USING (true);

-- Authenticated users can read classified_listings (for admin UI)
CREATE POLICY "Authenticated users can read classified_listings"
    ON classified_listings FOR SELECT
    TO authenticated USING (true);

-- Authenticated users can read classified_sources (for admin UI)
CREATE POLICY "Authenticated users can read classified_sources"
    ON classified_sources FOR SELECT
    TO authenticated USING (true);

-- ============================================================
-- RPC: search_similar_cases_for_classified
-- Same as search_similar_cases but WITHOUT excluding a case (classified listings
-- are not cases — we want to match against ALL active perdido cases).
-- ============================================================
CREATE OR REPLACE FUNCTION search_similar_cases_for_classified(
    query_embedding vector(1536),
    municipality text DEFAULT NULL,
    limit_count int DEFAULT 20
)
RETURNS TABLE(case_id uuid, score float)
LANGUAGE sql
AS $$
    SELECT
        ci.case_id,
        (1 - (ci.embedding <=> query_embedding))::float AS score
    FROM case_images ci
    JOIN cases c ON c.id = ci.case_id
    WHERE ci.embedding IS NOT NULL
        AND c.status = 'ativo'
        AND c.type = 'perdido'
        AND (municipality IS NULL OR c.last_seen_municipality ILIKE '%' || municipality || '%')
    ORDER BY ci.embedding <=> query_embedding
    LIMIT limit_count;
$$;

-- ============================================================
-- Seed: default sources
-- ============================================================
INSERT INTO classified_sources (name, display_name, base_url, rate_limit_rpm, config) VALUES
    ('olx_pt', 'OLX.pt', 'https://www.olx.pt/animais/caes/', 12,
     '{"regions": ["faro", "portimao", "lagos", "albufeira", "loule", "olhao", "silves", "lagoa", "tavira", "vila-real-de-santo-antonio", "vilamoura", "quarteira"], "max_pages": 10}'),
    ('custojusto_pt', 'CustoJusto.pt', 'https://www.custojusto.pt/portugal/animais/animais-domesticos/caes', 8,
     '{"regions": ["faro"], "max_pages": 8}')
ON CONFLICT (name) DO NOTHING;