const WebSocket = require('ws');

const ws = new WebSocket('ws://localhost:3000/connection');

ws.on('open', () => {
  console.log('WebSocket connection opened');

  // Send start event to initiate stream
  ws.send(JSON.stringify({
    event: 'start',
    start: {
      streamSid: 'test-stream-1',
      callSid: 'test-call-1'
    }
  }));

  // Simulate sending media events every second
  let sequenceNumber = 1;
  const interval = setInterval(() => {
    const mediaPayload = Buffer.from('fake audio data').toString('base64');
    ws.send(JSON.stringify({
      event: 'media',
      media: {
        payload: mediaPayload
      },
      sequenceNumber: sequenceNumber++
    }));

    if (sequenceNumber > 5) {
      clearInterval(interval);
      // Send stop event
      ws.send(JSON.stringify({
        event: 'stop'
      }));
      ws.close();
    }
  }, 1000);
});

ws.on('message', (data) => {
  console.log('Received from server:', data);
});

ws.on('close', () => {
  console.log('WebSocket connection closed');
});

ws.on('error', (error) => {
  console.error('WebSocket error:', error);
});
