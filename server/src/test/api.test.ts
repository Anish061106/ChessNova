import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';

describe('ChessNova Backend API Tests', () => {
  const app = createApp();

  it('GET /api/health returns HTTP 200 with ok status and service identifier', async () => {
    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
    expect(response.body.service).toBe('chessnova-api');
    expect(['connected', 'disconnected']).toContain(response.body.database);
  });

  it('GET /api/nonexistent returns HTTP 404 with error message', async () => {
    const response = await request(app).get('/api/nonexistent');

    expect(response.status).toBe(404);
    expect(response.body.status).toBe('error');
    expect(response.body.message).toContain('Resource not found');
  });
});
