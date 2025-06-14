// components/blog/blog-grid.tsx
import { BlogCard } from './blog-card';
import type { BlogPost } from '@/types/blog';

interface BlogGridProps {
  posts: BlogPost[];
}

export function BlogGrid({ posts }: BlogGridProps) {
  // Dividir los posts en dos grupos: destacados y regulares
  const [mainPost, ...restPosts] = posts;

  if (!posts.length) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Main Featured Post */}
      <div className="lg:col-span-2">
        <BlogCard post={mainPost} featured={true} />
      </div>

      {/* Regular Posts Grid */}
      {restPosts.map((post) => (
        <BlogCard key={post.id} post={post} />
      ))}
    </div>
  );
}