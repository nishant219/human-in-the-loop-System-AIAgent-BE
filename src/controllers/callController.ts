import { Request, Response } from 'express';
import { CallSession } from '../models/CallSession';
import { HelpRequest } from '../models/HelpRequest';

/**
 * POST /api/calls/start
 * Initialize a new call session
 */
export const startCall = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sessionId, roomName, callerPhone, callerName } = req.body;
    
    if (!sessionId || !roomName || !callerPhone) {
      res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: sessionId, roomName, callerPhone' 
      });
      return;
    }
    
    const callSession = await CallSession.create({
      sessionId,
      roomName,
      callerPhone,
      callerName,
      startedAt: new Date(),
      status: 'active'
    });
    
    res.status(201).json({ 
      success: true, 
      data: callSession 
    });
    
  } catch (error: any) {
    console.error('Error starting call:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * POST /api/calls/:sessionId/end
 * End a call session
 */
export const endCall = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sessionId } = req.params;
    const { transcript } = req.body;
    
    const callSession = await CallSession.findOne({ sessionId });
    
    if (!callSession) {
      res.status(404).json({ 
        success: false, 
        error: 'Call session not found' 
      });
      return;
    }
    
    if (callSession.status !== 'active') {
      res.status(400).json({ 
        success: false, 
        error: 'Call session already ended' 
      });
      return;
    }
    
    const endTime = new Date();
    const duration = Math.floor((endTime.getTime() - callSession.startedAt.getTime()) / 1000);
    
    callSession.endedAt = endTime;
    callSession.duration = duration;
    callSession.status = 'completed';
    
    if (transcript) {
      callSession.transcript = transcript;
    }
    
    await callSession.save();
    
    res.json({ 
      success: true, 
      message: 'Call ended successfully',
      data: callSession 
    });
    
  } catch (error: any) {
    console.error('Error ending call:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * GET /api/calls/:sessionId
 * Get call session details
 */
export const getCallSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sessionId } = req.params;
    
    const callSession = await CallSession.findOne({ sessionId })
      .populate('helpRequestIds')
      .lean();
    
    if (!callSession) {
      res.status(404).json({ 
        success: false, 
        error: 'Call session not found' 
      });
      return;
    }
    
    res.json({ success: true, data: callSession });
    
  } catch (error: any) {
    console.error('Error fetching call session:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * GET /api/calls
 * Get all call sessions with filters
 */
export const getAllCalls = async (req: Request, res: Response): Promise<void> => {
  try {
    const { 
      status, 
      callerPhone, 
      limit = '50', 
      skip = '0' 
    } = req.query;
    
    const query: any = {};
    
    if (status) {
      query.status = status;
    }
    
    if (callerPhone) {
      query.callerPhone = callerPhone;
    }
    
    const limitNum = parseInt(limit as string);
    const skipNum = parseInt(skip as string);
    
    const [calls, total] = await Promise.all([
      CallSession.find(query)
        .sort({ startedAt: -1 })
        .limit(limitNum)
        .skip(skipNum)
        .lean(),
      CallSession.countDocuments(query)
    ]);
    
    res.json({ 
      success: true, 
      data: {
        calls,
        total,
        limit: limitNum,
        skip: skipNum
      }
    });
    
  } catch (error: any) {
    console.error('Error fetching calls:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * GET /api/calls/stats
 * Get call statistics
 */
export const getCallStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const [
      totalCalls,
      activeCalls,
      completedCalls,
      failedCalls,
      avgDuration,
      totalHelpRequests
    ] = await Promise.all([
      CallSession.countDocuments(),
      CallSession.countDocuments({ status: 'active' }),
      CallSession.countDocuments({ status: 'completed' }),
      CallSession.countDocuments({ status: 'failed' }),
      CallSession.aggregate([
        { $match: { duration: { $exists: true } } },
        { $group: { _id: null, avg: { $avg: '$duration' } } }
      ]),
      HelpRequest.countDocuments()
    ]);
    
    const stats = {
      totalCalls,
      activeCalls,
      completedCalls,
      failedCalls,
      averageDuration: avgDuration[0]?.avg || 0,
      totalHelpRequests,
      helpRequestRate: totalCalls > 0 
        ? ((totalHelpRequests / totalCalls) * 100).toFixed(2) 
        : 0
    };
    
    res.json({ success: true, data: stats });
    
  } catch (error: any) {
    console.error('Error fetching call stats:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * PATCH /api/calls/:sessionId/status
 * Update call status (for error handling)
 */
export const updateCallStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sessionId } = req.params;
    const { status } = req.body;
    
    if (!['active', 'completed', 'failed'].includes(status)) {
      res.status(400).json({ 
        success: false, 
        error: 'Invalid status. Must be: active, completed, or failed' 
      });
      return;
    }
    
    const callSession = await CallSession.findOneAndUpdate(
      { sessionId },
      { status },
      { new: true }
    ).lean();
    
    if (!callSession) {
      res.status(404).json({ 
        success: false, 
        error: 'Call session not found' 
      });
      return;
    }
    
    res.json({ 
      success: true, 
      message: 'Call status updated',
      data: callSession 
    });
    
  } catch (error: any) {
    console.error('Error updating call status:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};