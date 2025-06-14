// Tipo base para usuario
  export interface BaseProfile {
    displayName: string;
    email: string;
    about?: string;
    location?: string;
    specialties: string[];
    rating: number;
    projectsCount: number;
    createdAt: string;
    photoURL?: string | null; // Añadimos esto para la imagen de perfil
  }

  // Tipo específico para UserProfile (como viene de la autenticación)
  export interface UserProfile extends BaseProfile {
    id?: string;
    phone: string;
    role: 'admin' | 'user';
    photoURL?: string;  // Campo original de avatar
    certifications?: string[];
  }
  
  // Tipo específico para el header del perfil
  export interface ProfileHeader extends BaseProfile {
    id: string;  // Requerido específicamente para el header
    photoURL: string | null;
    role: 'admin' | 'user';
  }
  
  // Props para el componente ProfileHeader
  export interface ProfileHeaderProps {
    profile: ProfileHeader;
  }
  
  // Función helper para transformar UserProfile a ProfileHeader
  export function transformUserToProfileHeader(user: UserProfile): ProfileHeader {
    return {
      id: user.email, // Usando email como ID si no hay uno específico
      displayName: user.displayName,
      email: user.email,
      about: user.about,
      location: user.location,
      specialties: user.specialties,
      rating: user.rating,
      projectsCount: user.projectsCount,
      createdAt: user.createdAt,
      role: user.role,
      photoURL: user.photoURL || null
    };
  }
  export interface ProfileTabsProps {
    profile: UserProfile;
  }