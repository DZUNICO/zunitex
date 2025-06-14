// components/dev/create-sample-post.tsx
'use client';

import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast";

export function CreateSamplePost() {
  const { toast } = useToast();

  const handleClick = async () => {
    try {
      const response = await fetch('/api/init-blog', {
        method: 'POST'
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Post creado",
          description: `ID del post: ${data.postId}`
        });
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo crear el post de prueba"
      });
    }
  };

  return (
    <Button 
      onClick={handleClick}
      variant="outline"
    >
      Crear Post de Prueba
    </Button>
  );
}