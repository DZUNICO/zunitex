import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function toDate(date: Date | string | { seconds: number; nanoseconds: number }) {
  if (date instanceof Date) return date;
  if (typeof date === 'string') return new Date(date);
  if ('seconds' in date) return new Date(date.seconds * 1000);
  return new Date();
}

// Y usarla en el componente funcion toDate:
/* {formatDistanceToNow(toDate(comment.createdAt), {
  addSuffix: true,
  locale: es
})} */