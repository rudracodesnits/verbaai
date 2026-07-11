const fs = require('fs');
const path = require('path');
const { prisma } = require('../config/database');
const { env } = require('../config/env');
const { openai } = require('../config/openai');
const logger = require('../utils/logger');
const { BadRequestError } = require('../utils/errors');

const FineTuningService = {
  /**
   * Create a new fine-tuning job.
   */
  async createJob(userId, baseModel, datasetContent, datasetName) {
    // 1. Validate dataset format
    this.validateJSONL(datasetContent);

    // 2. Insert record in Database
    const dbJob = await prisma.fineTuningJob.create({
      data: {
        userId,
        baseModel,
        status: 'PENDING',
        datasetName,
      },
    });

    if (env.AI_PROVIDER === 'mock') {
      logger.info(`Starting mock fine-tuning job ${dbJob.id} for user ${userId}`);
      this._startMockJob(dbJob.id);
      return dbJob;
    }

    // 3. Real OpenAI Integration
    try {
      // Create temporary file
      const tempFilename = `dataset-${dbJob.id}-${Date.now()}.jsonl`;
      const tempPath = path.join(__dirname, '../../', tempFilename);
      fs.writeFileSync(tempPath, datasetContent);

      // Upload file to OpenAI
      logger.info(`Uploading dataset file to OpenAI for job ${dbJob.id}`);
      const fileUpload = await openai.files.create({
        file: fs.createReadStream(tempPath),
        purpose: 'fine-tune',
      });

      // Cleanup temp file
      fs.unlinkSync(tempPath);

      // Trigger OpenAI Fine-tuning job
      logger.info(`Creating OpenAI fine-tuning job using file ${fileUpload.id}`);
      const openaiJob = await openai.fineTuning.jobs.create({
        training_file: fileUpload.id,
        model: baseModel,
      });

      // Update DB record
      return await prisma.fineTuningJob.update({
        where: { id: dbJob.id },
        data: {
          openaiJobId: openaiJob.id,
          status: 'RUNNING',
        },
      });
    } catch (error) {
      logger.error(`Failed to initiate OpenAI fine-tuning: ${error.message}`);
      
      // Update DB record to failed
      await prisma.fineTuningJob.update({
        where: { id: dbJob.id },
        data: { status: 'FAILED' },
      });

      throw new BadRequestError(`Fine-tuning launch failed: ${error.message}`);
    }
  },

  /**
   * Get all fine-tuning jobs for a user.
   */
  async getJobs(userId) {
    return await prisma.fineTuningJob.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  },

  /**
   * Retrieve job status, syncing with OpenAI if running.
   */
  async getJobStatus(userId, jobId) {
    const job = await prisma.fineTuningJob.findFirst({
      where: { id: jobId, userId },
    });

    if (!job) {
      throw new Error('Fine-tuning job not found');
    }

    // If it's real OpenAI and running, fetch update
    if (env.AI_PROVIDER === 'openai' && job.openaiJobId && job.status === 'RUNNING') {
      try {
        const updatedJob = await openai.fineTuning.jobs.retrieve(job.openaiJobId);
        let newStatus = job.status;

        if (updatedJob.status === 'succeeded') {
          newStatus = 'SUCCEEDED';
        } else if (updatedJob.status === 'failed' || updatedJob.status === 'cancelled') {
          newStatus = 'FAILED';
        }

        return await prisma.fineTuningJob.update({
          where: { id: jobId },
          data: {
            status: newStatus,
            fineTunedModel: updatedJob.fine_tuned_model || null,
          },
        });
      } catch (error) {
        logger.error(`Failed to fetch status from OpenAI for job ${job.openaiJobId}: ${error.message}`);
      }
    }

    return job;
  },

  /**
   * Validate JSONL dataset structure.
   */
  validateJSONL(content) {
    if (!content || !content.trim()) {
      throw new BadRequestError('Dataset content cannot be empty.');
    }
    const lines = content.trim().split('\n');
    if (lines.length < 3) {
      throw new BadRequestError('Dataset must contain at least 3 training examples for testing.');
    }
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      try {
        const parsed = JSON.parse(line);
        if (!parsed.messages || !Array.isArray(parsed.messages)) {
          throw new BadRequestError(`Line ${i + 1} does not contain a "messages" array.`);
        }
      } catch (e) {
        throw new BadRequestError(`Line ${i + 1} is invalid JSON. Error: ${e.message}`);
      }
    }
  },

  /**
   * Mock worker background progression: PENDING -> RUNNING -> SUCCEEDED (30s total)
   */
  _startMockJob(jobId) {
    setTimeout(async () => {
      try {
        logger.info(`Mock job ${jobId} transitioning to RUNNING`);
        await prisma.fineTuningJob.update({
          where: { id: jobId },
          data: { status: 'RUNNING' },
        });

        setTimeout(async () => {
          try {
            const randomId = Math.random().toString(36).substring(2, 8);
            const modelName = `ft:gpt-4o-mini:verbaai:custom-model-${randomId}`;
            logger.info(`Mock job ${jobId} transitioning to SUCCEEDED. Generated model: ${modelName}`);

            await prisma.fineTuningJob.update({
              where: { id: jobId },
              data: {
                status: 'SUCCEEDED',
                fineTunedModel: modelName,
              },
            });
          } catch (err) {
            logger.error(`Error updating mock job ${jobId} to SUCCEEDED: ${err.message}`);
          }
        }, 15000); // 15s in RUNNING

      } catch (err) {
        logger.error(`Error updating mock job ${jobId} to RUNNING: ${err.message}`);
      }
    }, 10000); // 10s in PENDING
  },
};

module.exports = FineTuningService;
