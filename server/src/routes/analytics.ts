import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma';
import { z } from 'zod';
import { generateAnalyticsDigest } from '../services/gemini';
import { rateLimiter } from '../middleware/rateLimiter';

const router = Router();

const analyticsQuerySchema = z.object({
  stadiumId: z.string().uuid('Invalid Stadium ID format'),
  lang: z.enum(['en', 'es', 'fr']).default('en')
});

// Wrap async handlers
const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// GET /api/analytics/digest
// Generates a professional operational & safety digest using Gemini
router.get('/digest', rateLimiter, asyncHandler(async (req: Request, res: Response) => {
  const validation = analyticsQuerySchema.safeParse(req.query);
  if (!validation.success) {
    return res.status(400).json({ success: false, message: validation.error.issues[0].message });
  }

  const { stadiumId, lang } = validation.data;

  // Generate digest from Gemini service
  const digest = await generateAnalyticsDigest(stadiumId, lang);

  res.json({
    success: true,
    data: {
      digest
    }
  });
}));

export default router;
