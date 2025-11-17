import { z } from 'zod';

export const createResourceSchema = z.object({
  userId: z.string().min(1, 'ID de usuario requerido'),
  userName: z.string().min(1, 'Nombre de usuario requerido'),
  userAvatar: z.string().url().optional().nullable(),
  title: z.string().min(3, 'El título debe tener al menos 3 caracteres').max(200, 'El título no puede exceder 200 caracteres'),
  description: z.string().min(10, 'La descripción debe tener al menos 10 caracteres').max(1000, 'La descripción no puede exceder 1000 caracteres'),
  category: z.enum(['diagram', 'document', 'photo', 'video', 'tool', 'guide']),
  subcategory: z.enum(['residential', 'industrial', 'solar', 'commercial', 'maintenance', 'safety']).optional(),
  fileUrl: z.string().url('URL de archivo inválida'),
  fileName: z.string().min(1, 'Nombre de archivo requerido'),
  fileSize: z.number().positive('El tamaño del archivo debe ser positivo').max(100 * 1024 * 1024, 'El archivo no puede exceder 100MB'),
  fileType: z.string().min(1, 'Tipo de archivo requerido'),
  thumbnailUrl: z.string().url().optional().nullable(),
  tags: z.array(z.string()).max(10, 'Máximo 10 tags permitidos').default([]),
  isPublic: z.boolean().default(true),
  isPremium: z.boolean().default(false),
});

export type CreateResourceInput = z.infer<typeof createResourceSchema>;

export const updateResourceSchema = createResourceSchema.partial().extend({
  title: z.string().min(3).max(200).optional(),
  description: z.string().min(10).max(1000).optional(),
});

export type UpdateResourceInput = z.infer<typeof updateResourceSchema>;

