import { REDIS_CONNECTION } from '../constants';
import { createClient } from 'redis';
import 'dotenv/config';
import { decrypt } from '@helpers/cipher';

const IS_CRD_PLAIN = process.env.IS_CRD_PLAIN == 'true' ? true : false
const REDIS_HOST = IS_CRD_PLAIN ? process.env.REDIS_HOST : decrypt(process.env.REDIS_HOST)
const REDIS_PORT = IS_CRD_PLAIN ? process.env.REDIS_PORT : decrypt(process.env.REDIS_PORT)


const REDIS_URL = `redis://${REDIS_HOST}:${+(REDIS_PORT)}`;

const createRedisClient = async () => {
  const regularClient = createClient({ url: REDIS_URL });
  const subscribeClient = createClient({ url: REDIS_URL });

  console.log(`Redis url : `, REDIS_URL);

  const connectClient = async (client, clientType) => {
    try {
      await client.connect();
      console.info(`${clientType} Redis Client connected successfully.`);
    } catch (err) {
      console.error(`Initial ${clientType} Redis Client connection failed`, err);
      await reconnectClient(client, clientType);
    }
  };

  const reconnectClient = async (client, clientType) => {
    console.info(`Attempting to reconnect ${clientType} Redis Client...`);
    if (client.isOpen) {
      try {
        await client.quit();
      } catch (err) {
        console.error(`Error while closing ${clientType} Redis Client during reconnect`, err);
      }
    }

    const attemptReconnect = async () => {
      console.info(`Reconnecting ${clientType} Redis Client...`);
      try {
        await client.connect();
        console.info(`Reconnected ${clientType} Redis Client successfully.`);
      } catch (reconnectErr) {
        console.error(`Reconnection of ${clientType} Redis Client failed`, reconnectErr);
        setTimeout(attemptReconnect, 5000); // Retry after 5 seconds
      }
    };

    setTimeout(attemptReconnect, 5000); // Initial retry after 5 seconds
  };

  regularClient.on('error', async (err) => {
    console.error('Regular Redis Client Error', err);
    await reconnectClient(regularClient, 'Regular');
  });

  subscribeClient.on('error', async (err) => {
    console.error('Subscription Redis Client Error', err);
    await reconnectClient(subscribeClient, 'Subscription');
  });

  await connectClient(regularClient, 'Regular');
  await connectClient(subscribeClient, 'Subscription');

  const performOperationWithReconnect = async (client, operation) => {
    try {
      return await operation();
    } catch (err) {
      if (err.code === 'ECONNREFUSED' || err.code === 'NR_CLOSED') {
        console.error('Redis Client connection closed during operation, reconnecting...', err);
        await reconnectClient(client, 'Regular');
        return await operation();
      } else {
        throw err;
      }
    }
  };

  return {
    getRegularClient: () => regularClient,
    getSubscribeClient: () => subscribeClient,
    get: async (key) => await performOperationWithReconnect(regularClient, () => regularClient.get(key)),
    set: async (key, value) => await performOperationWithReconnect(regularClient, () => regularClient.set(key, value)),
    keys: async (key) => await performOperationWithReconnect(regularClient, () => regularClient.keys(key)),
    setEx: async (key, time, value) => await performOperationWithReconnect(regularClient, () => regularClient.setEx(key, time, value)),
    del: async (key) => await performOperationWithReconnect(regularClient, () => regularClient.del(key)),
    scan: async (cursor = 0, pattern = '*', count = 100) =>
      performOperationWithReconnect(regularClient, () => regularClient.scan(cursor, { MATCH: pattern, COUNT: count })),
    sadd: async (key, value) => await performOperationWithReconnect(regularClient, () => regularClient.sAdd(key, value)),
    srem: async (key, value) => await performOperationWithReconnect(regularClient, () => regularClient.sRem(key, value)),
    smembers: async (key) => await performOperationWithReconnect(regularClient, () => regularClient.sMembers(key)),
    sismember: async (key, value) => await performOperationWithReconnect(regularClient, () => regularClient.sIsMember(key, value)),
    publish: async (key, value) => await performOperationWithReconnect(subscribeClient, () => subscribeClient.publish(key, value))
  };
};

export const redisProviders = [
  {
    name: REDIS_CONNECTION,
    provide: REDIS_CONNECTION,
    useFactory: createRedisClient,
  },
];
