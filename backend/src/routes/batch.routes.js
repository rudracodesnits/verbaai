const { Router } = require('express');
const BatchController = require('../controllers/batch.controller');
const apiKeyMiddleware = require('../middlewares/apiKey.middleware');
const rateLimiterMiddleware = require('../middlewares/rateLimiter.middleware');
const authMiddleware = require('../middlewares/auth.middleware');

const router = Router();

// Developer API Batch Endpoints (Uses API Key + rate limiter)
router.post('/:endpoint', apiKeyMiddleware, rateLimiterMiddleware, BatchController.enqueueJob);
router.get('/status/:jobId', apiKeyMiddleware, BatchController.getJobStatus);

// Frontend Dashboard Batch Endpoints (Uses User JWT token)
router.get('/jobs', authMiddleware, BatchController.listUserJobs);
router.get('/jobs/:jobId', authMiddleware, BatchController.getUserJobDetails);

module.exports = router;
