-- Create an RPC to search for similar classifieds using the image embeddings.
-- This mirrors the 'search_similar_cases' function to support the Unified Catalogue visual search.

CREATE OR REPLACE FUNCTION search_similar_classifieds(
  query_embedding vector(1536),
  since timestamptz,
  limit_count int DEFAULT 20
)
RETURNS TABLE(listing_id uuid, score float)
LANGUAGE sql
AS $$
  SELECT
    ci.listing_id,
    (1 - (ci.embedding <=> query_embedding))::float AS score
  FROM classified_images ci
  JOIN classified_listings cl ON cl.id = ci.listing_id
  WHERE ci.embedding IS NOT NULL
    AND cl.is_active = true
    AND cl.is_dog = true
    AND cl.scraped_at > since
  ORDER BY ci.embedding <=> query_embedding
  LIMIT limit_count;
$$;
