import { Router } from 'express';
import {
    getAllEntries,
    searchAnswer,
    addEntry,
    updateEntry,
    deleteEntry
} from '../controllers/knowledgeBaseController';

const router = Router();

// Knowledge base management
router.get('/', getAllEntries);
router.post('/search', searchAnswer);
router.post('/', addEntry);
router.patch('/:id', updateEntry);
router.delete('/:id', deleteEntry);

export default router;
