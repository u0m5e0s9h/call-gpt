const EventEmitter = require('events');

class HelpRequestManager extends EventEmitter {
  constructor() {
    super();
    this.requests = new Map(); // key: requestId, value: request object
    this.knowledgeBase = new Map(); // key: question, value: answer
    this.nextRequestId = 1;
    this.timeoutDuration = 5 * 60 * 1000; // 5 minutes timeout for unresolved requests
    this.timeoutHandles = new Map(); // key: requestId, value: timeout handle
  }

  createRequest(question, callSid) {
    const requestId = this.nextRequestId++;
    const request = {
      id: requestId,
      question,
      callSid,
      status: 'pending',
      createdAt: new Date(),
      answer: null,
      resolvedAt: null,
    };
    this.requests.set(requestId, request);

    // Set timeout to mark request as unresolved if not resolved in time
    const timeoutHandle = setTimeout(() => {
      this.markUnresolved(requestId);
    }, this.timeoutDuration);
    this.timeoutHandles.set(requestId, timeoutHandle);

    this.emit('requestCreated', request);
    return request;
  }

  markUnresolved(requestId) {
    const request = this.requests.get(requestId);
    if (request && request.status === 'pending') {
      request.status = 'unresolved';
      request.resolvedAt = new Date();
      this.emit('requestUnresolved', request);
      console.log(`Request ID ${requestId} marked as unresolved due to timeout.`);
    }
    // Clear timeout handle
    this.timeoutHandles.delete(requestId);
  }

  resolveRequest(requestId, answer) {
    const request = this.requests.get(requestId);
    if (!request) {
      throw new Error(`Request with id ${requestId} not found`);
    }
    request.status = 'resolved';
    request.answer = answer;
    request.resolvedAt = new Date();
    this.knowledgeBase.set(request.question, answer);

    // Clear timeout if resolved before timeout
    const timeoutHandle = this.timeoutHandles.get(requestId);
    if (timeoutHandle) {
      clearTimeout(timeoutHandle);
      this.timeoutHandles.delete(requestId);
    }

    this.emit('requestResolved', request);
    return request;
  }

  getPendingRequests() {
    return Array.from(this.requests.values()).filter(r => r.status === 'pending');
  }

  getAllRequests() {
    return Array.from(this.requests.values());
  }

  getKnowledgeBase() {
    return Array.from(this.knowledgeBase.entries()).map(([question, answer]) => ({ question, answer }));
  }
}

module.exports = new HelpRequestManager();
