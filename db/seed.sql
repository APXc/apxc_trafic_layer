INSERT INTO municipalities (name, lat, lon, osm_place_name)
VALUES ('Bergamo', 45.6983, 9.6773, 'Bergamo, Italy')
ON CONFLICT DO NOTHING;

INSERT INTO scenarios (municipality_id, name, description, config)
VALUES (
  1,
  'Riduzione capacità asse centrale',
  'Scenario demo per test rapido',
  '{"type":"reduce_capacity","source":1,"target":2,"factor":0.85}'::jsonb
)
ON CONFLICT DO NOTHING;
