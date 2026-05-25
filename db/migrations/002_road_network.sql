CREATE TABLE IF NOT EXISTS road_nodes (id BIGINT PRIMARY KEY, municipality_id INT REFERENCES municipalities(id), geom GEOMETRY(Point, 4326), osmid BIGINT);
CREATE TABLE IF NOT EXISTS road_edges (id SERIAL PRIMARY KEY, municipality_id INT REFERENCES municipalities(id), from_node BIGINT REFERENCES road_nodes(id), to_node BIGINT REFERENCES road_nodes(id), geom GEOMETRY(LineString, 4326), length_m FLOAT, speed_kph FLOAT, capacity INT, lanes INT, highway_type VARCHAR, osmid BIGINT);
CREATE INDEX IF NOT EXISTS road_nodes_geom_idx ON road_nodes USING GIST(geom);
CREATE INDEX IF NOT EXISTS road_edges_geom_idx ON road_edges USING GIST(geom);
