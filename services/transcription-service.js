class TranscriptionService extends require('events') {
  constructor() {
    super();
    console.log('Using mock TranscriptionService - no Deepgram API key required');
  }

  on(event, callback) {
    if (event === 'utterance') {
      this.utteranceCallback = callback;
    } else if (event === 'transcription') {
      this.transcriptionCallback = callback;
    }
  }

  send(mediaPayload) {
    setTimeout(() => {
      if (this.utteranceCallback) {
        this.utteranceCallback('Simulated transcription text');
      }
      if (this.transcriptionCallback) {
        this.transcriptionCallback('Simulated transcription text');
      }
    }, 500);
  }
}

module.exports = { TranscriptionService };
