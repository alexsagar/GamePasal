const Redis = require('ioredis');

// Default to localhost:6379 if REDIS_URL is not provided
const redisClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

redisClient.on('connect', () => {
    console.log('✅ Connected to Redis successfully');
});

redisClient.on('error', (err) => {
    console.error('❌ Redis Connection Error:', err);
});

module.exports = redisClient;
