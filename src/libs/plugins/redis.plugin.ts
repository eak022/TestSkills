import Redis from 'ioredis'

export class RedisClient {
  private redis: Redis

  constructor (_connectionString?: string) {
    this.redis = _connectionString ? new Redis(_connectionString) : new Redis()

    this.redis.on('error', (error) => {
      console.error(`[Redis] Error:`, error)
    })

    this.redis.on('close', () => {
      console.error(`[Redis] Connection closed.`)
    })
  }

  async set (key: string, value: string, expiresAt: number) {
    return this.redis.set(key, value, 'EX', expiresAt)
  }

  async get (key: string) {
    return this.redis.get(key)
  }

  async del (key: string) {
    return this.redis.del(key)
  }

  async forgetAll () {
    return this.redis.flushall()
  }
}

const redisConnectionString = process.env.REDIS_URL || Bun.env.REDIS_URL
export const redisPlugin = redisConnectionString ? new Redis(redisConnectionString) : new Redis()
