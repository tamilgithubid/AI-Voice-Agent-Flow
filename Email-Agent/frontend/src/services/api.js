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
  return request('/api/agent/confirm', { sessionId, confirmed, type: 'email', emailData });
}

export async function confirmWhatsApp(sessionId, confirmed, messageData) {
  return request('/api/agent/confirm', { sessionId, confirmed, type: 'whatsapp', emailData: messageData });
}

export async function smartCompose({ body, subject, type }) {
  return request('/api/agent/smart-compose', { body, subject, type });
}

export async function chatWithAI(text, history, sessionId, mode = 'general') {
  return request('/api/agent/chat', { text, history, sessionId, mode });
}

// Fetch available voices list
export async function fetchVoices() {
  const API = process.env.REACT_APP_API_URL || 'http://localhost:3001';
  const response = await fetch(`${API}/api/agent/voices`);
  if (!response.ok) throw new Error('Failed to fetch voices');
  return response.json();
}

// ElevenLabs TTS — returns audio blob or null if not configured
export async function fetchTTS(text, gender = 'female', mode = 'general', voiceId = '') {
  const API = process.env.REACT_APP_API_URL || 'http://localhost:3001';
  const response = await fetch(`${API}/api/agent/tts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, gender, mode, voiceId }),
  });

  // Any non-OK status = fallback to browser TTS
  if (!response.ok) {
    return null;
  }

  return response.blob();
}
