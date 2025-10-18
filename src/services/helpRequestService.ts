import { HelpRequest, IHelpRequest, RequestStatus } from '../models/HelpRequest';
import { CallSession } from '../models/CallSession';
import { knowledgeBaseService } from './knowledgeBaseService';
import { notificationService } from './notificationService';

/**
 * Create a new help request when AI doesn't know the answer
 */
export async function createHelpRequest(data: {
    question: string;
    callerPhone: string;
    callerName?: string;
    sessionId: string;
    context?: string;
}): Promise<IHelpRequest> {
    try {
        // Set timeout for 30 minutes
        const timeoutAt = new Date(Date.now() + 30 * 60 * 1000);

        const helpRequest = await HelpRequest.create({
            question: data.question,
            callerPhone: data.callerPhone,
            callerName: data.callerName,
            sessionId: data.sessionId,
            timeoutAt,
            status: RequestStatus.PENDING,
            metadata: {
                attemptedKnowledgeSearch: true,
                context: data.context
            }
        });

        // Update call session
        await CallSession.findOneAndUpdate(
            { sessionId: data.sessionId },
            {
                $inc: { helpRequestsCount: 1 },
                $push: { helpRequestIds: helpRequest._id }
            }
        );

        // Notify supervisor (simulated via console/webhook)
        await notificationService.notifySupervisor(helpRequest);

        console.log(`✅ Help request created: ${helpRequest._id}`);
        return helpRequest;

    } catch (error) {
        console.error('Error creating help request:', error);
        throw new Error('Failed to create help request');
    }
}

/**
 * Get all pending requests for supervisor dashboard
 */
export async function getPendingRequests(): Promise<any[]> {
    try {
        return await HelpRequest.find({
            status: RequestStatus.PENDING
        })
            .sort({ createdAt: -1 })
            .lean();
    } catch (error) {
        console.error('Error fetching pending requests:', error);
        throw new Error('Failed to fetch pending requests');
    }
}

/**
 * Get request history with filters
 */
export async function getRequestHistory(filters: {
    status?: RequestStatus;
    callerPhone?: string;
    limit?: number;
    skip?: number;
}): Promise<{ requests: any[]; total: number }> {
    try {
        const query: any = {};

        if (filters.status) {
            query.status = filters.status;
        }

        if (filters.callerPhone) {
            query.callerPhone = filters.callerPhone;
        }

        const limit = filters.limit || 50;
        const skip = filters.skip || 0;

        const [requests, total] = await Promise.all([
            HelpRequest.find(query)
                .sort({ createdAt: -1 })
                .limit(limit)
                .skip(skip)
                .lean(),
            HelpRequest.countDocuments(query)
        ]);

        return { requests, total };

    } catch (error) {
        console.error('Error fetching request history:', error);
        throw new Error('Failed to fetch request history');
    }
}

/**
 * Resolve a help request with supervisor's answer
 */
export async function resolveRequest(
    requestId: string,
    supervisorResponse: string,
    supervisorId: string
): Promise<IHelpRequest> {
    try {
        const helpRequest = await HelpRequest.findById(requestId);

        if (!helpRequest) {
            throw new Error('Help request not found');
        }

        if (helpRequest.status !== RequestStatus.PENDING) {
            throw new Error('Request already processed');
        }

        // Update request status
        helpRequest.status = RequestStatus.RESOLVED;
        helpRequest.supervisorResponse = supervisorResponse;
        helpRequest.supervisorId = supervisorId;
        helpRequest.resolvedAt = new Date();

        await helpRequest.save();

        // Add to knowledge base
        await knowledgeBaseService.addEntry({
            question: helpRequest.question,
            answer: supervisorResponse,
            category: 'supervisor-learned',
            source: 'supervisor',
            createdBy: supervisorId
        });

        // Notify caller (simulated)
        await notificationService.notifyCaller(
            helpRequest.callerPhone,
            helpRequest.question,
            supervisorResponse
        );

        console.log(`✅ Help request resolved: ${requestId}`);
        return helpRequest;

    } catch (error) {
        console.error('Error resolving help request:', error);
        throw error;
    }
}

/**
 * Handle timeout for pending requests
 */
export async function handleTimeouts(): Promise<void> {
    try {
        const now = new Date();

        const timedOutRequests = await HelpRequest.find({
            status: RequestStatus.PENDING,
            timeoutAt: { $lte: now }
        });

        for (const request of timedOutRequests) {
            request.status = RequestStatus.TIMEOUT;
            await request.save();

            // Notify caller about timeout
            await notificationService.notifyCallerTimeout(
                request.callerPhone,
                request.question
            );

            console.log(`⏰ Request timed out: ${request._id}`);
        }

    } catch (error) {
        console.error('Error handling timeouts:', error);
    }
}

/**
 * Get request by ID
 */
export async function getRequestById(requestId: string): Promise<any> {
    try {
        return await HelpRequest.findById(requestId).lean();
    } catch (error) {
        console.error('Error fetching request by ID:', error);
        throw new Error('Failed to fetch request');
    }
}

export const helpRequestService = {
    createHelpRequest,
    getPendingRequests,
    getRequestHistory,
    resolveRequest,
    handleTimeouts,
    getRequestById
};