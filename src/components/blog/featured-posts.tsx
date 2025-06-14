'use client';
import { useState } from 'react';
import { BlogPost } from '@/types/blog';
import Link from 'next/link';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface FeaturedPostsProps {
  posts: BlogPost[];
}

export function FeaturedPosts({ posts }: FeaturedPostsProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!posts.length) return null;

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % posts.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + posts.length) % posts.length);
  };

  const currentPost = posts[currentIndex];
  const formatDate = (date: Date | string) => {
    const postDate = date instanceof Date ? date : new Date(date);
    return formatDistanceToNow(postDate, { addSuffix: true, locale: es });
  };

  return (
    <div className="relative rounded-2xl overflow-hidden bg-white shadow-lg">
      <div className="grid md:grid-cols-2 min-h-[400px] md:min-h-[500px]">
        {/* Imagen */}
        <Link href={`/blog/${currentPost.id}`}>
        <div className="relative h-[300px] md:h-full">
          <img
            src={currentPost.imageUrl || '/placeholder.jpg'}
            alt={currentPost.title}
            //className="absolute inset-0 w-full h-full object-cover"
            className="absolute inset-0 w-full h-full object-contain cursor-pointer"
            
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          
          <div className="absolute bottom-6 left-6 right-6 text-white">
            <Badge className="mb-3 bg-white/20 hover:bg-white/30 text-white">
              {currentPost.category}
            </Badge>
            {/* <Link href={`/blog/${currentPost.id}`}> */}
              <h2 className="text-2xl md:text-3xl font-bold mb-4 hover:text-blue-400 transition-colors line-clamp-2">
                {currentPost.title}
              </h2>
            {/* </Link> */}
          </div>
        </div>
        </Link>

        {/* Contenido y Posts Relacionados */}
        <div className="p-6 md:p-8 flex flex-col">
          <div className="mb-6">
            <p className="text-gray-600 line-clamp-3 mb-4">
              {currentPost.summary}
            </p>
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src={currentPost.authorPhotoURL || undefined} />
                <AvatarFallback>{currentPost.authorName[0]}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{currentPost.authorName}</p>
                <p className="text-sm text-gray-500">
                  {formatDate(currentPost.createdAt)}
                </p>
              </div>
            </div>
          </div>

          {/* Posts Relacionados */}
          <div className="grid grid-cols-3 gap-4 mt-auto">
            {posts.map((post, idx) => (
              <button
                key={post.id}
                onClick={() => setCurrentIndex(idx)}
                className={`relative rounded-lg overflow-hidden aspect-[4/3] ${
                  idx === currentIndex 
                    ? 'ring-2 ring-primary' 
                    : 'opacity-70 hover:opacity-100'
                }`}
              >
                <img
                  src={post.imageUrl || '/placeholder.jpg'}
                  alt={post.title}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Controles del carrusel */}
      {posts.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 p-2 rounded-full shadow-lg hover:bg-white transition-colors"
            type="button"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 p-2 rounded-full shadow-lg hover:bg-white transition-colors"
            type="button"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </>
      )}
    </div>
  );
}