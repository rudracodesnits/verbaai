const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth.middleware');
const FineTuningController = require('../controllers/finetuning.controller');

router.post('/jobs', authMiddleware, FineTuningController.createJob);
router.get('/jobs', authMiddleware, FineTuningController.getJobs);
router.get('/jobs/:id', authMiddleware, FineTuningController.getJobStatus);

module.exports = router;
