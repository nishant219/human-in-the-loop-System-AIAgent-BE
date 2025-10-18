import { RoomServiceClient, AccessToken, DataPacket_Kind } from 'livekit-server-sdk';

// Initialize configuration
const apiKey = process.env.LIVEKIT_API_KEY || '';
const apiSecret = process.env.LIVEKIT_API_SECRET || '';
const wsUrl = process.env.LIVEKIT_URL || '';

if (!apiKey || !apiSecret || !wsUrl) {
  throw new Error('LiveKit credentials not configured. Please set LIVEKIT_API_KEY, LIVEKIT_API_SECRET, and LIVEKIT_URL in .env');
}

const roomService = new RoomServiceClient(wsUrl, apiKey, apiSecret);

console.log('✅ LiveKit configuration initialized');

/**
 * Create a room for a call session
 */
export const createRoom = async (roomName: string, metadata?: string): Promise<any> => {
  try {
    const room = await roomService.createRoom({
      name: roomName,
      emptyTimeout: 300, // 5 minutes
      maxParticipants: 2, // Agent + caller
      metadata: metadata || ''
    });
    
    console.log(`✅ Room created: ${roomName}`);
    return room;
  } catch (error) {
    console.error('Error creating room:', error);
    throw error;
  }
};

/**
 * Delete a room after call ends
 */
export const deleteRoom = async (roomName: string): Promise<void> => {
  try {
    await roomService.deleteRoom(roomName);
    console.log(`✅ Room deleted: ${roomName}`);
  } catch (error) {
    console.error('Error deleting room:', error);
  }
};

/**
 * List all active rooms
 */
export const listRooms = async (): Promise<any[]> => {
  try {
    const rooms = await roomService.listRooms();
    return rooms;
  } catch (error) {
    console.error('Error listing rooms:', error);
    return [];
  }
};

/**
 * Get room details
 */
export const getRoom = async (roomName: string): Promise<any> => {
  try {
    const rooms = await roomService.listRooms([roomName]);
    return rooms[0] || null;
  } catch (error) {
    console.error('Error getting room:', error);
    return null;
  }
};

/**
 * Generate access token for a participant
 */
export const generateToken = async (
  roomName: string,
  participantIdentity: string,
  participantName?: string,
  metadata?: string
): Promise<string> => {
  const token = new AccessToken(apiKey, apiSecret, {
    identity: participantIdentity,
    name: participantName,
    metadata: metadata
  });

  token.addGrant({
    room: roomName,
    roomJoin: true,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true
  });

  return await token.toJwt();
};

/**
 * Generate token for agent
 */
export const generateAgentToken = async (roomName: string): Promise<string> => {
  return await generateToken(
    roomName,
    'ai-agent',
    'Salon AI Assistant',
    JSON.stringify({ role: 'agent' })
  );
};

/**
 * Generate token for caller
 */
export const generateCallerToken = async (
  roomName: string,
  callerPhone: string,
  callerName?: string
): Promise<string> => {
  return await generateToken(
    roomName,
    callerPhone,
    callerName || callerPhone,
    JSON.stringify({ 
      role: 'caller',
      phone: callerPhone 
    })
  );
};

/**
 * List participants in a room
 */
export const listParticipants = async (roomName: string): Promise<any[]> => {
  try {
    const participants = await roomService.listParticipants(roomName);
    return participants;
  } catch (error) {
    console.error('Error listing participants:', error);
    return [];
  }
};

/**
 * Remove participant from room
 */
export const removeParticipant = async (roomName: string, participantIdentity: string): Promise<void> => {
  try {
    await roomService.removeParticipant(roomName, participantIdentity);
    console.log(`✅ Participant removed: ${participantIdentity} from ${roomName}`);
  } catch (error) {
    console.error('Error removing participant:', error);
  }
};

/**
 * Send data message to room
 */
export const sendData = async (
  roomName: string,
  data: string,
  destinationIdentities?: string[]
): Promise<void> => {
  try {
    await roomService.sendData(
      roomName,
      Buffer.from(data),
      DataPacket_Kind.RELIABLE,
      destinationIdentities
    );
    console.log(`✅ Data sent to room: ${roomName}`);
  } catch (error) {
    console.error('Error sending data:', error);
  }
};

/**
 * Get WebSocket URL
 */
export const getWsUrl = (): string => {
  return wsUrl;
};

/**
 * Get API credentials
 */
export const getCredentials = (): { apiKey: string; apiSecret: string } => {
  return {
    apiKey,
    apiSecret
  };
};