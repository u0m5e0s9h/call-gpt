# GenAI Phone - Human-in-the-Loop AI Assistant for Salon

## Overview

This project implements a human-in-the-loop AI assistant for a local salon called "Glamour Salon". The system uses a mock transcription service and AI agent to handle customer questions about salon services. When the AI cannot answer a question, it creates a help request for a human supervisor to answer. The supervisor's answers are stored in a knowledge base and used by the AI to respond to repeated questions.

## MY Contribution:
  - in serviced , added firebase-help-request-manager,livekit-service.js,help-request-manager, test-firebase-help
  - modified gpt-servie , transcription-service, tts-service
  - in scripts, added media-stream-simulator
  - in public folder, added index.html, supervisor for UI

## Features

- Real-time transcription simulation of customer speech.
- AI agent cycles through predefined salon questions.
- Help requests created for unanswered questions.
- Supervisor web interface to view and answer help requests.
- Knowledge base updated with supervisor answers.
- AI responds with stored answers for repeated questions.
- Integration with Firebase Firestore for persistence.
- WebSocket communication for media streaming and control.

## Setup Instructions

1. Clone the repository:

   ```bash
   git clone <repository-url>
   cd call-gpt
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Configure environment variables:

   Create a `.env` file with necessary variables, e.g.:

   ```
   PORT=3000
   LIVEKIT_WS_URL=your_livekit_ws_url
   ```

4. Set up Firebase credentials:

   Place your Firebase service account JSON file in `call-gpt/services/` and update the path in `firebase-help-request-manager.js`.
   create accound google cloud console and then find project_id,client_email,client_email and download in json file and update the path as mention above

5. Run the application:

   ```bash
   npm start
   ```
   and also start websocket using:
   
   ```bash
     node media-stream-simulator.js
   ```

6. Access the supervisor panel:

   Open `http://localhost:3000/supervisor/index.html` in your browser.

## Design Notes

- The AI agent is implemented in `gpt-service.js` using an in-memory knowledge base Map, synchronized with Firebase on startup and after supervisor answers.
- Help requests and knowledge base entries are stored in Firebase Firestore collections.
- The transcription service is mocked for testing without external API keys.
- The supervisor panel allows viewing pending and all requests, submitting answers, and viewing the knowledge base.
- WebSocket is used for media streaming simulation and control.
- The system is designed for extensibility to integrate real transcription and AI services.

## Future Improvements

- Persist AI knowledge base in Firebase or other storage for durability.
- Integrate real transcription service (e.g., Deepgram).
- Use OpenAI API for dynamic AI responses.
- Add authentication and authorization for supervisor panel.
- Improve UI/UX of supervisor interface.
- Add real-time notifications for help requests and answers.

## License

MIT License
