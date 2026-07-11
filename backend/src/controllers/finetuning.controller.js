const FineTuningService = require('../services/finetuning.service');

const FineTuningController = {
  /**
   * POST /api/finetuning/jobs
   */
  async createJob(req, res, next) {
    try {
      const { baseModel, datasetContent, datasetName } = req.body;
      const job = await FineTuningService.createJob(
        req.user.userId,
        baseModel || 'gpt-4o-mini',
        datasetContent,
        datasetName || 'untitled_dataset.jsonl'
      );

      res.status(201).json({
        success: true,
        data: job,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/finetuning/jobs
   */
  async getJobs(req, res, next) {
    try {
      const jobs = await FineTuningService.getJobs(req.user.userId);
      res.json({
        success: true,
        data: jobs,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/finetuning/jobs/:id
   */
  async getJobStatus(req, res, next) {
    try {
      const { id } = req.params;
      const job = await FineTuningService.getJobStatus(req.user.userId, id);
      res.json({
        success: true,
        data: job,
      });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = FineTuningController;
