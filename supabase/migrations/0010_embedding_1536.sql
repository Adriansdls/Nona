-- MegaDescriptor-L-384 outputs 1536-dim (not 1024 as expected from ViT-L/14).
-- Correcting vector dimension from 1024 → 1536.
ALTER TABLE case_images ALTER COLUMN embedding TYPE vector(1536);
ALTER TABLE sighting_images ALTER COLUMN embedding TYPE vector(1536);

CREATE OR REPLACE FUNCTION search_similar_cases(
  query_embedding vector(1536),
  exclude_case_id uuid,
  since timestamptz,
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
    AND ci.case_id != exclude_case_id
    AND c.status = 'ativo'
    AND c.created_at > since
  ORDER BY ci.embedding <=> query_embedding
  LIMIT limit_count;
$$;
