
const { initializeApp, applicationDefault, cert } = require('firebase-admin/app');
const { getFirestore, Timestamp, FieldValue } = require('firebase-admin/firestore');
const EventEmitter = require('events');
const serviceAccount = require('./zinc-crow-394412-0dfeaff3dcd5.json');

class FirebaseHelpRequestManager extends EventEmitter {
  constructor() {
    super();

    initializeApp({
      credential: cert(serviceAccount),
      projectId: 'zinc-crow-394412', // Explicitly setting the projectId (optional but helps with debugging)
    });

    this.db = getFirestore();
    this.requestsCollection = this.db.collection('helpRequests');
    this.knowledgeBaseCollection = this.db.collection('knowledgeBase');
    this.timeoutDuration = 5 * 60 * 1000; // 5 minutes
  }

  async createRequest(question, callSid) {
    const request = {
      question,
      callSid,
      status: 'pending',
      createdAt: Timestamp.now(),
      answer: null,
      resolvedAt: null,
    };
    const docRef = await this.requestsCollection.add(request);

    // Set timeout to mark unresolved
    setTimeout(() => {
      this.markUnresolved(docRef.id);
    }, this.timeoutDuration);

    const savedRequest = { id: docRef.id, ...request };
    this.emit('requestCreated', savedRequest);
    return savedRequest;
  }

  async markUnresolved(requestId) {
    const docRef = this.requestsCollection.doc(requestId);
    const doc = await docRef.get();
    if (!doc.exists) {
      console.log(`Request ID ${requestId} not found for unresolved marking.`);
      return;
    }
    const request = doc.data();
    if (request.status === 'pending') {
      await docRef.update({
        status: 'unresolved',
        resolvedAt: Timestamp.now(),
      });
      this.emit('requestUnresolved', { id: requestId, ...request, status: 'unresolved', resolvedAt: Timestamp.now() });
      console.log(`Request ID ${requestId} marked as unresolved due to timeout.`);
    }
  }

  async resolveRequest(requestId, answer) {
    const docRef = this.requestsCollection.doc(requestId);
    const doc = await docRef.get();
    if (!doc.exists) {
      throw new Error(`Request with id ${requestId} not found`);
    }

    const request = doc.data();
    const resolvedAt = Timestamp.now();

    await docRef.update({
      status: 'resolved',
      answer,
      resolvedAt,
    });

    console.log('Resolving request:', requestId, 'with answer:', answer);
    console.log('KnowledgeBase document path:', this.knowledgeBaseCollection.doc(requestId).path);

    try {
      await this.knowledgeBaseCollection.doc(requestId).set({
        question: request.question,
        answer,
        updatedAt: resolvedAt,
      });
    } catch (error) {
      console.error('Failed to write to knowledge base:', error);
      throw error;
    }

    const resolvedRequest = { id: requestId, ...request, status: 'resolved', answer, resolvedAt };
    this.emit('requestResolved', resolvedRequest);
    return resolvedRequest;
  }

  async getPendingRequests() {
    const snapshot = await this.requestsCollection.where('status', '==', 'pending').get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  async getAllRequests() {
    const snapshot = await this.requestsCollection.get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  async getKnowledgeBase() {
    const snapshot = await this.knowledgeBaseCollection.get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }
}

module.exports = new FirebaseHelpRequestManager();
