import * as google from '@livekit/agents-plugin-google';
import * as deepgram from '@livekit/agents-plugin-deepgram';
import * as elevenlabs from '@livekit/agents-plugin-elevenlabs';
import dotenv from 'dotenv';

dotenv.config();

async function testAIIntegration() {
  console.log('🧪 Testing AI Integration (Gemini + Deepgram + ElevenLabs)...\n');

  let hasErrors = false;

  try {
    // Check Gemini API key
    if (!process.env.GEMINI_API_KEY) {
      console.error('❌ GEMINI_API_KEY not found in environment variables');
      hasErrors = true;
    } else {
      console.log('✅ GEMINI_API_KEY found');
      console.log(`   Key prefix: ${process.env.GEMINI_API_KEY.substring(0, 10)}...\n`);
    }

    // Check Deepgram API key
    if (!process.env.DEEPGRAM_API_KEY) {
      console.error('❌ DEEPGRAM_API_KEY not found in environment variables');
      hasErrors = true;
    } else {
      console.log('✅ DEEPGRAM_API_KEY found');
      console.log(`   Key prefix: ${process.env.DEEPGRAM_API_KEY.substring(0, 10)}...\n`);
    }

    // Check ElevenLabs API key
    if (!process.env.ELEVENLABS_API_KEY) {
      console.error('❌ ELEVENLABS_API_KEY not found in environment variables');
      hasErrors = true;
    } else {
      console.log('✅ ELEVENLABS_API_KEY found');
      console.log(`   Key prefix: ${process.env.ELEVENLABS_API_KEY.substring(0, 10)}...\n`);
    }

    if (hasErrors) {
      console.error('\n⚠️  Missing required API keys. Please add them to your .env file.\n');
      process.exit(1);
    }

    // Test LLM initialization
    console.log('🤖 Initializing Gemini LLM...');
    const llm = new google.LLM({
      model: 'gemini-2.0-flash-exp',
      temperature: 0.7
    });
    console.log('✅ LLM initialized successfully\n');

    // Test STT initialization
    console.log('🎤 Initializing Deepgram Speech-to-Text...');
    const stt = new deepgram.STT();
    console.log('✅ STT initialized successfully\n');

    // Test TTS initialization
    console.log('🔊 Initializing ElevenLabs Text-to-Speech...');
    const tts = new elevenlabs.TTS();
    console.log('✅ TTS initialized successfully\n');

    console.log('========================================');
    console.log('✅ All AI components initialized!');
    console.log('========================================');
    console.log('\nConfiguration:');
    console.log('  - LLM: Google Gemini 2.0 Flash (FREE)');
    console.log('  - STT: Deepgram ($200 free credit)');
    console.log('  - TTS: ElevenLabs (10k chars/month free)');
    console.log('\nYour agent is ready to run!');
    console.log('Run: npm run agent:dev\n');

  } catch (error: any) {
    console.error('\n❌ Error testing AI integration:');
    console.error(error.message);
    console.error('\nPlease check:');
    console.error('1. GEMINI_API_KEY is valid (get it from https://aistudio.google.com/apikey)');
    console.error('2. DEEPGRAM_API_KEY is valid (get it from https://console.deepgram.com/)');
    console.error('3. ELEVENLABS_API_KEY is valid (get it from https://elevenlabs.io/)');
    console.error('4. API keys have necessary permissions\n');
    process.exit(1);
  }
}

testAIIntegration();
