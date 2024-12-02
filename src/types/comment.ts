// types/comment.ts
export interface Comment {
  id?: string;
  projectId: string;
  userId: string;
  userDisplayName: string;
  photoURL?: string | null;
  content: string;
  createdAt: Date | string;  // Puede ser string cuando viene de Firebase
  updatedAt?: Date | string;
  parentId?: string;
  replies?: Comment[];
}