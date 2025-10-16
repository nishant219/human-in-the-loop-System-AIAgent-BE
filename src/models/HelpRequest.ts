import mongoose, { Schema, Document } from 'mongoose';

export enum RequestStatus {
  PENDING = 'pending',
  RESOLVED = 'resolved',
  TIMEOUT = 'timeout',
  IN_PROGRESS = 'in_progress'
}

export interface IHelpRequest extends Document {
  question: string;
  callerPhone: string;
  callerName?: string;
  sessionId: string;
  status: RequestStatus;
  supervisorResponse?: string;
  supervisorId?: string;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
  timeoutAt: Date;
  metadata: {
    attemptedKnowledgeSearch: boolean;
    confidenceScore?: number;
    context?: string;
  };
}

const helpRequestSchema = new Schema<IHelpRequest>({
  question: {
    type: String,
    required: true,
    trim: true,
    index: 'text' // Full-text search on questions
  },
  callerPhone: {
    type: String,
    required: true,
    trim: true,
    index: true // Index for quick caller lookup
  },
  callerName: {
    type: String,
    trim: true
  },
  sessionId: {
    type: String,
    required: true,
    unique: true,
    index: true // Quick session lookup
  },
  status: {
    type: String,
    enum: Object.values(RequestStatus),
    default: RequestStatus.PENDING,
    index: true // Efficient status filtering
  },
  supervisorResponse: {
    type: String,
    trim: true
  },
  supervisorId: {
    type: String,
    trim: true
  },
  resolvedAt: {
    type: Date
  },
  timeoutAt: {
    type: Date,
    required: true,
    index: true // For timeout cleanup jobs
  },
  metadata: {
    attemptedKnowledgeSearch: {
      type: Boolean,
      default: true
    },
    confidenceScore: {
      type: Number,
      min: 0,
      max: 1
    },
    context: {
      type: String
    }
  }
}, {
  timestamps: true,
  collection: 'help_requests'
});

// Compound index for supervisor dashboard queries
helpRequestSchema.index({ status: 1, createdAt: -1 });

// Compound index for analytics and reporting
helpRequestSchema.index({ callerPhone: 1, createdAt: -1 });

// TTL index to auto-delete old resolved requests after 90 days
helpRequestSchema.index({ resolvedAt: 1 }, { 
  expireAfterSeconds: 7776000, // 90 days
  partialFilterExpression: { status: RequestStatus.RESOLVED }
});

export const HelpRequest = mongoose.model<IHelpRequest>('HelpRequest', helpRequestSchema);