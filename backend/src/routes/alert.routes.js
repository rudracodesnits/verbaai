const { Router } = require('express');
const AlertController = require('../controllers/alert.controller');
const authMiddleware = require('../middlewares/auth.middleware');

const router = Router();

router.use(authMiddleware);

router.get('/', AlertController.getAlerts);
router.post('/mark-all-read', AlertController.markAllAlertsAsRead);
router.patch('/:id/read', AlertController.markAlertAsRead);

module.exports = router;
