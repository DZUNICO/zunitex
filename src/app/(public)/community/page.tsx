'use client';

import { useState } from 'react';
import { useCommunityPosts } from '@/lib/react-query/queries';
import { CommunityPostCard } from '@/components/community/community-post-card';
import { CreatePostForm } from '@/components/community/create-post-form';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Sparkles, Clock } from 'lucide-react';
import type { CommunityFilters } from '@/types/community';
import { useQueryClient } from '@tanstack/react-query';

export default function CommunityPage() {
  const queryClient = useQueryClient();
  const [sortBy, setSortBy] = useState<'recent' | 'hot'>('hot');
  
  // Filtros para posts destacados (con más likes o recientes)
  const hotFilters: CommunityFilters = {
    isPinned: undefined, // Todos los posts
  };
  
  const recentFilters: CommunityFilters = {
    isPinned: undefined,
  };

  const { 
    data, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage,
    isLoading 
  } = useCommunityPosts(sortBy === 'hot' ? hotFilters : recentFilters);

  const posts = data?.pages.flatMap(page => page.posts) || [];
  
  // Ordenar posts: destacados por likes, recientes por fecha
  const sortedPosts = [...posts].sort((a, b) => {
    if (sortBy === 'hot') {
      // Ordenar por likes (descendente), luego por fecha
      if (b.likes !== a.likes) {
        return b.likes - a.likes;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    } else {
      // Ordenar por fecha (más recientes primero)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  const handlePostCreated = () => {
    // Invalidar queries para refrescar la lista
    queryClient.invalidateQueries({ queryKey: ['community'] });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Comunidad</h1>
          <p className="text-muted-foreground">
            Conecta con otros electricistas, comparte experiencias y aprende juntos
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sidebar izquierdo - Crear post */}
          <div className="lg:col-span-1 order-2 lg:order-1">
            <div className="sticky top-4">
              <CreatePostForm onSuccess={handlePostCreated} />
            </div>
          </div>

          {/* Contenido principal - Feed */}
          <div className="lg:col-span-2 order-1 lg:order-2">
            <Tabs value={sortBy} onValueChange={(v) => setSortBy(v as 'recent' | 'hot')} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="hot" className="gap-2">
                  <Sparkles className="h-4 w-4" />
                  Destacados
                </TabsTrigger>
                <TabsTrigger value="recent" className="gap-2">
                  <Clock className="h-4 w-4" />
                  Recientes
                </TabsTrigger>
              </TabsList>

              <TabsContent value="hot" className="space-y-4">
                {isLoading ? (
                  <div className="flex justify-center items-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : sortedPosts.length === 0 ? (
                  <div className="text-center py-12 bg-white rounded-xl">
                    <p className="text-muted-foreground mb-4">
                      No hay posts destacados aún.
                    </p>
                    <p className="text-sm text-muted-foreground">
                      ¡Sé el primero en compartir algo!
                    </p>
                  </div>
                ) : (
                  <>
                    {sortedPosts.map((post) => (
                      <CommunityPostCard key={post.id} post={post} />
                    ))}

                    {hasNextPage && (
                      <div className="flex justify-center pt-4">
                        <Button
                          onClick={() => fetchNextPage()}
                          disabled={isFetchingNextPage}
                          variant="outline"
                        >
                          {isFetchingNextPage ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Cargando...
                            </>
                          ) : (
                            'Cargar más posts'
                          )}
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </TabsContent>

              <TabsContent value="recent" className="space-y-4">
                {isLoading ? (
                  <div className="flex justify-center items-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : sortedPosts.length === 0 ? (
                  <div className="text-center py-12 bg-white rounded-xl">
                    <p className="text-muted-foreground mb-4">
                      No hay posts recientes aún.
                    </p>
                    <p className="text-sm text-muted-foreground">
                      ¡Sé el primero en compartir algo!
                    </p>
                  </div>
                ) : (
                  <>
                    {sortedPosts.map((post) => (
                      <CommunityPostCard key={post.id} post={post} />
                    ))}

                    {hasNextPage && (
                      <div className="flex justify-center pt-4">
                        <Button
                          onClick={() => fetchNextPage()}
                          disabled={isFetchingNextPage}
                          variant="outline"
                        >
                          {isFetchingNextPage ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Cargando...
                            </>
                          ) : (
                            'Cargar más posts'
                          )}
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}

