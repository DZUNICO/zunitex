'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import type { CommunityFilters } from '@/types/community';

interface CommunityPostFiltersProps {
  filters: CommunityFilters;
  onFiltersChange: (filters: CommunityFilters) => void;
}

const categories = [
  { value: 'question', label: 'Preguntas' },
  { value: 'discussion', label: 'Discusiones' },
  { value: 'showcase', label: 'Showcases' },
  { value: 'tip', label: 'Tips' },
  { value: 'news', label: 'Noticias' },
];

export function CommunityPostFilters({
  filters,
  onFiltersChange,
}: CommunityPostFiltersProps) {
  const handleCategoryChange = (category: string) => {
    onFiltersChange({
      ...filters,
      category: filters.category === category ? undefined : category,
    });
  };

  const handleSearchChange = (search: string) => {
    onFiltersChange({
      ...filters,
      search: search || undefined,
    });
  };

  const clearFilters = () => {
    onFiltersChange({});
  };

  const hasActiveFilters = !!(
    filters.category ||
    filters.search ||
    filters.tags?.length
  );

  return (
    <Card className="p-4">
      <div className="flex flex-col md:flex-row gap-4">
        {/* Búsqueda */}
        <div className="flex-1">
          <Input
            placeholder="Buscar posts..."
            value={filters.search || ''}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full"
          />
        </div>

        {/* Categorías */}
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <Button
              key={cat.value}
              variant={filters.category === cat.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleCategoryChange(cat.value)}
            >
              {cat.label}
            </Button>
          ))}
        </div>

        {/* Limpiar filtros */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="gap-2"
          >
            <X className="h-4 w-4" />
            Limpiar
          </Button>
        )}
      </div>

      {/* Tags activos */}
      {filters.tags && filters.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-4">
          {filters.tags.map((tag, index) => (
            <Badge
              key={index}
              variant="secondary"
              className="gap-2 cursor-pointer"
              onClick={() => {
                const newTags = filters.tags?.filter((_, i) => i !== index);
                onFiltersChange({
                  ...filters,
                  tags: newTags && newTags.length > 0 ? newTags : undefined,
                });
              }}
            >
              #{tag}
              <X className="h-3 w-3" />
            </Badge>
          ))}
        </div>
      )}
    </Card>
  );
}

