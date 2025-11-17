import { z } from 'zod';

export const createReviewSchema = z.object({
  reviewerId: z.string().min(1, 'ID del revisor requerido'),
  reviewedUserId: z.string().min(1, 'ID del usuario reseñado requerido'),
  projectId: z.string().optional(),
  rating: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]),
  comment: z.string().min(10, 'El comentario debe tener al menos 10 caracteres').max(1000, 'El comentario no puede exceder 1000 caracteres'),
  reviewerName: z.string().min(1, 'Nombre del revisor requerido'),
  reviewerAvatar: z.string().url().optional().nullable(),
  category: z.enum(['technical', 'communication', 'quality', 'punctuality']),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;

export const updateReviewSchema = createReviewSchema.partial().extend({
  rating: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]).optional(),
  comment: z.string().min(10).max(1000).optional(),
});

export type UpdateReviewInput = z.infer<typeof updateReviewSchema>;

