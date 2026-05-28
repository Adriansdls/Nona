-- WP13: Territorial Intelligence GIS Layer
-- Static municipality-keyed knowledge base: zone type, A22 barrier model,
-- terrain permeability, water sources, fire risk, food/density profile.
-- PI agent queries this at case init to enrich build_context_block().

CREATE TABLE IF NOT EXISTS kb_geography (
  municipality           TEXT PRIMARY KEY,
  zone_type              TEXT NOT NULL,
    -- litoral | barrocal | serra_caldeirae | serra_monchique | sapal | litoral_fluvial
  a22_side               TEXT NOT NULL DEFAULT 'none',
    -- north | south | bisected | none
    -- bisected = A22 passes through the municipality
    -- north    = municipality entirely north of A22
    -- south    = municipality entirely south of A22
  terrain_permeability   TEXT NOT NULL,
    -- open     = garrigue/litoral (search radius accurate)
    -- moderate = barrocal/mixed scrub (~85% of calculated radius)
    -- dense    = maquis/eucaliptal/pinheiro (~65%, disorientation high)
  water_source_type      TEXT NOT NULL,
    -- permanent      = Guadiana, lower Arade estuary
    -- seasonal_only  = standard rivers (dry June-Oct)
    -- borehole_zone  = barrocal (~20,000 private boreholes, hidden water layer)
    -- mixed          = permanent + seasonal
  food_availability      TEXT NOT NULL,   -- high | medium | low
  human_density          TEXT NOT NULL,   -- urban | tourist | rural | isolated
  tourist_peak_months    INT[] NOT NULL DEFAULT '{}',
  goatherd_zone          BOOLEAN NOT NULL DEFAULT FALSE,
    -- natural food attractor; PI should contact shepherds directly
  fire_risk_band         TEXT NOT NULL,
    -- extreme | high | moderate | low (PFAP 2023 static baseline; IPMA overrides at runtime)
  search_radius_modifier FLOAT NOT NULL DEFAULT 1.0,
    -- multiplier applied to WP9 base radius
  created_at             TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE kb_geography IS
  'WP13: Territorial intelligence per municipality — zone type, A22 barrier model, '
  'terrain permeability, water sources, fire risk, food/density profile.';

-- Seed all 16 Algarve municipalities
INSERT INTO kb_geography (
  municipality, zone_type, a22_side, terrain_permeability, water_source_type,
  food_availability, human_density, tourist_peak_months, goatherd_zone,
  fire_risk_band, search_radius_modifier
) VALUES
  ('Lagos',                     'barrocal',        'south',    'moderate', 'borehole_zone',  'medium', 'tourist',  '{6,7,8,9}', false, 'high',     0.90),
  ('Portimão',                  'litoral',         'south',    'open',     'permanent',      'high',   'tourist',  '{6,7,8,9}', false, 'moderate', 1.00),
  ('Lagoa',                     'litoral',         'south',    'moderate', 'borehole_zone',  'high',   'tourist',  '{6,7,8,9}', false, 'moderate', 0.95),
  ('Silves',                    'barrocal',        'bisected', 'moderate', 'borehole_zone',  'medium', 'rural',    '{7,8}',     false, 'high',     0.90),
  ('Albufeira',                 'litoral',         'bisected', 'open',     'seasonal_only',  'high',   'tourist',  '{6,7,8,9}', false, 'moderate', 1.00),
  ('Loulé',                     'barrocal',        'bisected', 'moderate', 'mixed',          'medium', 'rural',    '{7,8}',     true,  'high',     0.90),
  ('Faro',                      'litoral',         'south',    'open',     'seasonal_only',  'high',   'urban',    '{6,7,8,9}', false, 'low',      1.00),
  ('Olhão',                     'sapal',           'south',    'open',     'permanent',      'medium', 'rural',    '{7,8}',     false, 'low',      1.05),
  ('Tavira',                    'barrocal',        'south',    'moderate', 'seasonal_only',  'medium', 'rural',    '{7,8}',     false, 'moderate', 0.90),
  ('Vila Real de Santo António', 'litoral_fluvial', 'south',   'open',     'permanent',      'medium', 'tourist',  '{7,8}',     false, 'low',      1.05),
  ('Castro Marim',              'sapal',           'south',    'open',     'permanent',      'low',    'rural',    '{}',        false, 'low',      1.10),
  ('Alcoutim',                  'serra_caldeirae', 'north',    'dense',    'seasonal_only',  'low',    'isolated', '{}',        true,  'extreme',  0.65),
  ('São Brás de Alportel',      'barrocal',        'south',    'moderate', 'borehole_zone',  'medium', 'rural',    '{}',        false, 'moderate', 0.90),
  ('Monchique',                 'serra_monchique', 'north',    'dense',    'seasonal_only',  'low',    'rural',    '{}',        true,  'extreme',  0.65),
  ('Aljezur',                   'litoral',         'north',    'dense',    'seasonal_only',  'low',    'rural',    '{7,8}',     false, 'high',     0.75),
  ('Vila do Bispo',             'litoral',         'north',    'open',     'seasonal_only',  'low',    'rural',    '{7,8}',     false, 'moderate', 1.00)
ON CONFLICT (municipality) DO NOTHING;
