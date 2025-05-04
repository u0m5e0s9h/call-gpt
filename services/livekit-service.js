
const { AccessToken } = require('livekit-server-sdk');
const EventEmitter = require('events');

class LiveKitService extends EventEmitter {
  constructor() {
    super();
    this.apiKey = process.env.LIVEKIT_API_KEY;
    this.apiSecret = process.env.LIVEKIT_API_SECRET;
    this.wsUrl = process.env.LIVEKIT_WS_URL;
    this.rtcUrl = process.env.LIVEKIT_RTC_URL;
  }

  generateToken(identity, room) {
    const token = new AccessToken(this.apiKey, this.apiSecret, { identity });
    token.addGrant({ roomJoin: true, room });
    return token.toJwt();
  }

  async handleIncomingCall(callInfo) {
    // Simulate call handling logic (e.g., checking knowledge base)
    this.emit('callReceived', callInfo);
  }

  start() {
    console.log('LiveKitService started');
  }
}

module.exports = new LiveKitService();
