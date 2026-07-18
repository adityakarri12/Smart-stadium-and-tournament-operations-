import { Router, Request, Response, NextFunction } from 'express';
import { generateStadiumResponse } from '../services/gemini';
import { z } from 'zod';
import { rateLimiter } from '../middleware/rateLimiter';

const router = Router();
const MAX_CHAT_MESSAGE_LENGTH = 500;

const chatRequestSchema = z.object({
  message: z.string().trim().min(1, 'Message is required').max(MAX_CHAT_MESSAGE_LENGTH, 'Message cannot exceed 500 characters'),
  stadiumId: z.string().uuid('Invalid Stadium ID format').nullable().optional(),
  userProfile: z.object({
    name: z.string().default('Guest'),
    preferredLanguage: z.enum(['en', 'es', 'fr']).default('en'),
    accessibilityPreference: z.enum(['none', 'step-free', 'visual-assistance']).default('none'),
    ticketSection: z.string().default('General Concourse'),
    seatNumber: z.string().default('N/A')
  }).optional()
});

// Wrap async handlers
const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// POST /api/chat
router.post('/', rateLimiter, asyncHandler(async (req: Request, res: Response) => {
  const validation = chatRequestSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ 
      success: false, 
      error: validation.error.issues[0].message 
    });
  }

  const { message, stadiumId, userProfile } = validation.data;

  const responseText = await generateStadiumResponse(message, stadiumId, userProfile);
  
  res.json({
    success: true,
    data: {
      reply: responseText,
    }
  });
}));

export default router;
