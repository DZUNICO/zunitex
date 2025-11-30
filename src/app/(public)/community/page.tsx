'use client';

import { useState, useMemo, Suspense } from 'react';
import { useCommunityPosts } from '@/lib/react-query/queries';
import { CommunityPostCard } from '@/components/community/community-post-card';
import { CreatePostForm } from '@/components/community/create-post-form';
import { CommunitySidebar } from '@/components/community/community-sidebar';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Sparkles, Clock, TrendingUp, AlertCircle } from 'lucide-react';
import type { CommunityFilters } from '@/types/community';
import { useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { ErrorBoundary } from '@/components/shared/error-boundary';
import { FeedErrorFallback } from '@/components/shared/error-fallbacks';
import { QUERY_LIMITS, QUERY_MESSAGES } from '@/lib/react-query/constants';

function CommunityContent() {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const [sortBy, setSortBy] = useState<'recent' | 'hot'>('hot');
  
  // Obtener filtros de URL
  const categoryFilter = searchParams.get('category');
  const tagFilter = searchParams.get('tag');
  
  // Filtros para posts destacados (con más likes o recientes)
  const hotFilters: CommunityFilters = {
    isPinned: undefined,
    category: categoryFilter as any || undefined,
    tags: tagFilter ? [tagFilter] : undefined,
  };
  
  const recentFilters: CommunityFilters = {
    isPinned: undefined,
    category: categoryFilter as any || undefined,
    tags: tagFilter ? [tagFilter] : undefined,
  };

  const { 
    data, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage,
    isLoading 
  } = useCommunityPosts(sortBy === 'hot' ? hotFilters : recentFilters);

  const posts = data?.pages.flatMap(page => page.posts) || [];
  
  // Validación de límite de páginas
  const isNearLimit = (data?.pages.length || 0) >= 9; // 9 de 10 páginas
  
  // Ordenar posts: destacados por likes y engagement, recientes por fecha
  const sortedPosts = useMemo(() => {
    return [...posts].sort((a, b) => {
      if (sortBy === 'hot') {
        // Calcular "hot score" basado en likes, comentarios y tiempo
        const getHotScore = (post: typeof a) => {
          const likes = post.likes || 0;
          const comments = post.commentsCount || 0;
          const hoursSinceCreation = (Date.now() - new Date(post.createdAt).getTime()) / (1000 * 60 * 60);
          
          // Fórmula similar a Reddit: (likes + comments * 2) / (hours + 2)^1.5
          const engagement = likes + comments * 2;
          const timeDecay = Math.pow(hoursSinceCreation + 2, 1.5);
          return engagement / timeDecay;
        };
        
        const scoreA = getHotScore(a);
        const scoreB = getHotScore(b);
        
        if (Math.abs(scoreB - scoreA) > 0.1) {
          return scoreB - scoreA;
        }
        
        // Si los scores son muy similares, ordenar por fecha
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      } else {
        // Ordenar por fecha (más recientes primero)
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });
  }, [posts, sortBy]);

  const handlePostCreated = () => {
    // Invalidar queries para refrescar la lista
    queryClient.invalidateQueries({ queryKey: ['community'] });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-3xl font-bold">Comunidad</h1>
              <p className="text-muted-foreground mt-1">
                Conecta con otros electricistas, comparte experiencias y aprende juntos
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Contenido principal - Feed (estilo Reddit/Facebook) */}
          <div className="lg:col-span-8 space-y-4">
            {/* Formulario de crear post - en la parte superior del feed */}
            <CreatePostForm onSuccess={handlePostCreated} />

            {/* Error Boundary para el feed */}
            <ErrorBoundary
              scope="section"
              fallback={(reset) => <FeedErrorFallback onReset={reset} />}
            >
              {/* Tabs de filtros */}
              <div className="bg-white rounded-lg border shadow-sm">
              <Tabs value={sortBy} onValueChange={(v) => setSortBy(v as 'recent' | 'hot')} className="w-full">
                <div className="border-b px-4">
                  <TabsList className="bg-transparent h-auto p-0">
                    <TabsTrigger 
                      value="hot" 
                      className="gap-2 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:rounded-none"
                    >
                      <Sparkles className="h-4 w-4" />
                      Destacados
                    </TabsTrigger>
                    <TabsTrigger 
                      value="recent"
                      className="gap-2 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:rounded-none"
                    >
                      <Clock className="h-4 w-4" />
                      Recientes
                    </TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="hot" className="m-0 p-4">
                  {isLoading ? (
                    <div className="flex justify-center items-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : sortedPosts.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-muted-foreground mb-4">
                        No hay posts destacados aún.
                      </p>
                      <p className="text-sm text-muted-foreground">
                        ¡Sé el primero en compartir algo!
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-3">
                        {sortedPosts.map((post) => (
                          <CommunityPostCard key={post.id} post={post} />
                        ))}
                      </div>

                      {isNearLimit && (
                        <Alert className="mt-4">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            {QUERY_MESSAGES.NEAR_LIMIT}
                          </AlertDescription>
                        </Alert>
                      )}

                      {hasNextPage && (
                        <div className="flex justify-center pt-6">
                          <Button
                            onClick={() => fetchNextPage()}
                            disabled={isFetchingNextPage || isNearLimit}
                            variant="outline"
                            className="w-full max-w-md"
                          >
                            {isNearLimit ? (
                              `Límite alcanzado (${QUERY_LIMITS.MAX_ITEMS} items)`
                            ) : isFetchingNextPage ? (
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

                <TabsContent value="recent" className="m-0 p-4">
                  {isLoading ? (
                    <div className="flex justify-center items-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : sortedPosts.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-muted-foreground mb-4">
                        No hay posts recientes aún.
                      </p>
                      <p className="text-sm text-muted-foreground">
                        ¡Sé el primero en compartir algo!
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-3">
                        {sortedPosts.map((post) => (
                          <CommunityPostCard key={post.id} post={post} />
                        ))}
                      </div>

                      {isNearLimit && (
                        <Alert className="mt-4">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            {QUERY_MESSAGES.NEAR_LIMIT}
                          </AlertDescription>
                        </Alert>
                      )}

                      {hasNextPage && (
                        <div className="flex justify-center pt-6">
                          <Button
                            onClick={() => fetchNextPage()}
                            disabled={isFetchingNextPage || isNearLimit}
                            variant="outline"
                            className="w-full max-w-md"
                          >
                            {isNearLimit ? (
                              `Límite alcanzado (${QUERY_LIMITS.MAX_ITEMS} items)`
                            ) : isFetchingNextPage ? (
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
            </ErrorBoundary>
          </div>

          {/* Sidebar derecho */}
          <div className="lg:col-span-4">
            <div className="sticky top-4">
              <CommunitySidebar />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CommunityPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <CommunityContent />
    </Suspense>
  );
}

