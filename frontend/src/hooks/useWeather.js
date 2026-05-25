import { useCallback, useState } from 'react';
import api from '../services/api';

export function useWeather() {
  const [weather, setWeather] = useState({ current: null, forecast24h: [] });

  const loadWeather = useCallback(async (lat, lon) => {
    try {
      const { data } = await api.get(`/weather?lat=${lat}&lon=${lon}`);
      setWeather(data);
    } catch {
      setWeather({ current: null, forecast24h: [] });
    }
  }, []);

  return { weather, loadWeather };
}
