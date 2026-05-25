import { Router } from 'express';
import axios from 'axios';

export function createWeatherRouter({ cacheGet, cacheSet }) {
  const router = Router();

  router.get('/', async (req, res, next) => {
    try {
      const { lat, lon } = req.query;
      if (!lat || !lon) {
        return res.status(400).json({ error: 'lat and lon are required' });
      }

      const cacheKey = `weather:${lat}:${lon}`;
      const cached = await cacheGet(cacheKey);
      if (cached) return res.json(cached);

      const { data } = await axios.get('https://api.open-meteo.com/v1/forecast', {
        params: {
          latitude: lat,
          longitude: lon,
          current: 'temperature_2m,weather_code',
          hourly: 'temperature_2m,weather_code',
          forecast_days: 2
        }
      });

      const payload = {
        current: {
          temperature: data.current?.temperature_2m,
          condition: data.current?.weather_code
        },
        forecast24h: (data.hourly?.time || []).slice(0, 24).map((time, idx) => ({
          time,
          temperature: data.hourly.temperature_2m[idx],
          condition: data.hourly.weather_code[idx]
        }))
      };

      await cacheSet(cacheKey, payload, 60 * 30);
      res.json(payload);
    } catch (error) {
      next(error);
    }
  });

  return router;
}
