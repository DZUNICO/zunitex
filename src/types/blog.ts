export interface BlogPost {
  id?: string; // Opcional porque se genera automáticamente
  title: string;
  content: string;
  summary: string;
  category: string;
  authorId: string;
  authorName: string;
  authorPhotoURL?: string | null;
  likesCount: number;
  commentsCount: number;
  status: 'published' | 'draft';
  createdAt: Date | string;
  updatedAt?: Date | string;
  imageUrl: string;  // URL de la imagen principal
  imageUrls: string[]; // Array con todas las URLs de imágenes
}

export type CreateBlogPostData = Omit<BlogPost, 'id' | 'createdAt' | 'updatedAt' | 'likesCount' | 'commentsCount'>;

export type UpdateBlogPostData = Partial<Omit<BlogPost, 'id' | 'createdAt' | 'authorName'>>;