import { Router } from 'express';
import { puzzleController } from '../controllers/puzzleController.js';
import { authenticateUser, optionalAuth } from '../middleware/authenticate.js';

const router = Router();

router.get('/', optionalAuth, (req, res, next) => puzzleController.listPuzzles(req, res, next));
router.get('/random', optionalAuth, (req, res, next) => puzzleController.getRandom(req, res, next));
router.get('/history', authenticateUser, (req, res, next) => puzzleController.getHistory(req, res, next));
router.get('/:id', optionalAuth, (req, res, next) => puzzleController.getById(req, res, next));
router.post('/:id/validate-move', optionalAuth, (req, res, next) => puzzleController.validateMove(req, res, next));
router.post('/:id/attempt', optionalAuth, (req, res, next) => puzzleController.submitAttempt(req, res, next));

export default router;
