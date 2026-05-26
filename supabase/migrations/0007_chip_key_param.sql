-- Replace current_setting() approach with explicit key parameter.
-- Supabase cloud does not allow ALTER DATABASE on free plan,
-- so we pass the encryption key from the application at call time.

CREATE OR REPLACE FUNCTION encrypt_chip(plain_text text, encryption_key text)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
  SELECT encode(
    pgp_sym_encrypt(plain_text, encryption_key),
    'base64'
  );
$$;

CREATE OR REPLACE FUNCTION get_chip_number(p_case_id uuid, encryption_key text)
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
    encryption_key
  );
END;
$$;
