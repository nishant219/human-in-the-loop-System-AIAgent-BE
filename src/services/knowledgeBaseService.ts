import { KnowledgeEntry, IKnowledgeEntry } from '../models/KnowledgeBase';

interface SearchResult extends IKnowledgeEntry {
    score?: number;
}

/**
 * Search knowledge base for an answer
 * Uses text search and similarity matching
 */
export async function searchAnswer(question: string): Promise<IKnowledgeEntry | null> {
    try {
        // First try exact text search
        const results = await KnowledgeEntry.find(
            {
                $text: { $search: question },
                isActive: true
            },
            { score: { $meta: 'textScore' } }
        )
            .sort({ score: { $meta: 'textScore' } })
            .limit(1)
            .lean() as unknown as SearchResult[];

        if (results.length > 0 && (results[0].score || 0) > 0.5) {
            // Update usage stats
            await KnowledgeEntry.findByIdAndUpdate(results[0]._id, {
                $inc: { usageCount: 1 },
                lastUsedAt: new Date()
            });

            return results[0] as any;
        }

        // Fallback to category-based search
        const categoryMatch = await findByCategoryKeywords(question);
        if (categoryMatch) {
            await KnowledgeEntry.findByIdAndUpdate(categoryMatch._id, {
                $inc: { usageCount: 1 },
                lastUsedAt: new Date()
            });
            return categoryMatch as any;
        }

        return null;

    } catch (error) {
        console.error('Error searching knowledge base:', error);
        return null;
    }
}

/**
 * Find by category keywords (fallback search)
 */
async function findByCategoryKeywords(question: string): Promise<any> {
    const lowerQuestion = question.toLowerCase();

    // Define category keywords
    const categoryMap: Record<string, string[]> = {
        'hours': ['hour', 'open', 'close', 'timing', 'schedule'],
        'pricing': ['price', 'cost', 'charge', 'fee', 'much'],
        'services': ['service', 'offer', 'haircut', 'color', 'treatment'],
        'booking': ['book', 'appointment', 'reserve', 'schedule'],
        'location': ['location', 'address', 'where', 'find']
    };

    for (const [category, keywords] of Object.entries(categoryMap)) {
        if (keywords.some(keyword => lowerQuestion.includes(keyword))) {
            const entry = await KnowledgeEntry.findOne({
                category,
                isActive: true
            })
                .sort({ confidence: -1, usageCount: -1 })
                .lean();

            if (entry) return entry;
        }
    }

    return null;
}

/**
 * Add new entry to knowledge base
 */
export async function addEntry(data: {
    question: string;
    answer: string;
    category?: string;
    tags?: string[];
    source?: 'initial' | 'supervisor' | 'admin';
    createdBy?: string;
}): Promise<IKnowledgeEntry> {
    try {
        const entry = await KnowledgeEntry.create({
            question: data.question,
            answer: data.answer,
            category: data.category || 'general',
            tags: data.tags || extractTags(data.question),
            source: data.source || 'supervisor',
            createdBy: data.createdBy,
            confidence: 0.8,
            isActive: true
        });

        console.log(`✅ Knowledge entry added: ${entry._id}`);
        return entry;

    } catch (error) {
        console.error('Error adding knowledge entry:', error);
        throw new Error('Failed to add knowledge entry');
    }
}

/**
 * Extract tags from question using simple NLP
 */
function extractTags(text: string): string[] {
    const stopWords = ['what', 'when', 'where', 'how', 'why', 'is', 'are', 'the', 'a', 'an'];
    const words = text.toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter(word => word.length > 3 && !stopWords.includes(word));

    return [...new Set(words)].slice(0, 5);
}

/**
 * Get all knowledge entries
 */
export async function getAllEntries(filters?: {
    category?: string;
    isActive?: boolean;
    limit?: number;
}): Promise<any[]> {
    try {
        const query: any = {};

        if (filters?.category) {
            query.category = filters.category;
        }

        if (filters?.isActive !== undefined) {
            query.isActive = filters.isActive;
        }

        return await KnowledgeEntry.find(query)
            .sort({ usageCount: -1, createdAt: -1 })
            .limit(filters?.limit || 100)
            .lean();

    } catch (error) {
        console.error('Error fetching knowledge entries:', error);
        throw new Error('Failed to fetch knowledge entries');
    }
}

/**
 * Update knowledge entry
 */
export async function updateEntry(
    entryId: string,
    updates: Partial<IKnowledgeEntry>
): Promise<any> {
    try {
        return await KnowledgeEntry.findByIdAndUpdate(
            entryId,
            updates,
            { new: true }
        ).lean();
    } catch (error) {
        console.error('Error updating knowledge entry:', error);
        throw new Error('Failed to update knowledge entry');
    }
}

/**
 * Delete (deactivate) knowledge entry
 */
export async function deactivateEntry(entryId: string): Promise<void> {
    try {
        await KnowledgeEntry.findByIdAndUpdate(entryId, { isActive: false });
    } catch (error) {
        console.error('Error deactivating knowledge entry:', error);
        throw new Error('Failed to deactivate knowledge entry');
    }
}

/**
 * Seed initial knowledge base with salon information
 */
export async function seedInitialData(): Promise<void> {
    try {
        const existingCount = await KnowledgeEntry.countDocuments();

        if (existingCount > 0) {
            console.log('Knowledge base already seeded');
            return;
        }

        const initialData = [
            {
                question: 'What are your business hours?',
                answer: 'We are open Monday to Saturday from 9 AM to 7 PM, and Sunday from 10 AM to 5 PM.',
                category: 'hours',
                tags: ['hours', 'open', 'schedule'],
                source: 'initial' as const
            },
            {
                question: 'What services do you offer?',
                answer: 'We offer haircuts, hair coloring, styling, manicures, pedicures, facials, and waxing services.',
                category: 'services',
                tags: ['services', 'haircut', 'coloring'],
                source: 'initial' as const
            },
            {
                question: 'How much does a haircut cost?',
                answer: 'Our haircut prices start at $30 for a basic cut and go up to $60 for premium styling.',
                category: 'pricing',
                tags: ['price', 'haircut', 'cost'],
                source: 'initial' as const
            },
            {
                question: 'Where are you located?',
                answer: 'We are located at 123 Beauty Lane, Suite 100, Downtown District.',
                category: 'location',
                tags: ['location', 'address', 'where'],
                source: 'initial' as const
            },
            {
                question: 'How do I book an appointment?',
                answer: 'You can book an appointment by calling us at (555) 123-4567 or through our website.',
                category: 'booking',
                tags: ['booking', 'appointment', 'reserve'],
                source: 'initial' as const
            }
        ];

        await KnowledgeEntry.insertMany(initialData);
        console.log('✅ Knowledge base seeded with initial data');

    } catch (error) {
        console.error('Error seeding knowledge base:', error);
    }
}

export const knowledgeBaseService = {
    searchAnswer,
    addEntry,
    getAllEntries,
    updateEntry,
    deactivateEntry,
    seedInitialData
};