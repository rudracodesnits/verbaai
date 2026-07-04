const { batchQueue } = require('../config/queue');
const { prisma } = require('../config/database');
const { BadRequestError, NotFoundError, ForbiddenError } = require('../utils/errors');
const logger = require('../utils/logger');

const BatchController = {
  /**
   * POST /api/batch/:endpoint
   * Enqueue a new batch processing job
   */
  async enqueueJob(req, res, next) {
    try {
      const { endpoint } = req.params;
      const { texts, temperature, maxTokens } = req.body;

      // 1. Validation
      const supportedEndpoints = ['summarize', 'sentiment', 'toxicity', 'keywords'];
      if (!supportedEndpoints.includes(endpoint)) {
        throw new BadRequestError(`Unsupported batch endpoint: ${endpoint}`);
      }

      if (!texts || !Array.isArray(texts)) {
        throw new BadRequestError('texts must be an array of strings.');
      }

      if (texts.length === 0 || texts.length > 100) {
        throw new BadRequestError('texts array must contain between 1 and 100 elements.');
      }

      for (let i = 0; i < texts.length; i++) {
        if (typeof texts[i] !== 'string') {
          throw new BadRequestError(`Element at index ${i} must be a string.`);
        }
      }

      const options = {};
      if (temperature !== undefined) options.temperature = temperature;
      if (maxTokens !== undefined) options.maxTokens = maxTokens;

      // 2. Create Job in database
      const job = await prisma.batchJob.create({
        data: {
          userId: req.apiUser.id,
          apiKeyId: req.apiKeyRecord.id,
          endpoint,
          status: 'PENDING',
          totalItems: texts.length,
        }
      });

      // 3. Enqueue to BullMQ
      await batchQueue.add('batch-processing-job', {
        jobId: job.id,
        endpoint,
        texts,
        options,
        userId: req.apiUser.id,
        apiKeyId: req.apiKeyRecord.id,
      });

      res.status(202).json({
        success: true,
        data: {
          jobId: job.id,
          status: 'PENDING',
          totalItems: texts.length,
        },
        message: 'Batch job enqueued successfully.',
      });

    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/batch/status/:jobId
   * Check status of a batch job via API Key
   */
  async getJobStatus(req, res, next) {
    try {
      const { jobId } = req.params;

      const job = await prisma.batchJob.findUnique({
        where: { id: jobId },
        include: {
          items: {
            select: {
              id: true,
              status: true,
              inputText: true,
              outputText: true,
              error: true,
              latency: true,
              tokensUsed: true,
            }
          }
        }
      });

      if (!job) {
        throw new NotFoundError(`Batch job ${jobId} not found.`);
      }

      // Verify ownership
      if (job.userId !== req.apiUser.id) {
        throw new ForbiddenError('You do not have permission to view this batch job.');
      }

      res.json({
        success: true,
        data: job,
      });

    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /auth/batch/jobs
   * List all batch jobs for a user (via Dashboard JWT)
   */
  async listUserJobs(req, res, next) {
    try {
      const userId = req.user.userId;
      const { page = 1, limit = 10 } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);

      const [jobs, total] = await Promise.all([
        prisma.batchJob.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          skip,
          take: parseInt(limit),
          include: {
            apiKey: {
              select: {
                name: true,
                prefix: true,
              }
            }
          }
        }),
        prisma.batchJob.count({ where: { userId } })
      ]);

      res.json({
        success: true,
        data: {
          jobs,
          pagination: {
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(total / parseInt(limit)),
          }
        }
      });

    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /auth/batch/jobs/:jobId
   * Get detailed batch job logs (via Dashboard JWT)
   */
  async getUserJobDetails(req, res, next) {
    try {
      const { jobId } = req.params;
      const userId = req.user.userId;

      const job = await prisma.batchJob.findUnique({
        where: { id: jobId },
        include: {
          apiKey: {
            select: {
              name: true,
              prefix: true,
            }
          },
          items: {
            orderBy: { id: 'asc' }
          }
        }
      });

      if (!job) {
        throw new NotFoundError(`Batch job ${jobId} not found.`);
      }

      if (job.userId !== userId) {
        throw new ForbiddenError('You do not have permission to view this batch job.');
      }

      res.json({
        success: true,
        data: job,
      });

    } catch (error) {
      next(error);
    }
  }
};

module.exports = BatchController;
