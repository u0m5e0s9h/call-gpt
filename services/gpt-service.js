

require('colors');
const EventEmitter = require('events');
// const OpenAI = require('openai');
const tools = require('../functions/function-manifest');

// Import all functions included in function manifest
// Note: the function name and file name must be the same
const availableFunctions = {};
tools.forEach((tool) => {
  let functionName = tool.function.name;
  availableFunctions[functionName] = require(`../functions/${functionName}`);
});

class GptService extends EventEmitter {
  constructor() {
    super();
    // this.openai = new OpenAI();
    this.userContext = [
      {
        role: 'system',
        content:
          'You are a helpful AI assistant for a local salon called "Glamour Salon". The salon offers haircuts, coloring, and styling services. Business hours are Monday to Friday from 9am to 7pm, and Saturday from 10am to 5pm. Haircuts cost $30, coloring $60. The salon is located at 123 Main Street. You have a friendly and professional tone. Keep your responses brief and clear. If you don\'t know the answer, say so and ask to escalate to a human supervisor. Use natural language and be polite.',
      },
      {
        role: 'assistant',
        content: 'Hello! Welcome to Glamour Salon. How can I assist you today?',
      },
    ];
    this.partialResponseIndex = 0;

    // Add a simple knowledge base as a Map (key: question, value: answer)
    this.knowledgeBase = new Map();

    // Index to cycle through questions
    this.questionIndex = 0;

    // Predefined salon questions
    this.salonQuestions = [
      "What are your business hours?",
      "How much does a haircut cost?",
      "Do you offer hair coloring services?",
      "Where is the salon located?",
      "Can I book an appointment online?",
      "What safety measures are in place?",
      "Do you have any special offers?",
      "What products do you use?",
      "Are walk-ins welcome?",
      "What is your cancellation policy?"
    ];
  }

  // Add the callSid to the chat context
  setCallSid(callSid) {
    this.userContext.push({
      role: 'system',
      content: `callSid: ${callSid}`,
    });
  }

  validateFunctionArgs(args) {
    try {
      return JSON.parse(args);
    } catch (error) {
      console.log('Warning: Double function arguments returned by OpenAI:', args);
      if (args.indexOf('{') !== args.lastIndexOf('{')) {
        return JSON.parse(args.substring(args.indexOf(''), args.indexOf('}') + 1));
      }
    }
  }

  updateUserContext(name, role, text) {
    if (name !== 'user') {
      this.userContext.push({ role: role, name: name, content: text });
    } else {
      this.userContext.push({ role: role, content: text });
    }
  }

  // Method to update the knowledge base
  updateKnowledgeBase(question, answer) {
    this.knowledgeBase.set(question, answer);
    console.log(`Knowledge base updated with: ${question} -> ${answer}`);
  }

  async completion(text, interactionCount, role = 'user', name = 'user') {
    this.updateUserContext(name, role, text);

    let completeResponse = '';
    const question = this.salonQuestions[this.questionIndex % this.salonQuestions.length];
    this.questionIndex = (this.questionIndex + 1) % this.salonQuestions.length;

    // Check if the question exists in the knowledge base
    if (this.knowledgeBase.has(text)) {
      // Return the stored answer if the question is found in the knowledge base
      completeResponse = this.knowledgeBase.get(text);
    } else {
      // If the answer is not found, simulate a help request
      if (text.toLowerCase().includes('help') || text.toLowerCase().includes('simulated transcription text')) {
        this.emit('requestHelp', question);
        completeResponse = `Mock response to: ${question} •`;
      } else {
        completeResponse = `Mock response to: ${text} •`;
      }
    }

    this.emit(
      'gptreply',
      { partialResponseIndex: this.partialResponseIndex, partialResponse: completeResponse },
      interactionCount
    );
    this.partialResponseIndex++;

    this.userContext.push({ role: 'assistant', content: completeResponse });
    console.log(`GPT -> user context length: ${this.userContext.length}`.green);
  }
}

module.exports = { GptService };
