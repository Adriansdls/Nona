-- cases
CREATE TABLE cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  type case_type NOT NULL,
  status case_status NOT NULL DEFAULT 'ativo',
  sensitivity case_sensitivity NOT NULL DEFAULT 'publico',
  dog_name text,
  breed text NOT NULL,
  sex dog_sex NOT NULL,
  neutered boolean,
  size dog_size NOT NULL,
  primary_color text NOT NULL,
  secondary_color text,
  distinctive_marks text[] DEFAULT '{}',
  age_estimate text,
  has_chip boolean,
  chip_last_3 text,
  chip_number_encrypted text,
  last_seen_at timestamptz NOT NULL,
  last_seen_municipality text NOT NULL,
  last_seen_zone_approx text NOT NULL,
  last_seen_coords_approx point,
  description text NOT NULL,
  context text,
  suspected_theft boolean DEFAULT false,
  reporter_name text NOT NULL,
  reporter_email text NOT NULL,
  reporter_phone text,
  reporter_contact_public text,
  admin_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  resolved_at timestamptz,
  created_by uuid REFERENCES auth.users ON DELETE SET NULL
);

-- case_images
CREATE TABLE case_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES cases ON DELETE CASCADE,
  storage_path_public text,
  storage_path_original text,
  public_url text,
  is_primary boolean DEFAULT false,
  image_type image_type NOT NULL DEFAULT 'referencia',
  embedding vector(768),
  quality_score real,
  processed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- sightings
CREATE TABLE sightings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES cases ON DELETE CASCADE,
  seen_at timestamptz NOT NULL,
  municipality text NOT NULL,
  zone_approx text NOT NULL,
  coords_approx point,
  direction text,
  was_moving boolean,
  seemed_injured boolean,
  description text,
  reporter_contact text,
  credibility sighting_credibility NOT NULL DEFAULT 'pendente',
  reviewed_by uuid REFERENCES auth.users ON DELETE SET NULL,
  reviewed_at timestamptz,
  is_public boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- sighting_images
CREATE TABLE sighting_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sighting_id uuid NOT NULL REFERENCES sightings ON DELETE CASCADE,
  storage_path_public text NOT NULL,
  public_url text NOT NULL,
  embedding vector(768)
);

-- visual_matches
CREATE TABLE visual_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_a_id uuid NOT NULL REFERENCES cases,
  case_b_id uuid NOT NULL REFERENCES cases,
  similarity_score real NOT NULL,
  status match_status NOT NULL DEFAULT 'pendente',
  reviewed_by uuid REFERENCES auth.users ON DELETE SET NULL,
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- user_profiles (extends auth.users)
CREATE TABLE user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  role user_role NOT NULL,
  organization_name text,
  municipality text,
  verified boolean NOT NULL DEFAULT false,
  locale_preference locale_preference NOT NULL DEFAULT 'pt',
  created_at timestamptz DEFAULT now()
);

-- posters
CREATE TABLE posters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES cases ON DELETE CASCADE,
  storage_path text NOT NULL,
  public_url text NOT NULL,
  poster_type poster_type NOT NULL,
  language poster_language NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Auto-update updated_at on cases
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER cases_updated_at
  BEFORE UPDATE ON cases
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
