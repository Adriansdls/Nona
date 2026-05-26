-- Enable RLS on all tables
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE sightings ENABLE ROW LEVEL SECURITY;
ALTER TABLE sighting_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE visual_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE posters ENABLE ROW LEVEL SECURITY;

-- Helper: check if caller has verified role
CREATE OR REPLACE FUNCTION has_role(required_roles user_role[])
RETURNS boolean LANGUAGE sql SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid()
      AND role = ANY(required_roles)
      AND verified = true
  );
$$;

-- CASES
CREATE POLICY "cases_select_public"
  ON cases FOR SELECT
  USING (status = 'ativo' AND sensitivity = 'publico');

CREATE POLICY "cases_select_staff"
  ON cases FOR SELECT TO authenticated
  USING (has_role(ARRAY['admin','asociacion','clinica','voluntario']::user_role[]) OR created_by = auth.uid());

CREATE POLICY "cases_insert"
  ON cases FOR INSERT
  WITH CHECK (true);

CREATE POLICY "cases_update_admin"
  ON cases FOR UPDATE TO authenticated
  USING (has_role(ARRAY['admin','asociacion']::user_role[]));

-- CASE IMAGES
CREATE POLICY "case_images_select_public"
  ON case_images FOR SELECT
  USING (storage_path_original IS NULL OR storage_path_public IS NOT NULL);

CREATE POLICY "case_images_select_staff"
  ON case_images FOR SELECT TO authenticated
  USING (has_role(ARRAY['admin','asociacion','clinica','voluntario']::user_role[]));

CREATE POLICY "case_images_insert"
  ON case_images FOR INSERT
  WITH CHECK (true);

CREATE POLICY "case_images_update"
  ON case_images FOR UPDATE
  USING (true);

-- SIGHTINGS
CREATE POLICY "sightings_insert_anon"
  ON sightings FOR INSERT TO anon
  WITH CHECK (is_public = false);

CREATE POLICY "sightings_insert_auth"
  ON sightings FOR INSERT TO authenticated
  WITH CHECK (is_public = false);

CREATE POLICY "sightings_select_public"
  ON sightings FOR SELECT
  USING (is_public = true);

CREATE POLICY "sightings_select_staff"
  ON sightings FOR SELECT TO authenticated
  USING (has_role(ARRAY['admin','asociacion','clinica','voluntario']::user_role[]));

CREATE POLICY "sightings_update_staff"
  ON sightings FOR UPDATE TO authenticated
  USING (has_role(ARRAY['admin','asociacion']::user_role[]));

-- SIGHTING IMAGES
CREATE POLICY "sighting_images_select_public"
  ON sighting_images FOR SELECT USING (true);

CREATE POLICY "sighting_images_insert"
  ON sighting_images FOR INSERT WITH CHECK (true);

-- VISUAL MATCHES
CREATE POLICY "visual_matches_select_staff"
  ON visual_matches FOR SELECT TO authenticated
  USING (has_role(ARRAY['admin','asociacion','clinica','voluntario']::user_role[]));

CREATE POLICY "visual_matches_insert"
  ON visual_matches FOR INSERT WITH CHECK (true);

CREATE POLICY "visual_matches_update_staff"
  ON visual_matches FOR UPDATE TO authenticated
  USING (has_role(ARRAY['admin','asociacion']::user_role[]));

-- USER PROFILES
CREATE POLICY "user_profiles_select_self"
  ON user_profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR has_role(ARRAY['admin']::user_role[]));

CREATE POLICY "user_profiles_insert"
  ON user_profiles FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid() OR has_role(ARRAY['admin']::user_role[]));

CREATE POLICY "user_profiles_update_admin"
  ON user_profiles FOR UPDATE TO authenticated
  USING (has_role(ARRAY['admin']::user_role[]));

-- POSTERS
CREATE POLICY "posters_select_public"
  ON posters FOR SELECT USING (true);

CREATE POLICY "posters_insert"
  ON posters FOR INSERT WITH CHECK (true);
