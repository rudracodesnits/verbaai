const { Router } = require('express');
const authRoutes = require('./auth.routes');
const aiRoutes = require('./ai.routes');

const router = Router();

// Mount route groups
router.use('/auth', authRoutes);
router.use('/api', aiRoutes);

module.exports = router;
