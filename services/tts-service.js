const EventEmitter = require('events');

class TextToSpeechService extends EventEmitter {
  constructor() {
    super();
    console.log('Using mock TextToSpeechService - no Deepgram API key required');
  }

  async generate(gptReply, interactionCount) {
    // Simulate TTS audio generation delay
    setTimeout(() => {
      // Emit speech event with dummy audio buffer
      this.emit('speech', gptReply.partialResponseIndex, Buffer.from('fake audio data'), gptReply.partialResponse, interactionCount);
    }, 500);
  }
}

module.exports = { TextToSpeechService };
