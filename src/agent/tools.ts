import { llm } from '@livekit/agents';
import { knowledgeBaseService } from '../services/knowledgeBaseService';
import { helpRequestService } from '../services/helpRequestService';

export interface ToolContext {
  sessionId: string;
  callerPhone: string;
  callerName?: string;
}

/**
 * Search knowledge base tool
 */
export const createSearchKnowledgeTool = (context: ToolContext) => {
  return llm.tool({
    description: 'Search the salon knowledge base for information about services, hours, pricing, location, and booking. Use this first before escalating to supervisor.',
    parameters: {
      type: 'object',
      properties: {
        question: {
          type: 'string',
          description: 'The customer question to search for in the knowledge base'
        }
      },
      required: ['question']
    },
    execute: async ({ question }: { question: string }) => {
      console.log(`🔍 [${context.sessionId}] Searching: "${question}"`);
      
      try {
        const entry = await knowledgeBaseService.searchAnswer(question);
        
        if (entry) {
          console.log(`✅ [${context.sessionId}] Found answer`);
          return JSON.stringify({
            found: true,
            answer: entry.answer,
            confidence: entry.confidence,
            category: entry.category
          });
        }
        
        console.log(`❌ [${context.sessionId}] No answer found`);
        return JSON.stringify({
          found: false,
          message: 'No answer found in knowledge base'
        });
        
      } catch (error) {
        console.error('Error searching knowledge:', error);
        return JSON.stringify({
          found: false,
          error: 'Error searching knowledge base'
        });
      }
    }
  });
};

/**
 * Request human help tool
 */
export const createRequestHelpTool = (context: ToolContext) => {
  return llm.tool({
    description: 'Escalate to a human supervisor when you don\'t know the answer or are uncertain. ALWAYS use this when the knowledge base search returns no results.',
    parameters: {
      type: 'object',
      properties: {
        question: {
          type: 'string',
          description: 'The question that needs supervisor assistance'
        },
        context: {
          type: 'string',
          description: 'Additional conversation context'
        }
      },
      required: ['question']
    },
    execute: async ({ question, context: questionContext }: { question: string; context?: string }) => {
      console.log(`🆘 [${context.sessionId}] Escalating: "${question}"`);
      
      try {
        const helpRequest = await helpRequestService.createHelpRequest({
          question,
          callerPhone: context.callerPhone,
          callerName: context.callerName,
          sessionId: context.sessionId,
          context: questionContext
        });
        
        console.log(`✅ [${context.sessionId}] Help request: ${helpRequest._id}`);
        
        return JSON.stringify({
          success: true,
          requestId: String(helpRequest._id),
          message: 'Help request sent to supervisor. They will respond shortly.',
          estimatedWaitTime: '5-10 minutes'
        });
        
      } catch (error) {
        console.error('Error creating help request:', error);
        return JSON.stringify({
          success: false,
          error: 'Failed to create help request'
        });
      }
    }
  });
};

/**
 * Get salon hours tool
 */
export const createGetSalonHoursTool = () => {
  return llm.tool({
    description: 'Get the salon operating hours for specific days or general schedule',
    parameters: {
      type: 'object',
      properties: {
        day: {
          type: 'string',
          enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday', 'today', 'all'],
          description: 'The day to get hours for'
        }
      }
    },
    execute: async ({ day = 'all' }: { day?: string }) => {
      const hours: Record<string, string> = {
        monday: '9:00 AM - 7:00 PM',
        tuesday: '9:00 AM - 7:00 PM',
        wednesday: '9:00 AM - 7:00 PM',
        thursday: '9:00 AM - 7:00 PM',
        friday: '9:00 AM - 7:00 PM',
        saturday: '9:00 AM - 7:00 PM',
        sunday: '10:00 AM - 5:00 PM'
      };
      
      if (day === 'all') {
        return JSON.stringify({
          weekday: 'Monday - Saturday: 9:00 AM - 7:00 PM',
          weekend: 'Sunday: 10:00 AM - 5:00 PM',
          note: 'We are closed on major holidays'
        });
      }
      
      const today = day === 'today' 
        ? new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase() 
        : day;
      
      return JSON.stringify({
        day: today,
        hours: hours[today],
        isOpen: true
      });
    }
  });
};

/**
 * Get service pricing tool
 */
export const createGetServicePricingTool = () => {
  return llm.tool({
    description: 'Get pricing information for salon services',
    parameters: {
      type: 'object',
      properties: {
        service: {
          type: 'string',
          enum: ['haircut', 'coloring', 'styling', 'manicure', 'pedicure', 'facial', 'waxing', 'all'],
          description: 'The service to get pricing for'
        }
      },
      required: ['service']
    },
    execute: async ({ service }: { service: string }) => {
      const pricing: Record<string, any> = {
        haircut: { basic: '$30', premium: '$60', kids: '$20' },
        coloring: { fullHead: '$80-150', highlights: '$60-120', touchUp: '$40' },
        styling: { blowDry: '$25', updo: '$50', specialEvent: '$70' },
        manicure: { basic: '$20', gel: '$35', deluxe: '$45' },
        pedicure: { basic: '$30', spa: '$50', deluxe: '$65' },
        facial: { basic: '$50', antiAging: '$80', acne: '$60' },
        waxing: { eyebrows: '$15', upperLip: '$10', fullFace: '$40' }
      };
      
      if (service === 'all') {
        return JSON.stringify({
          message: 'Here are our service categories',
          services: Object.keys(pricing),
          note: 'Prices vary based on hair length and complexity'
        });
      }
      
      return JSON.stringify({
        service,
        pricing: pricing[service],
        note: 'Final pricing may vary based on hair length and condition'
      });
    }
  });
};

/**
 * Book appointment tool
 */
export const createBookAppointmentTool = (context: ToolContext) => {
  return llm.tool({
    description: 'Help customer book an appointment',
    parameters: {
      type: 'object',
      properties: {
        service: {
          type: 'string',
          description: 'Service they want to book'
        },
        preferredDate: {
          type: 'string',
          description: 'Preferred date for the appointment'
        },
        preferredTime: {
          type: 'string',
          description: 'Preferred time for the appointment'
        }
      },
      required: ['service']
    },
    execute: async ({ service, preferredDate, preferredTime }: { service: string; preferredDate?: string; preferredTime?: string }) => {
      console.log(`📅 [${context.sessionId}] Booking: ${service}`);
      
      return JSON.stringify({
        message: 'I can help you book an appointment',
        service,
        options: [
          'Call us directly at (555) 123-4567',
          'Book online at glamoursalon.com/book',
          'We can have someone call you back within 1 hour'
        ],
        preferredDate,
        preferredTime,
        availableSlots: ['9:00 AM', '11:00 AM', '2:00 PM', '4:00 PM'],
        note: 'Online booking gets 10% discount!'
      });
    }
  });
};

/**
 * Get location tool
 */
export const createGetLocationTool = () => {
  return llm.tool({
    description: 'Get salon location, address, and directions',
    parameters: {
      type: 'object',
      properties: {
        needDirections: {
          type: 'boolean',
          description: 'Whether to include directions'
        }
      }
    },
    execute: async ({ needDirections = false }: { needDirections?: boolean }) => {
      return JSON.stringify({
        name: 'Glamour Salon',
        address: '123 Beauty Lane, Suite 100',
        city: 'Downtown District',
        zip: '12345',
        phone: '(555) 123-4567',
        parking: 'Free parking available in rear lot',
        publicTransit: 'Bus routes 10, 15, 22 stop nearby',
        landmarks: 'Next to City Bank, across from Central Park',
        ...(needDirections && {
          directions: 'From downtown: Take Main St north, turn right on Beauty Lane.',
          mapLink: 'https://maps.example.com/glamour-salon'
        })
      });
    }
  });
};

/**
 * Export all tools
 */
export const createAgentTools = (context: ToolContext) => {
  return {
    searchKnowledge: createSearchKnowledgeTool(context),
    requestHelp: createRequestHelpTool(context),
    getSalonHours: createGetSalonHoursTool(),
    getServicePricing: createGetServicePricingTool(),
    bookAppointment: createBookAppointmentTool(context),
    getLocation: createGetLocationTool()
  };
};
