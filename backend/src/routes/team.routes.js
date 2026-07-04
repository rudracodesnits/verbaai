const { Router } = require('express');
const TeamController = require('../controllers/team.controller');
const authMiddleware = require('../middlewares/auth.middleware');

const router = Router();

router.use(authMiddleware);

router.post('/', TeamController.createTeam);
router.get('/', TeamController.getTeams);
router.post('/:teamId/invite', TeamController.inviteMember);

module.exports = router;
