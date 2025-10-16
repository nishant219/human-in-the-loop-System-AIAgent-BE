import mongoose, { Schema, Document } from 'mongoose';

export interface IKnowledgeEntry extends Document {
  question: string;
  answer: string;
  category: string;
  tags: string[];
  source: 'initial' | 'supervisor' | 'admin';
  confidence: number;
  usageCount: number;
  lastUsedAt?: Date;
  relatedEntries: mongoose.Types.ObjectId[];
  isActive: boolean;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const knowledgeEntrySchema = new Schema<IKnowledgeEntry>({
  question: {
    type: String,
    required: true,
    trim: true,
    index: 'text' // Full-text search capability
  },
  answer: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    trim: true,
    index: true,
    default: 'general'
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  source: {
    type: String,
    enum: ['initial', 'supervisor', 'admin'],
    default: 'supervisor',
    index: true
  },
  confidence: {
    type: Number,
    min: 0,
    max: 1,
    default: 0.8
  },
  usageCount: {
    type: Number,
    default: 0,
    min: 0
  },
  lastUsedAt: {
    type: Date
  },
  relatedEntries: [{
    type: Schema.Types.ObjectId,
    ref: 'KnowledgeEntry'
  }],
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  createdBy: {
    type: String
  }
}, {
  timestamps: true,
  collection: 'knowledge_base'
});

// Compound index for efficient active knowledge queries
knowledgeEntrySchema.index({ isActive: 1, category: 1, confidence: -1 });

// Text index for semantic search
knowledgeEntrySchema.index({ question: 'text', answer: 'text', tags: 'text' });

export const KnowledgeEntry = mongoose.model<IKnowledgeEntry>('KnowledgeEntry', knowledgeEntrySchema);