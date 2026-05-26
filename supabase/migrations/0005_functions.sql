-- Chip encryption
-- search_path includes extensions so pgp_sym_encrypt is found on Supabase cloud
CREATE OR REPLACE FUNCTION encrypt_chip(plain_text text)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
  SELECT encode(
    pgp_sym_encrypt(plain_text, current_setting('app.chip_encryption_key', true)),
    'base64'
  );
$$;

-- Chip decryption (role-gated)
CREATE OR REPLACE FUNCTION get_chip_number(p_case_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_role user_role;
  v_encrypted text;
BEGIN
  SELECT role INTO v_role
  FROM user_profiles
  WHERE id = auth.uid() AND verified = true;

  IF v_role NOT IN ('admin', 'asociacion') THEN
    RAISE EXCEPTION 'Insufficient permissions to view chip number';
  END IF;

  SELECT chip_number_encrypted INTO v_encrypted
  FROM cases WHERE id = p_case_id;

  IF v_encrypted IS NULL THEN RETURN NULL; END IF;

  RETURN pgp_sym_decrypt(
    decode(v_encrypted, 'base64'),
    current_setting('app.chip_encryption_key', true)
  );
END;
$$;

-- Visual similarity search using pgvector
CREATE OR REPLACE FUNCTION search_similar_cases(
  query_embedding vector(768),
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

-- Stats for landing page
CREATE OR REPLACE FUNCTION get_public_stats()
RETURNS json
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT json_build_object(
    'active_cases', (SELECT COUNT(*) FROM cases WHERE status = 'ativo' AND sensitivity = 'publico'),
    'resolved_cases', (SELECT COUNT(*) FROM cases WHERE status = 'resolvido'),
    'total_sightings', (SELECT COUNT(*) FROM sightings WHERE is_public = true)
  );
$$;
