import { useEffect, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import api from '../services/api';

const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export function useSimulation() {
  const socketRef = useRef(null);
  const [jobId, setJobId] = useState(null);
  const [simulationState, setSimulationState] = useState({
    status: 'idle',
    progress: 0,
    currentHour: 0,
    trafficData: [],
    metrics: null,
    baselineMetrics: null
  });

  const [isPlaying, setIsPlaying] = useState(false);
  const [hour, setHour] = useState(0);
  const [speed, setSpeed] = useState(1);

  useEffect(() => {
    socketRef.current = io(apiBase, { transports: ['websocket'] });
    return () => socketRef.current?.disconnect();
  }, []);

  useEffect(() => {
    if (!socketRef.current || !jobId) return;

    const event = `simulation:progress:${jobId}`;
    const handler = (payload) => {
      setSimulationState((prev) => ({ ...prev, ...payload }));
      if (typeof payload.currentHour === 'number') setHour(payload.currentHour);
    };

    socketRef.current.emit('simulation:join', { jobId });
    socketRef.current.on(event, handler);

    return () => {
      socketRef.current?.off(event, handler);
      socketRef.current?.emit('simulation:leave', { jobId });
    };
  }, [jobId]);

  const startSimulation = async (scenarioId, weatherConfig) => {
    const { data } = await api.post('/simulation', { scenarioId, weatherConfig });
    setSimulationState((prev) => ({ ...prev, status: 'queued', progress: 0 }));
    setJobId(data.jobId);
    return data.jobId;
  };

  const controls = useMemo(
    () => ({
      isPlaying,
      hour,
      speed,
      setSpeed,
      setHour,
      play: () => setIsPlaying(true),
      pause: () => setIsPlaying(false),
      reset: () => {
        setIsPlaying(false);
        setHour(0);
      }
    }),
    [hour, isPlaying, speed]
  );

  return { simulationState, startSimulation, controls };
}
