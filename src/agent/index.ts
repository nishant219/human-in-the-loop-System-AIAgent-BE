import { JobContext, defineAgent, voice } from '@livekit/agents';
import * as openai from '@livekit/agents-plugin-openai';
import { createAgentTools } from './tools';
import { DatabaseConfig } from '../config/database';
import { knowledgeBaseService } from '../services/knowledgeBaseService';
import { CallSession } from '../models/CallSession';
import { v4 as uuidv4 } from 'uuid';

/**
 * Initialize a new call session in the database
 */
async function initializeSession(
  sessionId: string,
  roomName: string,
  callerPhone: string,
  callerName?: string
): Promise<void> {
  await CallSession.create({
    sessionId,
    roomName,
    callerPhone,
    callerName,
    startedAt: new Date(),
    status: 'active'
  });
  console.log(`✅ Session initialized: ${sessionId}`);
}

/**
 * End a call session and calculate duration
 */
async function endSession(sessionId: string): Promise<void> {
  const session = await CallSession.findOne({ sessionId });
  if (session && !session.endedAt) {
    session.endedAt = new Date();
    session.duration = Math.floor((session.endedAt.getTime() - session.startedAt.getTime()) / 1000);
    session.status = 'completed';
    await session.save();
    console.log(`✅ Session ended: ${sessionId} (${session.duration}s)`);
  }
}

/**
 * Main agent entrypoint function
 */
async function entrypoint(ctx: JobContext) {
  console.log('\n🤖 ============ AGENT STARTING ============');
  console.log(`📞 Room: ${ctx.room.name}`);

  try {
    // Connect to database
    await DatabaseConfig();

    // Seed knowledge base if needed
    await knowledgeBaseService.seedInitialData();

    // Connect to LiveKit room
    await ctx.connect();
    const roomName = ctx.room.name || 'default-room';
    console.log(`✅ Connected to room: ${roomName}`);

    // Extract caller info from room metadata or use defaults
    const sessionId = uuidv4();
    const metadata = ctx.room.metadata ? JSON.parse(ctx.room.metadata) : {};
    const callerPhone = metadata.callerPhone || '+1234567890';
    const callerName = metadata.callerName;

    console.log(`👤 Caller: ${callerName || callerPhone}`);
    console.log(`🆔 Session: ${sessionId}`);

    // Initialize session in database
    await initializeSession(sessionId, roomName, callerPhone, callerName);

    // Create agent tools with context
    const tools = createAgentTools({
      sessionId,
      callerPhone,
      callerName
    });

    console.log(`🔧 Tools loaded: ${Object.keys(tools).length}`);

    // Create OpenAI LLM
    const llm = new openai.LLM({
      model: 'gpt-4o-mini',
      temperature: 0.7
    });

    // Create STT (Speech-to-Text)
    const stt = new openai.STT();

    // Create TTS (Text-to-Speech)
    const tts = new openai.TTS({
      voice: 'alloy'
    });

    // Create the agent with instructions and tools
    const agent = new voice.Agent({
      instructions: `You are a friendly and professional AI assistant for "Glamour Salon". 

Your role:
- Help customers with questions about salon services, hours, pricing, and location
- Be warm, conversational, and patient
- Use the tools available to you to find accurate information
- ALWAYS search the knowledge base FIRST using search_knowledge tool before asking for help
- If you don't find an answer in the knowledge base, use the request_help tool to escalate
- Never make up information or prices
- Keep responses concise but helpful (2-3 sentences)
- Sound natural and human-like, not robotic

When you don't know something:
1. Tell the customer: "Let me check with my supervisor about that."
2. Use the request_help tool immediately
3. Assure them: "I'll get back to you within 5-10 minutes."

Available tools you MUST use:
- search_knowledge: Search our knowledge base first
- request_help: Escalate to supervisor when needed
- get_salon_hours: Get operating hours
- get_service_pricing: Get pricing information
- book_appointment: Help with booking
- get_location: Provide location and directions

Remember: You're representing a premium salon. Be professional but friendly!`,
      llm,
      stt,
      tts,
      tools: {
        searchKnowledge: tools.searchKnowledge,
        requestHelp: tools.requestHelp,
        getSalonHours: tools.getSalonHours,
        getServicePricing: tools.getServicePricing,
        bookAppointment: tools.bookAppointment,
        getLocation: tools.getLocation
      }
    });

    // Create voice agent session
    const agentSession = new voice.AgentSession({
      llm,
      stt,
      tts
    });

    // Start the agent session with the agent and room
    await agentSession.start({
      agent,
      room: ctx.room
    });
    console.log('✅ Agent session started with OpenAI');

    // Generate initial greeting
    console.log('💬 Generating initial greeting...');

    // Handle room disconnection
    ctx.room.once('disconnected', async () => {
      console.log('\n📞 ============ CALL ENDING ============');
      await endSession(sessionId);
      console.log('👋 Goodbye!\n');
    });

    console.log('🎤 Agent is ready to receive calls!');

  } catch (error) {
    console.error('❌ ============ AGENT ERROR ============');
    console.error(error);
    throw error;
  }
}

// Export the agent using defineAgent
export default defineAgent({
  entry: entrypoint
});
