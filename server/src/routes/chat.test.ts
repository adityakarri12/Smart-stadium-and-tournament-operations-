import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import app from '../app';

// Mock the Gemini service to prevent making real LLM calls during tests
vi.mock('../services/gemini', () => {
  return {
    generateStadiumResponse: vi.fn().mockImplementation(async (query: string) => {
      return `Mocked AI response for query: "${query}"`;
    })
  };
});

describe('Chat Route Integration Tests', () => {
  describe('POST /api/chat', () => {
    it('returns 400 bad request if message is empty', async () => {
      const res = await request(app)
        .post('/api/chat')
        .send({
          message: '',
          stadiumId: '00000000-0000-0000-0000-000000000000'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBeDefined();
    });

    it('returns 400 bad request for invalid stadiumId format', async () => {
      const res = await request(app)
        .post('/api/chat')
        .send({
          message: 'Hello',
          stadiumId: 'invalid-id-format'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('returns 200 with mocked AI reply for valid inputs', async () => {
      const res = await request(app)
        .post('/api/chat')
        .send({
          message: 'How can I find the step-free restroom?',
          stadiumId: 'c1a7b4f5-5d9c-4b6a-9f8e-d2b3c4a5b6c7',
          userProfile: {
            name: 'Alex Johnson',
            preferredLanguage: 'en',
            accessibilityPreference: 'step-free',
            ticketSection: 'North Stand',
            seatNumber: 'B-12'
          }
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.reply).toBe('Mocked AI response for query: "How can I find the step-free restroom?"');
    });
  });
});
