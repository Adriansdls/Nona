-- WS4 + WS3: agent intelligence layer.
-- research_chunks: RAG corpus over the research vault (text-embedding-3-small, 1536-dim,
--   same pgvector infra as case_images). Lets the PI agent retrieve + cite real science
--   for hard/cold cases instead of relying only on the prompt-embedded summary.
-- case_outcomes: the learning substrate (WP14). One row per resolved case; populates as
--   real cases close. recall_similar_outcomes reads it to surface what worked locally.

-- ── WS4: research RAG ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS research_chunks (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id     text NOT NULL,                 -- the research/notes/<id>.md filename stem
  chunk_index int  NOT NULL,
  chunk_text  text NOT NULL,
  embedding   vector(1536),
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (note_id, chunk_index)
);

CREATE INDEX IF NOT EXISTS research_chunks_embedding_idx
  ON research_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

CREATE OR REPLACE FUNCTION match_research_chunks(
  query_embedding vector(1536),
  limit_count int DEFAULT 5
)
RETURNS TABLE(note_id text, chunk_text text, score float)
LANGUAGE sql
AS $$
  SELECT rc.note_id, rc.chunk_text,
         (1 - (rc.embedding <=> query_embedding))::float AS score
  FROM research_chunks rc
  WHERE rc.embedding IS NOT NULL
  ORDER BY rc.embedding <=> query_embedding
  LIMIT limit_count;
$$;

-- ── WS3: outcome learning substrate (WP14) ──────────────────────────────────
CREATE TABLE IF NOT EXISTS case_outcomes (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id           uuid NOT NULL REFERENCES cases ON DELETE CASCADE,
  breed_category    text,
  municipality      text,
  zone              text,
  phase_at_recovery text,
  days_to_recovery  numeric(6,1),
  actions_taken     jsonb,          -- the case_agent_events actions that preceded recovery
  sighting_count    int,
  recovered         boolean NOT NULL DEFAULT true,
  created_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (case_id)
);

CREATE INDEX IF NOT EXISTS case_outcomes_lookup_idx
  ON case_outcomes(breed_category, municipality);

COMMENT ON TABLE research_chunks IS 'WS4: RAG corpus over research/notes for agent citation (1536-dim).';
COMMENT ON TABLE case_outcomes IS 'WS3/WP14: per-resolved-case learning substrate; fills as real cases close.';
