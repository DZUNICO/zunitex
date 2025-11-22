'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, Hash, Users, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { useCommunityPosts } from '@/lib/react-query/queries';
import { useMemo } from 'react';

const categories = [
  { value: 'question', label: 'Preguntas', icon: '❓', color: 'bg-blue-100 text-blue-700' },
  { value: 'discussion', label: 'Discusiones', icon: '💬', color: 'bg-purple-100 text-purple-700' },
  { value: 'showcase', label: 'Showcases', icon: '✨', color: 'bg-green-100 text-green-700' },
  { value: 'tip', label: 'Tips', icon: '💡', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'news', label: 'Noticias', icon: '📰', color: 'bg-red-100 text-red-700' },
];

export function CommunitySidebar() {
  const { data } = useCommunityPosts({});

  // Calcular trending topics (tags más usados)
  const trendingTags = useMemo(() => {
    if (!data?.pages) return [];
    
    const tagCounts: Record<string, number> = {};
    data.pages.forEach(page => {
      page.posts.forEach(post => {
        post.tags?.forEach(tag => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      });
    });

    return Object.entries(tagCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([tag]) => tag);
  }, [data]);

  // Calcular categorías más populares
  const popularCategories = useMemo(() => {
    if (!data?.pages) return [];
    
    const categoryCounts: Record<string, number> = {};
    data.pages.forEach(page => {
      page.posts.forEach(post => {
        categoryCounts[post.category] = (categoryCounts[post.category] || 0) + 1;
      });
    });

    return Object.entries(categoryCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([category]) => category);
  }, [data]);

  // Calcular estadísticas
  const stats = useMemo(() => {
    if (!data?.pages) return { totalPosts: 0, totalComments: 0, totalLikes: 0 };
    
    let totalPosts = 0;
    let totalComments = 0;
    let totalLikes = 0;

    data.pages.forEach(page => {
      page.posts.forEach(post => {
        totalPosts++;
        totalComments += post.commentsCount || 0;
        totalLikes += post.likes || 0;
      });
    });

    return { totalPosts, totalComments, totalLikes };
  }, [data]);

  return (
    <div className="space-y-4">
      {/* Estadísticas de la comunidad */}
      <Card className="p-4">
        <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
          <Users className="h-4 w-4" />
          Estadísticas
        </h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Posts</span>
            <span className="font-medium">{stats.totalPosts}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Comentarios</span>
            <span className="font-medium">{stats.totalComments}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Likes</span>
            <span className="font-medium">{stats.totalLikes}</span>
          </div>
        </div>
      </Card>

      {/* Trending Topics */}
      {trendingTags.length > 0 && (
        <Card className="p-4">
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Trending Topics
          </h3>
          <div className="flex flex-wrap gap-2">
            {trendingTags.map((tag, index) => (
              <Link
                key={tag}
                href={`/community?tag=${tag}`}
                className="inline-flex items-center gap-1"
              >
                <Badge
                  variant="secondary"
                  className="text-xs px-2 py-0.5 cursor-pointer hover:bg-primary/20 transition-colors"
                >
                  <Hash className="h-3 w-3" />
                  {tag}
                </Badge>
              </Link>
            ))}
          </div>
        </Card>
      )}

      {/* Categorías populares */}
      {popularCategories.length > 0 && (
        <Card className="p-4">
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Categorías Populares
          </h3>
          <div className="space-y-2">
            {popularCategories.map((category) => {
              const catInfo = categories.find(c => c.value === category);
              if (!catInfo) return null;
              
              return (
                <Link
                  key={category}
                  href={`/community?category=${category}`}
                >
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-2 h-auto py-2"
                  >
                    <span>{catInfo.icon}</span>
                    <span className="text-sm">{catInfo.label}</span>
                  </Button>
                </Link>
              );
            })}
          </div>
        </Card>
      )}

      {/* Todas las categorías */}
      <Card className="p-4">
        <h3 className="font-semibold text-sm mb-3">Explorar Categorías</h3>
        <div className="space-y-1.5">
          {categories.map((category) => (
            <Link
              key={category.value}
              href={`/community?category=${category.value}`}
            >
              <Button
                variant="ghost"
                className="w-full justify-start gap-2 h-auto py-2 text-sm"
              >
                <span>{category.icon}</span>
                <span>{category.label}</span>
              </Button>
            </Link>
          ))}
        </div>
      </Card>

      {/* Reglas de la comunidad */}
      <Card className="p-4 bg-primary/5 border-primary/20">
        <h3 className="font-semibold text-sm mb-2">Reglas de la Comunidad</h3>
        <ul className="text-xs text-muted-foreground space-y-1.5">
          <li>• Sé respetuoso con otros miembros</li>
          <li>• Comparte conocimiento útil</li>
          <li>• No publiques spam o contenido inapropiado</li>
          <li>• Usa las categorías correctamente</li>
        </ul>
      </Card>
    </div>
  );
}









