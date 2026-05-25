import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

export const redis = new Redis(redisUrl, { maxRetriesPerRequest: null });

export async function cacheGet(key) {
  const value = await redis.get(key);
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

export async function cacheSet(key, value, ttlSeconds = 300) {
  const serialized = typeof value === 'string' ? value : JSON.stringify(value);
  await redis.set(key, serialized, 'EX', ttlSeconds);
}

export function createRedisSubscriber() {
  return new Redis(redisUrl, { maxRetriesPerRequest: null });
}
