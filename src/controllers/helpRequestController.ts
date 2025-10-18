import { Request, Response } from 'express';
import { helpRequestService } from '../services/helpRequestService';

/**
 * GET /api/help-requests/pending
 */
export const getPendingRequests = async (req: Request, res: Response): Promise<void> => {
  try {
    const requests = await helpRequestService.getPendingRequests();
    res.json({ success: true, data: requests });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * GET /api/help-requests/history
 */
export const getHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, callerPhone, limit, skip } = req.query;
    
    const result = await helpRequestService.getRequestHistory({
      status: status as any,
      callerPhone: callerPhone as string,
      limit: limit ? parseInt(limit as string) : undefined,
      skip: skip ? parseInt(skip as string) : undefined
    });
    
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * GET /api/help-requests/:id
 */
export const getRequestById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const request = await helpRequestService.getRequestById(id);
    
    if (!request) {
      res.status(404).json({ success: false, error: 'Request not found' });
      return;
    }
    
    res.json({ success: true, data: request });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * POST /api/help-requests/:id/resolve
 */
export const resolveRequest = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { supervisorResponse, supervisorId } = req.body;
    
    if (!supervisorResponse || !supervisorId) {
      res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: supervisorResponse, supervisorId' 
      });
      return;
    }
    
    const updatedRequest = await helpRequestService.resolveRequest(
      id,
      supervisorResponse,
      supervisorId
    );
    
    res.json({ 
      success: true, 
      message: 'Request resolved successfully',
      data: updatedRequest 
    });
    
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * POST /api/help-requests
 * (Called by the AI agent)
 */
export const createRequest = async (req: Request, res: Response): Promise<void> => {
  try {
    const { question, callerPhone, callerName, sessionId, context } = req.body;
    
    if (!question || !callerPhone || !sessionId) {
      res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: question, callerPhone, sessionId' 
      });
      return;
    }
    
    const helpRequest = await helpRequestService.createHelpRequest({
      question,
      callerPhone,
      callerName,
      sessionId,
      context
    });
    
    res.status(201).json({ 
      success: true, 
      data: helpRequest 
    });
    
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};