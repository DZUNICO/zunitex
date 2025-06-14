// app/(public)/blog/page.tsx
import { Suspense } from 'react';
import { BlogGrid } from '@/components/blog/blog-grid';
import { blogService } from '@/lib/firebase/blog';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default async function BlogPage() {
    
  try {
    const posts = await blogService.getPosts();
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold"></h1>
        <Button variant="default">
          <Link href="/admin/blog/newpost">Nuevo Post</Link>
        </Button>
      </div>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Blog</h1>
            <p className="text-muted-foreground">
              Artículos y tutoriales sobre instalaciones eléctricas
            </p>
          </div>
        </div>

        <Suspense fallback={<div>Cargando artículos...</div>}>
          {posts.length > 0 ? (
            <BlogGrid posts={posts} />
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                No hay artículos publicados aún.
              </p>
            </div>
          )}
        </Suspense>
      </div>
    );
  } catch (error) {
    console.error('Error loading blog posts:', error);
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p className="text-red-500">
            Error al cargar los artículos. Por favor, intenta más tarde.
          </p>
        </div>
      </div>
    );
  }
}