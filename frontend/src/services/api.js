const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3001';
const WS_URL = process.env.REACT_APP_WS_URL || 'ws://localhost:3001/ws';

// Send a chat message (non-streaming)
export async function sendMessage(message, threadId) {
  const res = await fetch(`${API_BASE}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-User-Id': getUserId(),
    },
    body: JSON.stringify({ message, threadId }),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }

  return res.json();
}

// Send a chat message with SSE streaming
export async function sendMessageStream(message, threadId, onToken, onDone, onError) {
  try {
    const res = await fetch(`${API_BASE}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': getUserId(),
      },
      body: JSON.stringify({ message, threadId, stream: true }),
    });

    if (!res.ok) {
      throw new Error('Stream request failed');
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            if (data.type === 'token') onToken(data.content);
            else if (data.type === 'done') onDone(data);
            else if (data.type === 'error') onError(data.message);
          } catch {
            // Skip malformed JSON
          }
        }
      }
    }
  } catch (err) {
    onError(err.message);
  }
}

// WebSocket connection for real-time streaming
export function createWebSocket(onToken, onDone, onError) {
  const ws = new WebSocket(WS_URL);

  ws.onopen = () => console.log('WebSocket connected');

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      switch (data.type) {
        case 'token': onToken(data.content); break;
        case 'done': onDone(data); break;
        case 'thread': break; // Thread ID received
        case 'error': onError(data.message); break;
        default: break;
      }
    } catch {
      // Skip malformed messages
    }
  };

  ws.onerror = () => onError('WebSocket connection error');
  ws.onclose = () => console.log('WebSocket disconnected');

  return {
    send: (message, threadId) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ message, threadId, userId: getUserId() }));
      }
    },
    close: () => ws.close(),
    isOpen: () => ws.readyState === WebSocket.OPEN,
  };
}

// Get conversation history
export async function getHistory(threadId) {
  const res = await fetch(`${API_BASE}/api/chat/history/${threadId}`, {
    headers: { 'X-User-Id': getUserId() },
  });
  return res.json();
}

// Clear conversation
export async function clearHistory(threadId) {
  const res = await fetch(`${API_BASE}/api/chat/history/${threadId}`, {
    method: 'DELETE',
    headers: { 'X-User-Id': getUserId() },
  });
  return res.json();
}

// Simple user ID management (in production, use proper auth)
function getUserId() {
  let userId = localStorage.getItem('agent-flow-user-id');
  if (!userId) {
    userId = 'user-' + Math.random().toString(36).slice(2, 9);
    localStorage.setItem('agent-flow-user-id', userId);
  }
  return userId;
}

export { getUserId };
