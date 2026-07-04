const { Queue } = require('bullmq');
const { env } = require('./env');

const connection = {
  // Parsing the connection URL directly for BullMQ compat
  // Note: maxRetriesPerRequest MUST be null for BullMQ compatibility
  url: env.REDIS_URL,
  maxRetriesPerRequest: null,
};

const batchQueue = new Queue('batch-processing', { connection });

module.exports = { batchQueue, connection };
