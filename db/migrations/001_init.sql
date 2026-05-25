CREATE EXTENSION IF NOT EXISTS postgis;
CREATE TABLE IF NOT EXISTS municipalities (id SERIAL PRIMARY KEY, name VARCHAR, lat FLOAT, lon FLOAT, osm_place_name VARCHAR, created_at TIMESTAMP DEFAULT NOW());
CREATE TABLE IF NOT EXISTS scenarios (id SERIAL PRIMARY KEY, municipality_id INT REFERENCES municipalities(id), name VARCHAR, description TEXT, config JSONB, created_at TIMESTAMP DEFAULT NOW());
CREATE TABLE IF NOT EXISTS simulation_results (id SERIAL PRIMARY KEY, scenario_id INT REFERENCES scenarios(id), weather_config JSONB, time_range JSONB, metrics JSONB, edge_flows JSONB, created_at TIMESTAMP DEFAULT NOW());
