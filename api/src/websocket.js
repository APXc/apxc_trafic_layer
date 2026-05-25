import { createRedisSubscriber } from './services/redis.js';

export async function setupWebsocket(io) {
  io.on('connection', (socket) => {
    socket.on('simulation:join', ({ jobId }) => socket.join(`job:${jobId}`));
    socket.on('simulation:leave', ({ jobId }) => socket.leave(`job:${jobId}`));
  });

  const subscriber = createRedisSubscriber();
  await subscriber.psubscribe('simulation:progress:*');

  subscriber.on('pmessage', (_pattern, channel, message) => {
    const jobId = channel.split(':').pop();
    try {
      io.to(`job:${jobId}`).emit(channel, JSON.parse(message));
    } catch {
      io.to(`job:${jobId}`).emit(channel, { status: 'error', progress: 0 });
    }
  });
}
