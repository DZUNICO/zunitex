import { db } from './config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

/**
 * Crea un post de blog de prueba
 * Solo para desarrollo - usado por /api/init-blog
 */
export async function createSampleBlogPost(): Promise<string> {
  try {
    const blogRef = collection(db, 'blog');
    
    const docRef = await addDoc(blogRef, {
      title: 'Post de Prueba - Inicialización',
      content: `# Post de Prueba

Este es un post de blog de prueba generado automáticamente para inicializar la base de datos.

## Contenido de ejemplo

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.

### Características

- Item 1
- Item 2
- Item 3

Este post puede ser eliminado después de la inicialización.`,
      excerpt: 'Post de prueba generado automáticamente para inicializar la base de datos',
      category: 'Tutorial',
      tags: ['test', 'demo', 'inicialización'],
      author: 'Sistema',
      authorId: 'system',
      authorName: 'Sistema',
      authorAvatar: null,
      slug: 'post-de-prueba-inicializacion',
      coverImage: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      featured: false,
      published: true,
      likes: 0,
      comments: 0,
      views: 0,
    });
    
    console.log('Sample blog post created with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error creating sample blog post:', error);
    throw error;
  }
}

/**
 * Puedes agregar más funciones de inicialización aquí en el futuro
 * Por ejemplo: createSampleProject, createSampleCommunityPost, etc.
 */




