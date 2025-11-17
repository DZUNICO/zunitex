import { Timestamp } from 'firebase/firestore';

export type RatingValue = 1 | 2 | 3 | 4 | 5;
export type ReviewCategory = 'technical' | 'communication' | 'quality' | 'punctuality';

export interface Review {
  id: string;
  reviewerId: string;        // Quien hace la reseña
  reviewedUserId: string;    // Usuario/empresa reseñado
  projectId?: string;        // Proyecto relacionado (opcional)
  rating: RatingValue;       // Calificación
  comment: string;
  reviewerName: string;
  reviewerAvatar?: string;
  category: ReviewCategory;
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
}

export interface UserRating {
  userId: string;
  averageRating: number;     // Promedio calculado
  totalReviews: number;
  ratingBreakdown: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
  lastUpdated: Timestamp | Date;
}

export interface ReviewFilters {
  reviewedUserId?: string;
  reviewerId?: string;
  projectId?: string;
  category?: ReviewCategory;
  minRating?: RatingValue;
}

