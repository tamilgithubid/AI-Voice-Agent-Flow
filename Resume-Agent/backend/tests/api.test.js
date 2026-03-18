const request = require('supertest');
const express = require('express');
const resumeRoutes = require('../src/routes/resume');
const healthRoutes = require('../src/routes/health');
const authRoutes = require('../src/routes/auth');
const { authMiddleware } = require('../src/middleware/auth');

// Create a test app
function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use('/health', healthRoutes);
  app.use('/api/auth', authRoutes);
  // Mock auth for testing
  app.use('/api/resume', (req, res, next) => {
    req.userId = 'user-1';
    next();
  }, resumeRoutes);
  return app;
}

describe('API Endpoints', () => {
  let app;

  beforeAll(() => {
    app = createTestApp();
  });

  describe('GET /health', () => {
    it('should return healthy status', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('healthy');
      expect(res.body).toHaveProperty('uptime');
      expect(res.body).toHaveProperty('timestamp');
    });
  });

  describe('POST /api/auth/token', () => {
    it('should generate a JWT token', async () => {
      const res = await request(app)
        .post('/api/auth/token')
        .send({ userId: 'user-1' });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeTruthy();
    });

    it('should reject missing userId', async () => {
      const res = await request(app)
        .post('/api/auth/token')
        .send({});
      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/resume/:userId', () => {
    it('should return resume for existing user', async () => {
      const res = await request(app).get('/api/resume/user-1');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('John Doe');
    });

    it('should return 404 for non-existent user', async () => {
      const res = await request(app).get('/api/resume/non-existent');
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/resume/save', () => {
    it('should save resume data', async () => {
      const res = await request(app)
        .post('/api/resume/save')
        .send({ name: 'Test User', skills: ['Node.js'] });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should reject invalid email format', async () => {
      const res = await request(app)
        .post('/api/resume/save')
        .send({ email: 'not-an-email' });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation failed');
    });
  });
});
