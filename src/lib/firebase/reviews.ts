import { db } from './config';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  orderBy,
  getDocs,
  getDoc,
  setDoc,
  limit,
  startAfter,
  serverTimestamp,
  Timestamp,
  QueryDocumentSnapshot,
  runTransaction
} from 'firebase/firestore';
import { logger } from '@/lib/utils/logger';
import type { Review, UserRating, ReviewFilters } from '@/types/reviews';
import { createReviewSchema, updateReviewSchema, type CreateReviewInput, type UpdateReviewInput } from '@/lib/validations/reviews';

export interface ReviewPage {
  reviews: Review[];
  nextCursor: QueryDocumentSnapshot | null;
  hasMore: boolean;
}

export const reviewsService = {
  async getReviews(
    options: {
      limit?: number;
      cursor?: QueryDocumentSnapshot | null;
      filters?: ReviewFilters;
    } = {}
  ): Promise<ReviewPage> {
    try {
      const { limit: pageLimit = 10, cursor, filters = {} } = options;
      
      let q = query(
        collection(db, 'reviews'),
        orderBy('createdAt', 'desc')
      );

      if (filters.reviewedUserId) {
        q = query(q, where('reviewedUserId', '==', filters.reviewedUserId));
      }
      if (filters.reviewerId) {
        q = query(q, where('reviewerId', '==', filters.reviewerId));
      }
      if (filters.projectId) {
        q = query(q, where('projectId', '==', filters.projectId));
      }
      if (filters.category) {
        q = query(q, where('category', '==', filters.category));
      }

      q = query(q, limit(pageLimit + 1));
      
      if (cursor) {
        q = query(q, startAfter(cursor));
      }

      const snapshot = await getDocs(q);
      const docs = snapshot.docs;
      const hasMore = docs.length > pageLimit;
      const reviews = (hasMore ? docs.slice(0, pageLimit) : docs).map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          reviewerId: data.reviewerId,
          reviewedUserId: data.reviewedUserId,
          projectId: data.projectId,
          rating: data.rating,
          comment: data.comment,
          reviewerName: data.reviewerName,
          reviewerAvatar: data.reviewerAvatar || undefined,
          category: data.category,
          createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
          updatedAt: data.updatedAt 
            ? ((data.updatedAt as Timestamp)?.toDate() || new Date())
            : new Date(),
        } as Review;
      });

      // Filtrar por minRating si se especifica
      const filteredReviews = filters.minRating
        ? reviews.filter(r => r.rating >= filters.minRating!)
        : reviews;

      return {
        reviews: filteredReviews,
        nextCursor: hasMore ? docs[pageLimit] : null,
        hasMore,
      };
    } catch (error) {
      logger.error('Error fetching reviews', error as Error);
      throw error;
    }
  },

  async getReviewsForUser(userId: string, limitCount?: number): Promise<Review[]> {
    try {
      let q = query(
        collection(db, 'reviews'),
        where('reviewedUserId', '==', userId),
        orderBy('createdAt', 'desc')
      );

      if (limitCount) {
        q = query(q, limit(limitCount));
      }

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
          updatedAt: data.updatedAt 
            ? ((data.updatedAt as Timestamp)?.toDate() || new Date())
            : new Date(),
        } as Review;
      });
    } catch (error) {
      logger.error('Error fetching reviews for user', error as Error, { userId });
      throw error;
    }
  },

  async getReviewsByUser(userId: string, limitCount?: number): Promise<Review[]> {
    try {
      let q = query(
        collection(db, 'reviews'),
        where('reviewerId', '==', userId),
        orderBy('createdAt', 'desc')
      );

      if (limitCount) {
        q = query(q, limit(limitCount));
      }

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
          updatedAt: data.updatedAt 
            ? ((data.updatedAt as Timestamp)?.toDate() || new Date())
            : new Date(),
        } as Review;
      });
    } catch (error) {
      logger.error('Error fetching reviews by user', error as Error, { userId });
      throw error;
    }
  },

  async getReview(reviewId: string): Promise<Review | null> {
    try {
      const docRef = doc(db, 'reviews', reviewId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      return {
        id: docSnap.id,
        ...docSnap.data(),
        createdAt: (docSnap.data().createdAt as Timestamp)?.toDate() || new Date(),
        updatedAt: docSnap.data().updatedAt 
          ? ((docSnap.data().updatedAt as Timestamp)?.toDate() || new Date())
          : undefined,
      } as Review;
    } catch (error) {
      logger.error('Error fetching review', error as Error, { reviewId });
      throw error;
    }
  },

  async createReview(data: CreateReviewInput): Promise<string> {
    try {
      // Validar con Zod
      const validatedData = createReviewSchema.parse(data);

      // Validar que no exista ya una reseña del mismo usuario para el mismo proyecto
      if (validatedData.projectId) {
        const existingReviewQuery = query(
          collection(db, 'reviews'),
          where('reviewerId', '==', validatedData.reviewerId),
          where('projectId', '==', validatedData.projectId)
        );
        const existingReview = await getDocs(existingReviewQuery);
        
        if (!existingReview.empty) {
          throw new Error('Ya has creado una reseña para este proyecto');
        }
      }

      // Usar transacción para crear la reseña y actualizar el rating del usuario
      let reviewId: string;
      
      await runTransaction(db, async (transaction) => {
        // Crear la reseña
        const reviewRef = doc(collection(db, 'reviews'));
        transaction.set(reviewRef, {
          ...validatedData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        reviewId = reviewRef.id;

        // Actualizar o crear el rating del usuario
        const ratingRef = doc(db, 'user-ratings', validatedData.reviewedUserId);
        const ratingDoc = await transaction.get(ratingRef);

        if (ratingDoc.exists()) {
          const currentRating = ratingDoc.data() as UserRating;
          const newTotalReviews = currentRating.totalReviews + 1;
          const newAverage = 
            (currentRating.averageRating * currentRating.totalReviews + validatedData.rating) / newTotalReviews;
          
          const newBreakdown = { ...currentRating.ratingBreakdown };
          newBreakdown[validatedData.rating as keyof typeof newBreakdown]++;

          transaction.update(ratingRef, {
            averageRating: newAverage,
            totalReviews: newTotalReviews,
            ratingBreakdown: newBreakdown,
            lastUpdated: serverTimestamp(),
          });
        } else {
          // Crear nuevo rating
          const newBreakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
          newBreakdown[validatedData.rating as keyof typeof newBreakdown] = 1;

          transaction.set(ratingRef, {
            userId: validatedData.reviewedUserId,
            averageRating: validatedData.rating,
            totalReviews: 1,
            ratingBreakdown: newBreakdown,
            lastUpdated: serverTimestamp(),
          });
        }
      });

      return reviewId!;
    } catch (error) {
      logger.error('Error creating review', error as Error);
      throw error;
    }
  },

  async updateReview(reviewId: string, data: UpdateReviewInput): Promise<void> {
    try {
      // Validar con Zod
      const validatedData = updateReviewSchema.parse(data);

      // Obtener la reseña actual para recalcular el rating si cambió
      const reviewRef = doc(db, 'reviews', reviewId);
      const reviewDoc = await getDoc(reviewRef);
      
      if (!reviewDoc.exists()) {
        throw new Error('Reseña no encontrada');
      }

      const currentReview = reviewDoc.data() as Review;
      const oldRating = currentReview.rating;
      const newRating = validatedData.rating;

      await runTransaction(db, async (transaction) => {
        // Actualizar la reseña
        transaction.update(reviewRef, {
          ...validatedData,
          updatedAt: serverTimestamp(),
        });

        // Si cambió el rating, recalcular el promedio del usuario
        if (newRating && newRating !== oldRating) {
          const ratingRef = doc(db, 'user-ratings', currentReview.reviewedUserId);
          const ratingDoc = await transaction.get(ratingRef);

          if (ratingDoc.exists()) {
            const currentRating = ratingDoc.data() as UserRating;
            const newBreakdown = { ...currentRating.ratingBreakdown };
            
            // Decrementar el rating anterior
            newBreakdown[oldRating as keyof typeof newBreakdown]--;
            // Incrementar el nuevo rating
            newBreakdown[newRating as keyof typeof newBreakdown]++;

            // Recalcular promedio
            const total = Object.values(newBreakdown).reduce((sum, count) => sum + count, 0);
            const sum = Object.entries(newBreakdown).reduce(
              (acc, [rating, count]) => acc + parseInt(rating) * count,
              0
            );
            const newAverage = total > 0 ? sum / total : 0;

            transaction.update(ratingRef, {
              averageRating: newAverage,
              ratingBreakdown: newBreakdown,
              lastUpdated: serverTimestamp(),
            });
          }
        }
      });
    } catch (error) {
      logger.error('Error updating review', error as Error, { reviewId });
      throw error;
    }
  },

  async deleteReview(reviewId: string): Promise<void> {
    try {
      // Obtener la reseña antes de eliminarla para recalcular el rating
      const reviewRef = doc(db, 'reviews', reviewId);
      const reviewDoc = await getDoc(reviewRef);
      
      if (!reviewDoc.exists()) {
        throw new Error('Reseña no encontrada');
      }

      const review = reviewDoc.data() as Review;

      await runTransaction(db, async (transaction) => {
        // Eliminar la reseña
        transaction.delete(reviewRef);

        // Actualizar el rating del usuario
        const ratingRef = doc(db, 'user-ratings', review.reviewedUserId);
        const ratingDoc = await transaction.get(ratingRef);

        if (ratingDoc.exists()) {
          const currentRating = ratingDoc.data() as UserRating;
          const newTotalReviews = Math.max(0, currentRating.totalReviews - 1);
          
          if (newTotalReviews === 0) {
            // Si no quedan reseñas, eliminar el documento de rating
            transaction.delete(ratingRef);
          } else {
            const newBreakdown = { ...currentRating.ratingBreakdown };
            newBreakdown[review.rating as keyof typeof newBreakdown]--;

            // Recalcular promedio
            const total = Object.values(newBreakdown).reduce((sum, count) => sum + count, 0);
            const sum = Object.entries(newBreakdown).reduce(
              (acc, [rating, count]) => acc + parseInt(rating) * count,
              0
            );
            const newAverage = total > 0 ? sum / total : 0;

            transaction.update(ratingRef, {
              averageRating: newAverage,
              totalReviews: newTotalReviews,
              ratingBreakdown: newBreakdown,
              lastUpdated: serverTimestamp(),
            });
          }
        }
      });
    } catch (error) {
      logger.error('Error deleting review', error as Error, { reviewId });
      throw error;
    }
  },

  async getUserRating(userId: string): Promise<UserRating | null> {
    try {
      const ratingRef = doc(db, 'user-ratings', userId);
      const ratingDoc = await getDoc(ratingRef);

      if (!ratingDoc.exists()) {
        return null;
      }

      const data = ratingDoc.data();
      return {
        userId: data.userId,
        averageRating: data.averageRating,
        totalReviews: data.totalReviews,
        ratingBreakdown: data.ratingBreakdown,
        lastUpdated: (data.lastUpdated as Timestamp)?.toDate() || new Date(),
      } as UserRating;
    } catch (error) {
      logger.error('Error getting user rating', error as Error, { userId });
      throw error;
    }
  },

  async updateUserRating(userId: string): Promise<UserRating> {
    try {
      // Obtener todas las reseñas del usuario
      const reviews = await this.getReviewsForUser(userId);

      if (reviews.length === 0) {
        // Si no hay reseñas, eliminar el documento de rating si existe
        const ratingRef = doc(db, 'user-ratings', userId);
        const ratingDoc = await getDoc(ratingRef);
        if (ratingDoc.exists()) {
          await deleteDoc(ratingRef);
        }
        throw new Error('No hay reseñas para calcular el rating');
      }

      // Calcular rating
      const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
      let totalRating = 0;

      reviews.forEach(review => {
        breakdown[review.rating as keyof typeof breakdown]++;
        totalRating += review.rating;
      });

      const averageRating = totalRating / reviews.length;

      const userRating: UserRating = {
        userId,
        averageRating,
        totalReviews: reviews.length,
        ratingBreakdown: breakdown,
        lastUpdated: new Date(),
      };

      // Guardar en Firestore
      const ratingRef = doc(db, 'user-ratings', userId);
      await setDoc(ratingRef, {
        ...userRating,
        lastUpdated: serverTimestamp(),
      }, { merge: true });

      return userRating;
    } catch (error) {
      logger.error('Error updating user rating', error as Error, { userId });
      throw error;
    }
  },
};

