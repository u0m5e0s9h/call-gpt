async function fetchPendingRequests() {
  const res = await fetch('/supervisor/requests/pending');
  return res.json();
}

async function fetchAllRequests() {
  const res = await fetch('/supervisor/requests');
  return res.json();
}

async function fetchKnowledgeBase() {
  const res = await fetch('/supervisor/knowledge-base');
  return res.json();
}

async function submitAnswer(requestId, answer) {
  const res = await fetch(`/supervisor/requests/${requestId}/answer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ answer }),
  });
  return res.json();
}

function renderRequests(requests, showAnswerForm = false) {
  const container = document.getElementById('content');
  container.innerHTML = '';
  if (requests.length === 0) {
    container.textContent = 'No requests found.';
    return;
  }
  requests.forEach((req) => {
    const div = document.createElement('div');
    div.className = 'request ' + (req.status === 'pending' ? 'pending' : 'resolved');
    div.innerHTML = `
      <strong>Request ID:</strong> ${req.id} <br/>
      <strong>Question:</strong> ${req.question} <br/>
      <strong>Status:</strong> ${req.status} <br/>
      ${req.answer ? `<strong>Answer:</strong> ${req.answer} <br/>` : ''}
    `;
    if (showAnswerForm && req.status === 'pending') {
      const textarea = document.createElement('textarea');
      textarea.placeholder = 'Type your answer here...';
      const button = document.createElement('button');
      button.textContent = 'Submit Answer';
      button.onclick = async () => {
        const answer = textarea.value.trim();
        if (!answer) {
          alert('Answer cannot be empty');
          return;
        }
        await submitAnswer(req.id, answer);
        alert('Answer submitted');
        loadPendingRequests();
      };
      div.appendChild(textarea);
      div.appendChild(button);
    }
    container.appendChild(div);
  });
}

function renderKnowledgeBase(entries) {
  const container = document.getElementById('content');
  container.innerHTML = '';
  if (entries.length === 0) {
    container.textContent = 'No learned answers found.';
    return;
  }
  entries.forEach(({ question, answer }) => {
    const div = document.createElement('div');
    div.className = 'request resolved';
    div.innerHTML = `
      <strong>Question:</strong> ${question} <br/>
      <strong>Answer:</strong> ${answer} <br/>
    `;
    container.appendChild(div);
  });
}

async function loadPendingRequests() {
  const requests = await fetchPendingRequests();
  renderRequests(requests, true);
}

async function loadAllRequests() {
  const requests = await fetchAllRequests();
  renderRequests(requests, false);
}

async function loadKnowledgeBase() {
  const entries = await fetchKnowledgeBase();
  renderKnowledgeBase(entries);
}

document.getElementById('btnPending').addEventListener('click', loadPendingRequests);
document.getElementById('btnAll').addEventListener('click', loadAllRequests);
document.getElementById('btnKnowledge').addEventListener('click', loadKnowledgeBase);

// Load pending requests by default
loadPendingRequests();
