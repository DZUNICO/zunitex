export type ProjectStatus = 'Pendiente' | 'En Progreso' | 'Completado';
export type ProjectCategory = 'Residencial' | 'Comercial' | 'Industrial' | 'Solar';

export interface Project {
  id: string;
  title: string;
  description: string;
  status: ProjectStatus;
  category: ProjectCategory;
  budget: number;
  location: string;
  clientId?: string;
  clientName: string;
  startDate?: Date;
  createdBy: string;
  createdAt: Date;
  images: string[];
  tags: string[];
}
export type CreateProjectData = Omit<Project, 'id' | 'createdBy' | 'createdAt'> & {
    title: string;
    description: string;
    category: ProjectCategory;
    budget: number;
    location: string;
    clientName: string;
};