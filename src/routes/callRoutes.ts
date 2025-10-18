import { Router } from 'express';
import {
  startCall,
  endCall,
  getCallSession,
  getAllCalls,
  getCallStats,
  updateCallStatus
} from '../controllers/callController';

const router = Router();

// Call session management
router.post('/start', startCall);
router.post('/:sessionId/end', endCall);
router.get('/stats', getCallStats);
router.get('/:sessionId', getCallSession);
router.get('/', getAllCalls);
router.patch('/:sessionId/status', updateCallStatus);

export default router;
