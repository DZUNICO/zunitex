import { db } from './config';
import { 
  collection, 
  doc, 
  setDoc, 
  writeBatch,
  serverTimestamp
} from 'firebase/firestore';

export async function initializeDatabase() {
  try {
    console.log('🚀 Iniciando configuración de la base de datos...');

    // Crear colecciones principales con documentos iniciales
    const collections = {
      users: {
        settings: {
          created: serverTimestamp(),
          initialized: true
        }
      },
      projects: {
        settings: {
          created: serverTimestamp(),
          initialized: true
        }
      },
      followers: {
        settings: {
          created: serverTimestamp(),
          initialized: true
        }
      },
      reviews: {
        settings: {
          created: serverTimestamp(),
          initialized: true
        }
      },
      resources: {
        settings: {
          created: serverTimestamp(),
          initialized: true
        }
      }
    };

    const batch = writeBatch(db);

    // Crear cada colección con su documento de configuración
    for (const [collectionName, initialData] of Object.entries(collections)) {
      console.log(`📁 Creando colección: ${collectionName}`);
      const settingsRef = doc(db, collectionName, 'settings');
      batch.set(settingsRef, initialData);
    }

    await batch.commit();
    console.log('✅ Base de datos inicializada correctamente');
    return true;
  } catch (error) {
    console.error('❌ Error inicializando la base de datos:', error);
    throw error;
  }
}

export async function seedDatabase(userId: string) {
  try {
    console.log('🌱 Iniciando población de datos de ejemplo...');
    const batch = writeBatch(db);

    // 1. Crear/Actualizar usuario
    const userRef = doc(db, 'users', userId);
    const userData = {
      email: 'usuario@ejemplo.com',
      displayName: 'Usuario Ejemplo',
      role: 'user',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      projectsCount: 2, // Número de proyectos que crearemos
      rating: 4.5,
      specialties: ['Residencial', 'Comercial', 'Industrial'],
      followers: 2, // Número de seguidores que crearemos
      resources: 2  // Número de recursos que crearemos
    };
    batch.set(userRef, userData, { merge: true });

    // 2. Crear proyectos ejemplo
    const projects = [
      {
        title: 'Instalación Eléctrica Residencial',
        status: 'en_progreso',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        userId: userId,
        clientName: 'Juan Pérez',
        location: 'Santiago Centro',
        budget: 2500000,
        type: 'Residencial',
        description: 'Instalación completa para casa de 120m²'
      },
      {
        title: 'Mantenimiento Sistema Solar',
        status: 'pendiente',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        userId: userId,
        clientName: 'María González',
        location: 'Las Condes',
        budget: 1800000,
        type: 'Solar',
        description: 'Mantenimiento anual de paneles solares'
      }
    ];

    // 3. Crear reviews ejemplo
    const reviews = [
      {
        projectId: 'proyecto_ejemplo_1',
        userId: userId,
        clientId: 'cliente_1',
        rating: 5,
        comment: 'Excelente trabajo y profesionalismo',
        createdAt: serverTimestamp()
      },
      {
        projectId: 'proyecto_ejemplo_2',
        userId: userId,
        clientId: 'cliente_2',
        rating: 4,
        comment: 'Muy buen servicio, recomendado',
        createdAt: serverTimestamp()
      }
    ];

    // 4. Crear recursos ejemplo
    const resources = [
      {
        title: 'Guía de Instalación Eléctrica Residencial',
        type: 'guia',
        userId: userId,
        createdAt: serverTimestamp(),
        downloads: 12,
        description: 'Manual completo para instalaciones eléctricas domiciliarias'
      },
      {
        title: 'Plantilla de Presupuesto',
        type: 'plantilla',
        userId: userId,
        createdAt: serverTimestamp(),
        downloads: 25,
        description: 'Formato profesional para presupuestos eléctricos'
      }
    ];

    // 5. Crear followers ejemplo
    const followers = [
      {
        followerId: 'follower_1',
        followingId: userId,
        createdAt: serverTimestamp()
      },
      {
        followerId: 'follower_2',
        followingId: userId,
        createdAt: serverTimestamp()
      }
    ];

    // Añadir todos los documentos al batch
    projects.forEach((project) => {
      const projectRef = doc(collection(db, 'projects'));
      batch.set(projectRef, project);
    });

    reviews.forEach((review) => {
      const reviewRef = doc(collection(db, 'reviews'));
      batch.set(reviewRef, review);
    });

    resources.forEach((resource) => {
      const resourceRef = doc(collection(db, 'resources'));
      batch.set(resourceRef, resource);
    });

    followers.forEach((follower) => {
      const followerRef = doc(collection(db, 'followers'));
      batch.set(followerRef, follower);
    });

    // Ejecutar todas las operaciones
    await batch.commit();
    console.log('✅ Datos de ejemplo creados correctamente');
    return true;
  } catch (error) {
    console.error('❌ Error creando datos de ejemplo:', error);
    throw error;
  }
}