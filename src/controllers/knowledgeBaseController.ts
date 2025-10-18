import { Request, Response } from 'express';
import { knowledgeBaseService } from '../services/knowledgeBaseService';

/**
 * GET /api/knowledge-base
 */
export const getAllEntries = async (req: Request, res: Response): Promise<void> => {
  try {
    const { category, isActive, limit } = req.query;
    
    const entries = await knowledgeBaseService.getAllEntries({
      category: category as string,
      isActive: isActive === 'true',
      limit: limit ? parseInt(limit as string) : undefined
    });
    
    res.status(200).json({ success: true, data: entries });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * POST /api/knowledge-base/search
 */
export const searchAnswer = async (req: Request, res: Response): Promise<void> => {
  try {
    const { question } = req.body;
    
    if (!question) {
      res.status(400).json({ success: false, error: 'Question is required' });
      return;
    }
    
    const answer = await knowledgeBaseService.searchAnswer(question);
    
    res.status(201).json({ 
      success: true, 
      data: answer,
      found: !!answer
    });
    
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * POST /api/knowledge-base
 */
export const addEntry = async (req: Request, res: Response): Promise<void> => {
  try {
    const { question, answer, category, tags, source, createdBy } = req.body;
    
    if (!question || !answer) {
      res.status(400).json({ 
        success: false, 
        error: 'Question and answer are required' 
      });
      return;
    }
    
    const entry = await knowledgeBaseService.addEntry({
      question,
      answer,
      category,
      tags,
      source,
      createdBy
    });
    
    res.status(201).json({ success: true, data: entry });
    
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * PATCH /api/knowledge-base/:id
 */
export const updateEntry = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const updatedEntry = await knowledgeBaseService.updateEntry(id, updates);
    
    if (!updatedEntry) {
      res.status(404).json({ success: false, error: 'Entry not found' });
      return;
    }
    
    res.json({ success: true, data: updatedEntry });
    
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * DELETE /api/knowledge-base/:id
 */
export const deleteEntry = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    await knowledgeBaseService.deactivateEntry(id);
    
    res.json({ success: true, message: 'Entry deactivated' });
    
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};