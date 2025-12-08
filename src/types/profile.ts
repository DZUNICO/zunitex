// Tipo base para usuario
import { UserRole, UserType } from './roles';

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
    role: UserRole;  // Actualizado para usar el tipo completo de roles
    userType?: UserType;  // Tipo de usuario (categoría de negocio)
    photoURL?: string;  // Campo original de avatar
    certifications?: string[];
  }
  
  // Tipo específico para el header del perfil
  export interface ProfileHeader extends BaseProfile {
    id: string;  // Requerido específicamente para el header
    photoURL: string | null;
    role: UserRole;  // Usar el tipo completo de roles
    userType?: UserType;  // Tipo de usuario para mostrar
  }
  
  // Props para el componente ProfileHeader
  export interface ProfileHeaderProps {
    profile: ProfileHeader;
  }
  
  // Función helper para transformar UserProfile a ProfileHeader
  export function transformUserToProfileHeader(user: UserProfile): ProfileHeader {
    return {
      id: user.id || user.email, // Usar ID si existe, sino usar email como fallback
      displayName: user.displayName,
      email: user.email,
      about: user.about,
      location: user.location,
      specialties: user.specialties,
      rating: user.rating,
      projectsCount: user.projectsCount,
      createdAt: user.createdAt,
      role: user.role,
      userType: user.userType,  // Incluir userType
      photoURL: user.photoURL || null
    };
  }
  export interface ProfileTabsProps {
    profile: UserProfile;
    userId?: string; // ID del usuario para obtener proyectos (si no se proporciona, usa el usuario actual)
  }