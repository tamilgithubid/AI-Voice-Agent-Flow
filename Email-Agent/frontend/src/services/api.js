const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

async function request(path, body) {
  const response = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

export async function sendMessage(text, sessionId) {
  return request('/api/agent/message', { text, sessionId });
}

export async function confirmEmail(sessionId, confirmed, emailData) {
  return request('/api/agent/confirm', { sessionId, confirmed, emailData });
}
