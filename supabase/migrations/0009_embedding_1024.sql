-- Update embedding vectors from 768-dim (DINOv2-base) to 1024-dim (MegaDescriptor-L)
-- Safe: no real embeddings exist in prod yet (ML service not deployed)
ALTER TABLE case_images ALTER COLUMN embedding TYPE vector(1024);
ALTER TABLE sighting_images ALTER COLUMN embedding TYPE vector(1024);

-- Recreate similarity search function with new dimension
CREATE OR REPLACE FUNCTION search_similar_cases(
  query_embedding vector(1024),
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
