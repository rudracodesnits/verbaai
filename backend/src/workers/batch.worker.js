const { Worker } = require('bullmq');
const { prisma } = require('../config/database');
const { connection } = require('../config/queue');
const AIService = require('../services/ai.service');
const UsageService = require('../services/usage.service');
const logger = require('../utils/logger');

const worker = new Worker('batch-processing', async (job) => {
  const { jobId, endpoint, texts, options, userId, apiKeyId } = job.data;
  
  try {
    logger.info(`Started processing batch job ${jobId} with ${texts.length} items`);

    // Update job status to PROCESSING
    await prisma.batchJob.update({
      where: { id: jobId },
      data: { status: 'PROCESSING' }
    });

    let processedCount = 0;

    for (let i = 0; i < texts.length; i++) {
      const text = texts[i];
      const startTime = Date.now();
      
      // Create batch item database record as PENDING
      const itemRecord = await prisma.batchJobItem.create({
        data: {
          jobId,
          status: 'PENDING',
          inputText: text,
        }
      });

      try {
        let result;
        // Process text depending on endpoint
        switch (endpoint) {
          case 'summarize':
            result = await AIService.summarize(text, options);
            break;
          case 'sentiment':
            result = await AIService.sentiment(text, options);
            break;
          case 'toxicity':
            result = await AIService.toxicity(text, options);
            break;
          case 'keywords':
            result = await AIService.keywords(text, options);
            break;
          default:
            throw new Error(`Unsupported batch endpoint: ${endpoint}`);
        }

        const latency = Date.now() - startTime;
        
        // Update item status to COMPLETED
        await prisma.batchJobItem.update({
          where: { id: itemRecord.id },
          data: {
            status: 'COMPLETED',
            outputText: JSON.stringify(result),
            latency,
            tokensUsed: result.tokensUsed || 0
          }
        });

        // Log usage (fire and forget)
        await UsageService.log({
          userId,
          apiKeyId,
          endpoint,
          tokensUsed: result.tokensUsed || 0,
          cached: false,
          latency,
          error: false,
          statusCode: 200,
          inputText: text,
          outputText: JSON.stringify(result)
        });

      } catch (err) {
        logger.error(`Error processing batch item ${itemRecord.id}: ${err.message}`);
        const latency = Date.now() - startTime;
        
        // Update item status to FAILED
        await prisma.batchJobItem.update({
          where: { id: itemRecord.id },
          data: {
            status: 'FAILED',
            error: err.message || 'Unknown error',
            latency
          }
        });

        // Log failed usage (fire and forget)
        await UsageService.log({
          userId,
          apiKeyId,
          endpoint,
          tokensUsed: 0,
          cached: false,
          latency,
          error: true,
          statusCode: err.status || err.statusCode || 500,
          inputText: text,
          outputText: err.message || 'Unknown error'
        });
      }

      processedCount++;
      // Update processedItems count in db
      await prisma.batchJob.update({
        where: { id: jobId },
        data: { processedItems: processedCount }
      });
    }

    // Mark job as COMPLETED
    await prisma.batchJob.update({
      where: { id: jobId },
      data: { status: 'COMPLETED' }
    });
    
    logger.info(`Finished processing batch job ${jobId}`);

  } catch (globalError) {
    logger.error(`Global error in worker for job ${jobId}: ${globalError.message}`);
    await prisma.batchJob.update({
      where: { id: jobId },
      data: { status: 'FAILED' }
    });
  }
}, { connection });

worker.on('failed', (job, err) => {
  logger.error(`Batch Job failed completely in BullMQ queue: ${err.message}`);
});

module.exports = worker;
