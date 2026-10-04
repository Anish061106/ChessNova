import { Router } from 'express';
import { friendController } from '../controllers/friendController.js';
import { authenticateUser } from '../middleware/authenticate.js';

const router = Router();

// All friends endpoints require authentication
router.use(authenticateUser);

router.get('/search', (req, res, next) => friendController.search(req, res, next));
router.get('/', (req, res, next) => friendController.list(req, res, next));
router.get('/requests', (req, res, next) => friendController.requests(req, res, next));
router.post('/requests', (req, res, next) => friendController.send(req, res, next));
router.post('/requests/:id/accept', (req, res, next) => friendController.accept(req, res, next));
router.post('/requests/:id/decline', (req, res, next) => friendController.decline(req, res, next));
router.delete('/:id', (req, res, next) => friendController.remove(req, res, next));
router.post('/block', (req, res, next) => friendController.block(req, res, next));

export default router;
