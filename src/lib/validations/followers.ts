import { z } from 'zod';

export const followUserSchema = z.object({
  followerId: z.string().min(1, 'ID de seguidor requerido'),
  followingId: z.string().min(1, 'ID de usuario a seguir requerido'),
  followerName: z.string().min(1, 'Nombre del seguidor requerido'),
  followerAvatar: z.string().url().optional().nullable(),
  followingName: z.string().min(1, 'Nombre del usuario seguido requerido'),
  followingAvatar: z.string().url().optional().nullable(),
});

export type FollowUserInput = z.infer<typeof followUserSchema>;

