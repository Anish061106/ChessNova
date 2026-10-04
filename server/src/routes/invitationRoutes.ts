import { Router } from 'express';
import { invitationController } from '../controllers/invitationController.js';
import { authenticateUser } from '../middleware/authenticate.js';

export const invitationRouter = Router();

// All invitation endpoints require authentication
invitationRouter.use(authenticateUser);

invitationRouter.post('/', (req, res, next) => invitationController.createInvitation(req, res, next));
invitationRouter.get('/', (req, res, next) => invitationController.getInvitations(req, res, next));
invitationRouter.post('/:id/accept', (req, res, next) => invitationController.acceptInvitation(req, res, next));
invitationRouter.post('/:id/decline', (req, res, next) => invitationController.declineInvitation(req, res, next));
invitationRouter.post('/:id/cancel', (req, res, next) => invitationController.cancelInvitation(req, res, next));
