import mongoose, { Schema, Document } from 'mongoose';

export interface ICallSession extends Document {
  sessionId: string;
  roomName: string;
  callerPhone: string;
  callerName?: string;
  startedAt: Date;
  endedAt?: Date;
  duration?: number;
  helpRequestsCount: number;
  helpRequestIds: mongoose.Types.ObjectId[];
  transcript?: string;
  status: 'active' | 'completed' | 'failed';
}

const callSessionSchema = new Schema<ICallSession>({
  sessionId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  roomName: {
    type: String,
    required: true
  },
  callerPhone: {
    type: String,
    required: true,
    index: true
  },
  callerName: {
    type: String
  },
  startedAt: {
    type: Date,
    required: true,
    default: Date.now,
    index: true
  },
  endedAt: {
    type: Date
  },
  duration: {
    type: Number // in seconds
  },
  helpRequestsCount: {
    type: Number,
    default: 0,
    min: 0
  },
  helpRequestIds: [{
    type: Schema.Types.ObjectId,
    ref: 'HelpRequest'
  }],
  transcript: {
    type: String
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'failed'],
    default: 'active',
    index: true
  }
}, {
  timestamps: true,
  collection: 'call_sessions'
});

// Compound index for analytics
callSessionSchema.index({ status: 1, startedAt: -1 });

export const CallSession = mongoose.model<ICallSession>('CallSession', callSessionSchema);
