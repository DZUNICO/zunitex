// app/(public)/blog/page.tsx
import { Suspense } from 'react';
import { BlogGrid } from '@/components/blog/blog-grid';
import { FeaturedPosts } from '@/components/blog/featured-posts';
import { CategoryTabs } from '@/components/blog/category-tabs';
import { blogService } from '@/lib/firebase/blog';

export default async function BlogPage() {
  try {
    const posts = await blogService.getPublishedPosts();
    const featuredPosts = posts.slice(0, 3); // Tomamos los 3 primeros posts como destacados
    const regularPosts = posts.slice(3);

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          {/* Categories Section */}
          <div className="flex overflow-x-auto py-4 mb-8 gap-4 hide-scrollbar">
            <CategoryTabs 
              categories={[
                "Automatizacion",
                "Cables Eléctricos",
                "Industrial",
                "Residencial"
              ]} 
            />
          </div>

          {/* Featured Posts Section */}
          <div className="mb-12">
            <Suspense fallback={<div>Cargando posts destacados...</div>}>
              <FeaturedPosts posts={featuredPosts} />
            </Suspense>
          </div>

          {/* Editor's Pick Section */}
          <div className="mb-12">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Artículos</h2>
              <button className="text-blue-600 hover:text-blue-700">
                Ver todos
              </button>
            </div>
            <Suspense fallback={<div>Cargando artículos...</div>}>
              {regularPosts.length > 0 ? (
                <BlogGrid posts={regularPosts} />
              ) : (
                <div className="text-center py-12 bg-white rounded-xl">
                  <p className="text-muted-foreground">
                    No hay artículos publicados aún.
                  </p>
                </div>
              )}
            </Suspense>
          </div>
        </div>
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