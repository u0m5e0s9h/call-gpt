require('dotenv').config();
require('colors');

const express = require('express');
const ExpressWs = require('express-ws');
const WebSocket = require('ws');

const { GptService } = require('./services/gpt-service');
const { StreamService } = require('./services/stream-service');
const { TranscriptionService } = require('./services/transcription-service');
const { TextToSpeechService } = require('./services/tts-service');
const { recordingService } = require('./services/recording-service');
// const helpRequestManager = require('./services/help-request-manager');
const FirebaseHelpRequestManager = require('./services/firebase-help-request-manager');
const livekitService = require('./services/livekit-service');
const bodyParser = require('body-parser');
const path = require('path');

const VoiceResponse = require('twilio').twiml.VoiceResponse;

const app = express();
const expressWsInstance = ExpressWs(app); // Set up WebSocket support

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 3000;

// Instantiate services
const gptService = new GptService();
const transcriptionService = new TranscriptionService();

// Function to load knowledge base from Firebase and update GptService
async function loadKnowledgeBase() {
  try {
    const knowledgeBaseEntries = await FirebaseHelpRequestManager.getKnowledgeBase();
    knowledgeBaseEntries.forEach(({ question, answer }) => {
      gptService.updateKnowledgeBase(question, answer);
    });
    console.log('Knowledge base loaded from Firebase');
  } catch (error) {
    console.error('Failed to load knowledge base from Firebase:', error);
  }
}

// Load knowledge base on startup
loadKnowledgeBase();

// Start LiveKit service
livekitService.start();

// Listen for transcription events and forward to GPT
transcriptionService.on('transcription', (text) => {
  if (text && text.length > 0) {
    console.log(`Transcription received: ${text}`);
    gptService.completion(text, 0);
  }
});

// Listen for requestHelp event from GptService
gptService.on('requestHelp', (question) => {
  console.log(`AI needs help with question: "${question}"`);

  const callSid = 'unknown-callSid'; // You may want to pass actual callSid from context
  const request = FirebaseHelpRequestManager.createRequest(question, callSid);

  console.log(`Simulated text to supervisor: Hey, I need help answering "${question}".`);

  // TODO: Notify caller via WebSocket that help is requested
});

// Twilio incoming call webhook
app.post('/incoming', (req, res) => {
  try {
    const response = new VoiceResponse();
    const connect = response.connect();
    const livekitWsUrl = process.env.LIVEKIT_WS_URL;

    connect.stream({ url: livekitWsUrl });

    res.type('text/xml');
    res.end(response.toString());
  } catch (err) {
    console.log(err);
    res.status(500).send('Internal Server Error');
  }
});

// WebSocket endpoint using express-ws
app.ws('/connection', (ws, req) => {
  console.log(' Client connected to /connection');

  ws.send(JSON.stringify({
    event: 'connection_established',
    message: 'Welcome to the WebSocket server!',
  }));

  ws.on('message', (msg) => {
    try {
      const data = JSON.parse(msg);
      if (data.event === 'media' && data.media && data.media.payload) {
        const decodedPayload = Buffer.from(data.media.payload, 'base64').toString('utf-8');
        console.log('Decoded media payload:', decodedPayload);
        transcriptionService.send(data.media.payload);
      } else {
        console.log('Message from client:', data);
      }
    } catch (err) {
      console.log('Error parsing message:', err);
    }
  });

  ws.on('close', () => {
    console.log(' WebSocket connection closed');
  });

  ws.on('error', (err) => {
    console.error(' WebSocket error:', err);
  });
});

// Supervisor endpoints
app.get('/supervisor/requests/pending', async (req, res) => {
  try {
    const requests = await FirebaseHelpRequestManager.getPendingRequests();
    res.json(requests);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch pending requests' });
  }
});

app.get('/supervisor/requests', async (req, res) => {
  try {
    const requests = await FirebaseHelpRequestManager.getAllRequests();
    res.json(requests);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch all requests' });
  }
});

app.post('/supervisor/requests/:id/answer', async (req, res) => {
  const requestId = req.params.id;
  const { answer } = req.body;

  try {
    const resolvedRequest = await FirebaseHelpRequestManager.resolveRequest(requestId, answer);

    console.log(
      `Simulated text to caller (callSid: ${resolvedRequest.callSid}): The supervisor answered your question: "${answer}"`.cyan
    );

    // Update GPT knowledge base with the supervisor's answer
    gptService.updateKnowledgeBase(resolvedRequest.question, answer);

    res.json(resolvedRequest);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

app.get('/supervisor/knowledge-base', async (req, res) => {
  try {
    const knowledgeBase = await FirebaseHelpRequestManager.getKnowledgeBase();
    res.json(knowledgeBase);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch knowledge base' });
  }
});

// Start HTTP server
app.listen(PORT, () => {
  console.log(` Server running on port ${PORT}`.green);
});
