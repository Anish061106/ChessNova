import { z } from 'zod';

export const updateProfileSchema = z.object({
  displayName: z
    .string()
    .trim()
    .max(50, 'Display name cannot exceed 50 characters')
    .optional()
    .nullable(),
  avatarUrl: z
    .string()
    .trim()
    .max(300, 'Avatar URL cannot exceed 300 characters')
    .optional()
    .nullable(),
  country: z
    .string()
    .trim()
    .max(4, 'Country code cannot exceed 4 characters')
    .optional()
    .nullable(),
  bio: z
    .string()
    .trim()
    .max(300, 'Bio cannot exceed 300 characters')
    .optional()
    .nullable(),
});

export const updateSettingsSchema = z.object({
  theme: z.enum(['dark', 'light', 'system']).optional(),
  boardTheme: z.enum(['classic', 'modern', 'midnight', 'highContrast']).optional(),
  pieceSet: z.string().max(30).optional(),
  soundEnabled: z.boolean().optional(),
  animationEnabled: z.boolean().optional(),
  showLegalMoves: z.boolean().optional(),
  showCoordinates: z.boolean().optional(),
  highlightLastMove: z.boolean().optional(),
  confirmMoves: z.boolean().optional(),
  autoQueen: z.boolean().optional(),
  animationSpeed: z.enum(['slow', 'normal', 'fast']).optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
