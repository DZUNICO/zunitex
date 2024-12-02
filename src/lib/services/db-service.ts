/* import { 
    doc, 
    collection,
    getDoc,
    getDocs,
    setDoc,
    updateDoc,
    increment,
    query,
    where,
    orderBy,
    limit,
    Timestamp,
    runTransaction
  } from 'firebase/firestore';
  import { db } from '@/lib/firebase/config';
  
  export const dbService = {
    // Obtener estadísticas del usuario
    async getUserStats(userId: string) {
      try {
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (!userDoc.exists()) throw new Error('Usuario no encontrado');
  
        // Obtener proyectos
        const projectsQuery = query(
          collection(db, 'projects'),
          where('userId', '==', userId)
        );
        const projectsSnap = await getDocs(projectsQuery);
        
        // Obtener valoraciones
        const reviewsQuery = query(
          collection(db, 'reviews'),
          where('userId', '==', userId)
        );
        const reviewsSnap = await getDocs(reviewsQuery);
        
        // Calcular valoración promedio
        let totalRating = 0;
        reviewsSnap.forEach(doc => {
          totalRating += doc.data().rating;
        });
        const averageRating = reviewsSnap.size > 0 
          ? totalRating / reviewsSnap.size 
          : 0;
  
        return {
          projectsCount: projectsSnap.size,
          activeProjects: projectsSnap.docs.filter(
            doc => doc.data().status !== 'completado'
          ).length,
          rating: averageRating,
          reviewsCount: reviewsSnap.size,
          followers: userDoc.data().followers || 0,
          resourcesCount: userDoc.data().resources || 0
        };
      } catch (error) {
        console.error('Error getting user stats:', error);
        throw error;
      }
    },
  
    // Crear nuevo proyecto
    async createProject(projectData: any) {
      try {
        const projectRef = doc(collection(db, 'projects'));
        
        await runTransaction(db, async (transaction) => {
          // Crear el proyecto
          transaction.set(projectRef, {
            ...projectData,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
          });
  
          // Actualizar contador de proyectos del usuario
          const userRef = doc(db, 'users', projectData.userId);
          transaction.update(userRef, {
            projectsCount: increment(1)
          });
        });
  
        return projectRef.id;
      } catch (error) {
        console.error('Error creating project:', error);
        throw error;
      }
    },
  
    // Seguir a un usuario
    async followUser(followerId: string, followingId: string) {
      try {
        await runTransaction(db, async (transaction) => {
          // Crear registro de seguidor
          const followRef = doc(collection(db, 'followers'));
          transaction.set(followRef, {
            followerId,
            followingId,
            createdAt: Timestamp.now()
          });
  
          // Actualizar contadores
          const userRef = doc(db, 'users', followingId);
          transaction.update(userRef, {
            followers: increment(1)
          });
        });
      } catch (error) {
        console.error('Error following user:', error);
        throw error;
      }
    },
  
    // Crear una reseña
    async createReview(reviewData: any) {
      try {
        await runTransaction(db, async (transaction) => {
          // Crear la reseña
          const reviewRef = doc(collection(db, 'reviews'));
          transaction.set(reviewRef, {
            ...reviewData,
            createdAt: Timestamp.now()
          });
  
          // Actualizar estadísticas del usuario
          const userRef = doc(db, 'users', reviewData.userId);
          const userDoc = await transaction.get(userRef);
          
          if (!userDoc.exists()) throw new Error('Usuario no encontrado');
          
          const userData = userDoc.data();
          const currentRating = userData.rating || 0;
          const currentReviews = userData.reviewsCount || 0;
          
          // Calcular nueva valoración promedio
          const newRating = (currentRating * currentReviews + reviewData.rating) / (currentReviews + 1);
          
          transaction.update(userRef, {
            rating: newRating,
            reviewsCount: increment(1)
          });
        });
      } catch (error) {
        console.error('Error creating review:', error);
        throw error;
      }
    },
  
    // Obtener proyectos recientes
    async getRecentProjects(userId: string) {
      try {
        const projectsQuery = query(
          collection(db, 'projects'),
          where('userId', '==', userId),
          orderBy('createdAt', 'desc'),
          limit(5)
        );
        
        const snapshot = await getDocs(projectsQuery);
        return snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      } catch (error) {
        console.error('Error getting recent projects:', error);
        throw error;
      }
    }
  }; */