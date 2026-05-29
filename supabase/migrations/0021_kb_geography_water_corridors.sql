-- WP19: Geolocated specificity — pull water-point coordinates + terrain corridors
-- out of the WP13 "deferred" bucket. Lets guidance say "300m NE there is a creek
-- where it would shelter" instead of the municipality-grained "galgos do X".
--
-- water_points: [{ name, type, lat, lng }]
--   type: river | estuary | reservoir | fountain | spring | borehole_cluster | ria
-- terrain_corridors: [{ name, type, description }]
--   type: ribeira | valley | ridge | coastline | sapal

alter table kb_geography
  add column if not exists water_points     jsonb not null default '[]'::jsonb,
  add column if not exists terrain_corridors jsonb not null default '[]'::jsonb;

comment on column kb_geography.water_points is
  'WP19: known water sources with coords — dogs anchor to water, esp. days 2+ in summer';
comment on column kb_geography.terrain_corridors is
  'WP19: movement/shelter corridors (ribeiras, valleys, ridgelines, coastline)';

-- Seed representative water points + corridors for municipalities with known water.
-- Coordinates are approximate anchors (not exhaustive); the PI agent enriches over time.
update kb_geography set water_points = '[
  {"name":"Estuário do Arade","type":"estuary","lat":37.134,"lng":-8.535},
  {"name":"Ribeira de Boina","type":"river","lat":37.165,"lng":-8.545}
]'::jsonb, terrain_corridors = '[
  {"name":"Vale do Arade","type":"ribeira","description":"corredor fluvial N-S, vegetação riparia, água e sombra"}
]'::jsonb where municipality = 'Portimão';

update kb_geography set water_points = '[
  {"name":"Rio Guadiana","type":"river","lat":37.194,"lng":-7.415},
  {"name":"Sapal de Castro Marim","type":"sapal","lat":37.218,"lng":-7.440}
]'::jsonb, terrain_corridors = '[
  {"name":"Margem do Guadiana","type":"coastline","description":"frente fluvial permanente, água todo o ano"}
]'::jsonb where municipality = 'Vila Real de Santo António';

update kb_geography set water_points = '[
  {"name":"Sapal de Castro Marim","type":"sapal","lat":37.221,"lng":-7.444},
  {"name":"Rio Guadiana","type":"river","lat":37.210,"lng":-7.420}
]'::jsonb where municipality = 'Castro Marim';

update kb_geography set water_points = '[
  {"name":"Rio Arade / Barragem","type":"reservoir","lat":37.211,"lng":-8.432},
  {"name":"Ribeira de Odelóuca","type":"river","lat":37.270,"lng":-8.380}
]'::jsonb, terrain_corridors = '[
  {"name":"Vale do Arade","type":"ribeira","description":"corredor com água sazonal-permanente e cobertura densa"}
]'::jsonb where municipality = 'Silves';

update kb_geography set water_points = '[
  {"name":"Ribeira de Bensafrim","type":"river","lat":37.108,"lng":-8.672}
]'::jsonb where municipality = 'Lagos';

update kb_geography set water_points = '[
  {"name":"Fonte Benémola","type":"spring","lat":37.181,"lng":-8.010},
  {"name":"Ribeira de Algibre","type":"river","lat":37.150,"lng":-8.060}
]'::jsonb, terrain_corridors = '[
  {"name":"Ribeira de Algibre","type":"ribeira","description":"linha de água do barrocal, nascentes e poços"}
]'::jsonb where municipality = 'Loulé';

update kb_geography set water_points = '[
  {"name":"Caldas de Monchique (nascentes)","type":"spring","lat":37.284,"lng":-8.555},
  {"name":"Ribeiras da Serra","type":"river","lat":37.317,"lng":-8.557}
]'::jsonb, terrain_corridors = '[
  {"name":"Linhas de água da serra","type":"valley","description":"vales húmidos com nascentes; movimento descendente provável"}
]'::jsonb where municipality = 'Monchique';

update kb_geography set water_points = '[
  {"name":"Ria Formosa","type":"ria","lat":37.012,"lng":-7.930}
]'::jsonb, terrain_corridors = '[
  {"name":"Frente da Ria Formosa","type":"coastline","description":"sapal e canais; água salobra, alimento abundante"}
]'::jsonb where municipality = 'Faro';

update kb_geography set water_points = '[
  {"name":"Ria Formosa (Olhão)","type":"ria","lat":37.025,"lng":-7.840}
]'::jsonb where municipality = 'Olhão';

update kb_geography set water_points = '[
  {"name":"Rio Gilão","type":"river","lat":37.127,"lng":-7.648}
]'::jsonb, terrain_corridors = '[
  {"name":"Vale do Gilão","type":"ribeira","description":"corredor fluvial atravessa a cidade para o barrocal"}
]'::jsonb where municipality = 'Tavira';
