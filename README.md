# AI Agent Backend - Voice Call Assistant

A Node.js/Express backend service that powers an AI voice assistant for salon customer service. The system uses LiveKit for real-time voice communication and integrates with OpenAI for intelligent conversation handling.

## Features

- **Real-time Voice Calls** - LiveKit integration for voice communication
- **AI-Powered Assistant** - OpenAI GPT-4 powered conversational agent
- **Knowledge Base** - Searchable database of salon information
- **Help Request System** - Escalation to human supervisors when needed
- **Call Session Management** - Track and manage customer calls
- **MongoDB Database** - Persistent storage for calls, requests, and knowledge

## Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Voice**: LiveKit Server SDK
- **AI**: LiveKit Agents with OpenAI plugin
- **Validation**: Zod

## Project Structure

```
ai-agent-BE/
├── src/
│   ├── agent/              # AI agent logic and tools
│   │   ├── index.ts        # Agent entrypoint
│   │   └── tools.ts        # Agent function tools
│   ├── config/             # Configuration files
│   │   ├── database.ts     # MongoDB connection
│   │   └── livekit.ts      # LiveKit setup
│   ├── controllers/        # Request handlers
│   │   ├── callController.ts
│   │   ├── helpRequestController.ts
│   │   ├── knowledgeBaseController.ts
│   │   └── testController.ts
│   ├── models/             # Mongoose schemas
│   │   ├── CallSession.ts
│   │   ├── HelpRequest.ts
│   │   └── KnowledgeBase.ts
│   ├── routes/             # API routes
│   │   ├── callRoutes.ts
│   │   ├── helpRequestRoutes.ts
│   │   ├── knowledgeBaseRoutes.ts
│   │   └── testRoutes.ts
│   ├── services/           # Business logic
│   │   ├── helpRequestService.ts
│   │   ├── knowledgeBaseService.ts
│   │   └── notificationService.ts
│   ├── app.ts              # Express app setup
│   └── server.ts           # Server entry point
├── .env                    # Environment variables
├── package.json
└── tsconfig.json
```

## Prerequisites

- Node.js 18+ and npm
- MongoDB (local or Atlas)
- LiveKit account and credentials
- OpenAI API key

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd ai-agent-BE
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```bash
cp .env.example .env
```

4. Configure environment variables in `.env`:
```env
# Server
PORT=3000
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb://localhost:27017/ai-agent
# Or use MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname

# LiveKit
LIVEKIT_URL=wss://your-livekit-server.livekit.cloud
LIVEKIT_API_KEY=your_api_key
LIVEKIT_API_SECRET=your_api_secret

# OpenAI (used by agent)
OPENAI_API_KEY=your_openai_api_key

# Optional: Google Gemini (not currently used)
GEMINI_API_KEY=your_gemini_api_key

# Configuration
HELP_REQUEST_TIMEOUT_MINUTES=30
```

## Running the Application

### Development Mode

Start the API server:
```bash
npm run dev
```

Start the AI agent (in a separate terminal):
```bash
npm run agent:dev
```

### Production Mode

Build the project:
```bash
npm run build
```

Start the server:
```bash
npm start
```

Start the agent:
```bash
npm run agent:start
```

## API Endpoints

### Health Check
```
GET /api/health
```

### Call Management
```
POST   /api/calls/start              # Start a new call
POST   /api/calls/:sessionId/end     # End a call
GET    /api/calls/:sessionId         # Get call details
GET    /api/calls                    # List all calls
GET    /api/calls/stats              # Get call statistics
PATCH  /api/calls/:sessionId/status  # Update call status
```

### Help Requests
```
POST   /api/help-requests                # Create help request
GET    /api/help-requests/pending        # Get pending requests
GET    /api/help-requests/history        # Get request history
GET    /api/help-requests/:id            # Get specific request
POST   /api/help-requests/:id/resolve    # Resolve a request
```

### Knowledge Base
```
GET    /api/knowledge-base               # Get all entries
POST   /api/knowledge-base/search        # Search for answers
POST   /api/knowledge-base               # Add new entry
PATCH  /api/knowledge-base/:id           # Update entry
DELETE /api/knowledge-base/:id           # Delete entry
```

### Testing Endpoints
```
GET    /api/test/env                     # Check environment variables
GET    /api/test/livekit                 # Test LiveKit connection
GET    /api/test/livekit/rooms           # List active rooms
POST   /api/test/livekit/room            # Create test room
DELETE /api/test/livekit/room/:roomName  # Delete test room
POST   /api/test/livekit/token           # Generate access token
```

## Testing

### Quick API Test
```bash
# Test server health
curl http://localhost:3000/api/health

# Test LiveKit connection
curl http://localhost:3000/api/test/livekit | jq

# Search knowledge base
curl -X POST http://localhost:3000/api/knowledge-base/search \
  -H "Content-Type: application/json" \
  -d '{"question": "salon hours"}'
```

### Run Integration Tests
```bash
# Run comprehensive test suite
bash test-livekit-direct.sh
```

### Example: Start a Call
```bash
curl -X POST http://localhost:3000/api/calls/start \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "test-123",
    "roomName": "room-123",
    "callerPhone": "+1234567890",
    "callerName": "John Doe"
  }'
```

### Example: Create Help Request
```bash
curl -X POST http://localhost:3000/api/help-requests \
  -H "Content-Type: application/json" \
  -d '{
    "question": "How much does a haircut cost?",
    "callerPhone": "+1234567890",
    "sessionId": "test-123"
  }'
```

## AI Agent

The AI agent is built using LiveKit Agents framework and includes:

### Agent Tools
- `searchKnowledge` - Search the knowledge base
- `requestHelp` - Escalate to human supervisor
- `getSalonHours` - Get operating hours
- `getServicePricing` - Get service pricing
- `bookAppointment` - Help with booking
- `getLocation` - Provide location info

### Agent Behavior
- Searches knowledge base first before escalating
- Maintains conversational, friendly tone
- Automatically creates help requests when uncertain
- Tracks all interactions in database

## Database Models

### CallSession
- Session ID, room name, caller info
- Start/end times, duration
- Status (active, completed, failed)
- Associated help requests

### HelpRequest
- Question, caller info, session ID
- Status (pending, resolved, expired)
- Supervisor response
- Timeout handling

### KnowledgeBase
- Question/answer pairs
- Category, tags, confidence score
- Usage tracking
- Text search indexing

## Development

### Linting
```bash
npm run lint
```

### Adding New Routes
1. Create controller in `src/controllers/`
2. Create route file in `src/routes/`
3. Register route in `src/app.ts`

### Adding Agent Tools
1. Add tool function in `src/agent/tools.ts`
2. Register tool in `src/agent/index.ts`
3. Update agent instructions

## Troubleshooting

### Server won't start
- Check MongoDB connection string
- Verify all environment variables are set
- Ensure port 3000 is available

### LiveKit connection fails
- Verify LiveKit credentials in `.env`
- Check LiveKit server URL format (wss://)
- Test connection: `curl http://localhost:3000/api/test/livekit`

### Agent not responding
- Ensure OpenAI API key is valid
- Check agent is running (`npm run agent:dev`)
- Verify LiveKit room is created

### Database errors
- Confirm MongoDB is running
- Check connection string format
- Verify database permissions

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Server port (default: 3000) |
| `NODE_ENV` | No | Environment (development/production) |
| `MONGODB_URI` | Yes | MongoDB connection string |
| `LIVEKIT_URL` | Yes | LiveKit WebSocket URL |
| `LIVEKIT_API_KEY` | Yes | LiveKit API key |
| `LIVEKIT_API_SECRET` | Yes | LiveKit API secret |
| `OPENAI_API_KEY` | Yes | OpenAI API key for agent |
| `GEMINI_API_KEY` | No | Google Gemini API key (future use) |
| `HELP_REQUEST_TIMEOUT_MINUTES` | No | Help request timeout (default: 30) |

## Contributing

1. Create a feature branch
2. Make your changes
3. Run linting: `npm run lint`
4. Test your changes
5. Submit a pull request

## License

ISC

## Support

For issues or questions, please open an issue in the repository.
