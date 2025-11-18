import { z } from 'zod';

export const createPostSchema = z.object({
  content: z
    .string()
    .min(10, 'El contenido debe tener al menos 10 caracteres')
    .max(1000, 'El contenido no puede exceder 1000 caracteres'),
  category: z.enum(['question', 'discussion', 'showcase', 'tip', 'news'], {
    required_error: 'Debes seleccionar una categoría',
  }),
  tags: z
    .array(z.string().min(1).max(20))
    .max(5, 'Máximo 5 tags permitidos')
    .default([]),
  images: z
    .array(z.string().url('URL de imagen inválida'))
    .max(5, 'Máximo 5 imágenes permitidas')
    .optional()
    .default([]),
  userRole: z.enum(['technician', 'engineer', 'vendor', 'company']).default('technician'),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;

export const updatePostSchema = createPostSchema.partial().extend({
  content: z
    .string()
    .min(10, 'El contenido debe tener al menos 10 caracteres')
    .max(1000, 'El contenido no puede exceder 1000 caracteres')
    .optional(),
});

export type UpdatePostInput = z.infer<typeof updatePostSchema>;

export const createCommentSchema = z.object({
  content: z
    .string()
    .min(1, 'El comentario no puede estar vacío')
    .max(500, 'El comentario no puede exceder 500 caracteres'),
  postId: z.string().min(1, 'ID de post requerido'),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;

