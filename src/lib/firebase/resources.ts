import { db, storage } from './config';
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
  limit,
  startAfter,
  increment,
  serverTimestamp,
  Timestamp,
  QueryDocumentSnapshot
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject,
  UploadMetadata
} from 'firebase/storage';
import { logger } from '@/lib/utils/logger';
import type { Resource, ResourceFilters } from '@/types/resources';
import { createResourceSchema, updateResourceSchema, type CreateResourceInput, type UpdateResourceInput } from '@/lib/validations/resources';

export interface ResourcePage {
  resources: Resource[];
  nextCursor: QueryDocumentSnapshot | null;
  hasMore: boolean;
}

export const resourcesService = {
  async getResources(
    options: {
      limit?: number;
      cursor?: QueryDocumentSnapshot | null;
      filters?: ResourceFilters;
    } = {}
  ): Promise<ResourcePage> {
    try {
      const { limit: pageLimit = 10, cursor, filters = {} } = options;
      
      let q = query(
        collection(db, 'resources'),
        orderBy('createdAt', 'desc')
      );

      if (filters.userId) {
        q = query(q, where('userId', '==', filters.userId));
      }
      if (filters.category) {
        q = query(q, where('category', '==', filters.category));
      }
      if (filters.subcategory) {
        q = query(q, where('subcategory', '==', filters.subcategory));
      }
      if (filters.isPublic !== undefined) {
        q = query(q, where('isPublic', '==', filters.isPublic));
      }

      q = query(q, limit(pageLimit + 1));
      
      if (cursor) {
        q = query(q, startAfter(cursor));
      }

      const snapshot = await getDocs(q);
      const docs = snapshot.docs;
      const hasMore = docs.length > pageLimit;
      let resources = (hasMore ? docs.slice(0, pageLimit) : docs).map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          userId: data.userId,
          userName: data.userName,
          userAvatar: data.userAvatar || undefined,
          title: data.title,
          description: data.description,
          category: data.category,
          subcategory: data.subcategory,
          fileUrl: data.fileUrl,
          fileName: data.fileName,
          fileSize: data.fileSize,
          fileType: data.fileType,
          thumbnailUrl: data.thumbnailUrl || undefined,
          tags: data.tags || [],
          downloads: data.downloads || 0,
          likes: data.likes || 0,
          views: data.views || 0,
          isPublic: data.isPublic ?? true,
          isPremium: data.isPremium ?? false,
          createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
          updatedAt: data.updatedAt 
            ? ((data.updatedAt as Timestamp)?.toDate() || new Date())
            : new Date(),
        } as Resource;
      });

      // Filtrar por tags o búsqueda si se especifica
      if (filters.tags && filters.tags.length > 0) {
        resources = resources.filter(r => 
          filters.tags!.some(tag => r.tags.includes(tag))
        );
      }

      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        resources = resources.filter(r => 
          r.title.toLowerCase().includes(searchLower) ||
          r.description.toLowerCase().includes(searchLower) ||
          r.tags.some(tag => tag.toLowerCase().includes(searchLower))
        );
      }

      return {
        resources,
        nextCursor: hasMore ? docs[pageLimit] : null,
        hasMore,
      };
    } catch (error) {
      logger.error('Error fetching resources', error as Error);
      throw error;
    }
  },

  async getResource(resourceId: string): Promise<Resource | null> {
    try {
      const docRef = doc(db, 'resources', resourceId);
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
      } as Resource;
    } catch (error) {
      logger.error('Error fetching resource', error as Error, { resourceId });
      throw error;
    }
  },

  async uploadResource(
    file: File,
    metadata: {
      userId: string;
      fileName?: string;
      path?: string;
    }
  ): Promise<{ url: string; thumbnailUrl?: string }> {
    try {
      const { userId, fileName, path = 'resources' } = metadata;
      const fileExt = file.name.split('.').pop();
      const storageFileName = fileName || `${Date.now()}-${file.name}`;
      const storagePath = `${path}/${userId}/${storageFileName}`;
      
      const storageRef = ref(storage, storagePath);
      const uploadMetadata: UploadMetadata = {
        contentType: file.type,
        customMetadata: {
          uploadedBy: userId,
          originalName: file.name,
        },
      };

      // Subir archivo
      const snapshot = await uploadBytes(storageRef, file, uploadMetadata);
      const url = await getDownloadURL(snapshot.ref);

      // Si es imagen, generar thumbnail
      let thumbnailUrl: string | undefined;
      if (file.type.startsWith('image/')) {
        // Nota: Para generar thumbnails reales, necesitarías usar una función de Cloud Functions
        // Por ahora, usamos la misma URL (en producción deberías generar thumbnails)
        thumbnailUrl = url;
      }

      return { url, thumbnailUrl };
    } catch (error) {
      logger.error('Error uploading resource', error as Error);
      throw error;
    }
  },

  async createResource(data: CreateResourceInput): Promise<string> {
    try {
      // Validar con Zod
      const validatedData = createResourceSchema.parse(data);

      const docRef = await addDoc(collection(db, 'resources'), {
        ...validatedData,
        downloads: 0,
        likes: 0,
        views: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      logger.error('Error creating resource', error as Error);
      throw error;
    }
  },

  async updateResource(resourceId: string, data: UpdateResourceInput): Promise<void> {
    try {
      // Validar con Zod
      const validatedData = updateResourceSchema.parse(data);

      const docRef = doc(db, 'resources', resourceId);
      await updateDoc(docRef, {
        ...validatedData,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      logger.error('Error updating resource', error as Error, { resourceId });
      throw error;
    }
  },

  async deleteResource(resourceId: string): Promise<void> {
    try {
      // Obtener el recurso para eliminar el archivo de Storage
      const resourceRef = doc(db, 'resources', resourceId);
      const resourceDoc = await getDoc(resourceRef);

      if (resourceDoc.exists()) {
        const resourceData = resourceDoc.data() as Resource;
        
        // Eliminar archivo de Storage si existe
        if (resourceData.fileUrl) {
          try {
            const fileRef = ref(storage, resourceData.fileUrl);
            await deleteObject(fileRef);
          } catch (storageError) {
            logger.warn('Error deleting file from storage', { resourceId, fileUrl: resourceData.fileUrl });
          }
        }

        // Eliminar thumbnail si existe
        if (resourceData.thumbnailUrl) {
          try {
            const thumbnailRef = ref(storage, resourceData.thumbnailUrl);
            await deleteObject(thumbnailRef);
          } catch (storageError) {
            logger.warn('Error deleting thumbnail from storage', { resourceId });
          }
        }
      }

      // Eliminar documento de Firestore
      await deleteDoc(resourceRef);
    } catch (error) {
      logger.error('Error deleting resource', error as Error, { resourceId });
      throw error;
    }
  },

  async likeResource(userId: string, resourceId: string): Promise<void> {
    try {
      // Verificar si ya existe el like
      const likeQuery = query(
        collection(db, 'resource-likes'),
        where('userId', '==', userId),
        where('resourceId', '==', resourceId)
      );
      const existingLike = await getDocs(likeQuery);

      if (!existingLike.empty) {
        throw new Error('Ya has dado like a este recurso');
      }

      // Crear like y actualizar contador
      await Promise.all([
        addDoc(collection(db, 'resource-likes'), {
          userId,
          resourceId,
          createdAt: serverTimestamp(),
        }),
        updateDoc(doc(db, 'resources', resourceId), {
          likes: increment(1),
        }),
      ]);
    } catch (error) {
      logger.error('Error liking resource', error as Error, { userId, resourceId });
      throw error;
    }
  },

  async unlikeResource(userId: string, resourceId: string): Promise<void> {
    try {
      const likeQuery = query(
        collection(db, 'resource-likes'),
        where('userId', '==', userId),
        where('resourceId', '==', resourceId)
      );
      const existingLike = await getDocs(likeQuery);

      if (existingLike.empty) {
        throw new Error('No has dado like a este recurso');
      }

      // Eliminar like y actualizar contador
      await Promise.all([
        ...existingLike.docs.map(doc => deleteDoc(doc.ref)),
        updateDoc(doc(db, 'resources', resourceId), {
          likes: increment(-1),
        }),
      ]);
    } catch (error) {
      logger.error('Error unliking resource', error as Error, { userId, resourceId });
      throw error;
    }
  },

  async isResourceLiked(userId: string, resourceId: string): Promise<boolean> {
    try {
      const likeQuery = query(
        collection(db, 'resource-likes'),
        where('userId', '==', userId),
        where('resourceId', '==', resourceId)
      );
      const snapshot = await getDocs(likeQuery);
      return !snapshot.empty;
    } catch (error) {
      logger.error('Error checking resource like status', error as Error);
      return false;
    }
  },

  async incrementDownload(resourceId: string): Promise<void> {
    try {
      const resourceRef = doc(db, 'resources', resourceId);
      await updateDoc(resourceRef, {
        downloads: increment(1),
      });
    } catch (error) {
      logger.error('Error incrementing download', error as Error, { resourceId });
      throw error;
    }
  },

  async incrementView(resourceId: string): Promise<void> {
    try {
      const resourceRef = doc(db, 'resources', resourceId);
      await updateDoc(resourceRef, {
        views: increment(1),
      });
    } catch (error) {
      logger.error('Error incrementing view', error as Error, { resourceId });
      throw error;
    }
  },
};

