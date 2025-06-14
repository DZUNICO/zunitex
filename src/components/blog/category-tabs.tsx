'use client';
import { useState } from 'react';
import { Card } from '@/components/ui/card';

interface CategoryTabsProps {
  categories: string[];
}

export function CategoryTabs({ categories }: CategoryTabsProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>(categories[0]);

  return (
    <>
      {categories.map((category) => (
        <Card
          key={category}
          className={`shrink-0 cursor-pointer transition-all
            ${
              selectedCategory === category
                ? 'bg-[#0f172a] text-white hover:bg-[#1e293b]'
                : 'bg-white hover:bg-gray-50'
            }`}
          onClick={() => setSelectedCategory(category)}
        >
          <div className="px-6 py-3">
            <span className="whitespace-nowrap">{category}</span>
          </div>
        </Card>
      ))}
    </>
  );
}