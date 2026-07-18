import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../app';
import { prisma } from '../utils/prisma';

describe('API Routes Integration Tests', () => {
  let stadiumId: string = '00000000-0000-0000-0000-000000000000';
  let zoneId: string = '00000000-0000-0000-0000-000000000000';

  beforeAll(async () => {
    // Query active database to get real IDs for testing
    const stadium = await prisma.stadium.findFirst();
    if (stadium) {
      stadiumId = stadium.id;
      const zone = await prisma.zone.findFirst({ where: { stadiumId } });
      if (zone) {
        zoneId = zone.id;
      }
    }
  });

  describe('GET /api/hierarchy', () => {
    it('returns the stadium country hierarchy', async () => {
      const res = await request(app).get('/api/hierarchy');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/stadium', () => {
    it('returns 400 bad request for invalid/missing stadiumId', async () => {
      const res = await request(app).get('/api/stadium?stadiumId=not-a-uuid');
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('returns zones and events for valid stadiumId', async () => {
      const res = await request(app).get(`/api/stadium?stadiumId=${stadiumId}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('zones');
      expect(res.body.data).toHaveProperty('events');
    });
  });

  describe('GET /api/dashboard', () => {
    it('returns 400 bad request for invalid stadiumId', async () => {
      const res = await request(app).get('/api/dashboard?stadiumId=not-a-uuid');
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('returns live KPIs and aggregated analytics for valid stadiumId', async () => {
      const res = await request(app).get(`/api/dashboard?stadiumId=${stadiumId}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('stadiumName');
      expect(res.body.data).toHaveProperty('kpis');
      expect(res.body.data.kpis).toHaveProperty('totalSpectators');
      expect(res.body.data.kpis).toHaveProperty('activeIncidents');
    });
  });

  describe('POST /api/incident and resolve flow', () => {
    let createdIncidentId: string;

    it('returns 400 for invalid incident creation data', async () => {
      const res = await request(app)
        .post('/api/incident')
        .send({
          type: 'SPILL',
          description: '', // too short
          zoneId: 'not-a-uuid'
        });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('creates a new incident with sanitization and returns 201', async () => {
      const maliciousDescription = '<p>Water spill near Gate 4</p>';
      const res = await request(app)
        .post('/api/incident')
        .send({
          type: 'SPILL',
          description: maliciousDescription,
          zoneId
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.description).toBe('Water spill near Gate 4'); // Tags stripped
      expect(res.body.data.status).toBe('OPEN');
      createdIncidentId = res.body.data.id;
    });

    it('resolves the created incident and returns success', async () => {
      if (!createdIncidentId) return;

      const res = await request(app)
        .post('/api/incident/resolve')
        .send({ id: createdIncidentId });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('RESOLVED');
    });
  });
});
