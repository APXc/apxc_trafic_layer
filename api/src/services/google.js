import axios from 'axios';
import { cacheGet, cacheSet } from './redis.js';

const GOOGLE_ROADS_URL = 'https://roads.googleapis.com/v1/snapToRoads';
const GOOGLE_DISTANCE_URL = 'https://maps.googleapis.com/maps/api/distancematrix/json';

export async function snapToRoads(path) {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) return null;

  const cacheKey = `google:roads:${path}`;
  const cached = await cacheGet(cacheKey);
  if (cached) return cached;

  const { data } = await axios.get(GOOGLE_ROADS_URL, {
    params: { path, interpolate: true, key: apiKey }
  });

  await cacheSet(cacheKey, data, 60 * 60 * 24 * 30);
  return data;
}

export async function getDistanceMatrix(origins, destinations) {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) return null;

  const cacheKey = `google:distance:${origins}:${destinations}`;
  const cached = await cacheGet(cacheKey);
  if (cached) return cached;

  const { data } = await axios.get(GOOGLE_DISTANCE_URL, {
    params: { origins, destinations, key: apiKey }
  });

  await cacheSet(cacheKey, data, 60 * 60 * 24);
  return data;
}
