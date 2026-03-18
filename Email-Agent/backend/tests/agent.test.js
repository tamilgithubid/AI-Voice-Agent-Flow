const request = require('supertest');
const app = require('../src/server');

// Mock fetch for n8n calls
global.fetch = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
});

describe('Health Check', () => {
  it('GET /api/health returns healthy status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
    expect(res.body).toHaveProperty('timestamp');
    expect(res.body).toHaveProperty('uptime');
  });
});

describe('POST /api/agent/message', () => {
  it('returns 400 for empty text', async () => {
    const res = await request(app)
      .post('/api/agent/message')
      .send({ text: '' });
    expect(res.status).toBe(400);
  });

  it('returns 400 for missing text', async () => {
    const res = await request(app)
      .post('/api/agent/message')
      .send({});
    expect(res.status).toBe(400);
  });

  it('returns 400 for text exceeding max length', async () => {
    const res = await request(app)
      .post('/api/agent/message')
      .send({ text: 'a'.repeat(2001) });
    expect(res.status).toBe(400);
  });

  it('forwards valid message to n8n and returns response', async () => {
    const mockResponse = {
      action: 'send_email',
      to: 'hr@company.com',
      subject: 'Leave Request',
      body: 'I will be on leave tomorrow.',
      response: 'I have drafted an email for you.',
    };

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const res = await request(app)
      .post('/api/agent/message')
      .send({ text: 'Send email to HR saying I am on leave tomorrow' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.action).toBe('send_email');
  });

  it('returns 502 when n8n is unreachable', async () => {
    global.fetch.mockRejectedValueOnce(new Error('Connection refused'));

    const res = await request(app)
      .post('/api/agent/message')
      .send({ text: 'Send an email' });

    expect(res.status).toBe(502);
    expect(res.body.error).toContain('Failed to process');
  });
});

describe('POST /api/agent/confirm', () => {
  it('returns 400 for missing fields', async () => {
    const res = await request(app)
      .post('/api/agent/confirm')
      .send({ sessionId: '123' });
    expect(res.status).toBe(400);
  });

  it('returns 400 for invalid email address', async () => {
    const res = await request(app)
      .post('/api/agent/confirm')
      .send({
        sessionId: '123',
        confirmed: true,
        emailData: { to: 'not-an-email', subject: 'Test', body: 'Test body' },
      });
    expect(res.status).toBe(400);
  });

  it('returns success for cancelled email', async () => {
    const res = await request(app)
      .post('/api/agent/confirm')
      .send({
        sessionId: '123',
        confirmed: false,
        emailData: { to: 'test@example.com', subject: 'Test', body: 'Body' },
      });

    expect(res.status).toBe(200);
    expect(res.body.data.sent).toBe(false);
  });

  it('sends confirmed email via n8n', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, message: 'Email sent', sent: true }),
    });

    const res = await request(app)
      .post('/api/agent/confirm')
      .send({
        sessionId: '123',
        confirmed: true,
        emailData: { to: 'hr@company.com', subject: 'Leave', body: 'On leave tomorrow' },
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

describe('Validators', () => {
  const { validateEmail } = require('../src/utils/validators');

  it('validates correct emails', () => {
    expect(validateEmail('user@example.com')).toBe(true);
    expect(validateEmail('test.name@domain.co.uk')).toBe(true);
  });

  it('rejects invalid emails', () => {
    expect(validateEmail('not-email')).toBe(false);
    expect(validateEmail('@domain.com')).toBe(false);
    expect(validateEmail('user@')).toBe(false);
    expect(validateEmail('')).toBe(false);
  });
});
