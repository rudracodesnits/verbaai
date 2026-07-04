const { Router } = require('express');
const authRoutes = require('./auth.routes');
const aiRoutes = require('./ai.routes');
const batchRoutes = require('./batch.routes');
const teamRoutes = require('./team.routes');
const alertRoutes = require('./alert.routes');

const router = Router();

// Mount route groups
router.use('/auth', authRoutes);
router.use('/api', aiRoutes);
router.use('/api/batch', batchRoutes);
router.use('/auth/batch', batchRoutes);
router.use('/api/teams', teamRoutes);
router.use('/api/alerts', alertRoutes);

module.exports = router;
