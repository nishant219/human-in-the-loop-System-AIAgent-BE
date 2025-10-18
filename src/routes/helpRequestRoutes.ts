import { Router } from 'express';
import {
  getPendingRequests,
  getHistory,
  getRequestById,
  resolveRequest,
  createRequest
} from '../controllers/helpRequestController';

const router = Router();

// Help request management
router.get('/pending', getPendingRequests);
router.get('/history', getHistory);
router.get('/:id', getRequestById);
router.post('/:id/resolve', resolveRequest);
router.post('/', createRequest);

export default router;
