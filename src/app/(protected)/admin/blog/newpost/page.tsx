'use client';

import { useEffect, useState } from 'react';
import { blogService } from '@/lib/firebase/blog';
import { storageService } from '@/lib/firebase/storage';
import { useAuth } from '@/lib/context/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { X } from 'lucide-react';

// Importar MDEditor y Markdown dinámicamente
const MDEditor = dynamic(
  () => import('@uiw/react-md-editor').then((mod) => {
    return mod.default;
  }),
  { ssr: false }
);

const MDMarkdown = dynamic(
  () => import('@uiw/react-md-editor').then((mod) => {
    return mod.default.Markdown;
  }),
  { ssr: false }
);

const initialMarkdown = `## Mi Artículo

Escribe tu contenido aquí...

### Ejemplos de formato

- **Negrita**
- *Cursiva*
- [Enlaces](https://ejemplo.com)

### Tablas

| Header 1 | Header 2 |
|----------|----------|
| Celda 1  | Celda 2  |

### Listas

1. Item numerado 1
2. Item numerado 2
   - Sub-item
   - Otro sub-item
`;

export default function AdminBlogPage() {
  const [loading, setLoading] = useState(false);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<{ [key: string]: string }>({});
  const [content, setContent] = useState(initialMarkdown);
  const { user } = useAuth();
  const router = useRouter();

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      setSelectedImages(prev => [...prev, ...files]);
  
      // Solo guardamos las imágenes en el estado, no las subimos aquí
      // Las previsualizamos usando URL.createObjectURL
      // Crear URLs de previsualización
      const newPreviews = { ...previews };
      files.forEach(file => {
        newPreviews[file.name] = URL.createObjectURL(file);
      });
      setPreviews(newPreviews);
      
      // Agregar las imágenes como placeholders en el markdown
     /*  const imageMarkdown = previewUrls.map((url, index) => 
        `\n![Imagen ${index + 1}](${url})`
      ).join('\n');
      
      setContent(prev => prev + imageMarkdown); */
    }
  };
  const handleRemoveImage = (indexToRemove: number) => {
    setSelectedImages(prev => {
      const newImages = [...prev];
      const removedFile = newImages[indexToRemove];
      
      // Revocar la URL de previsualización
      if (removedFile && previews[removedFile.name]) {
        URL.revokeObjectURL(previews[removedFile.name]);
        const newPreviews = { ...previews };
        delete newPreviews[removedFile.name];
        setPreviews(newPreviews);
      }
      
      newImages.splice(indexToRemove, 1);
      return newImages;
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
  
    try {
      const formData = new FormData(e.currentTarget);
      const tempId = Date.now().toString();
      
      // Step 1: Subir imágenes primero
      let imageUrls: string[] = [];
      if (selectedImages.length > 0) {
        try {
          imageUrls = await storageService.uploadPostImages(tempId, selectedImages);
          console.log('Imágenes subidas exitosamente', { imageUrls });
          
          // Agregar las imágenes al contenido markdown usando las URLs de Firebase
          const imageMarkdown = imageUrls.map((url, index) => 
            `\n![Imagen ${index + 1}](${url})`
          ).join('\n');
          
          // Actualizar el contenido con las URLs reales
          const updatedContent = content + '\n' + imageMarkdown;
  
          // Step 2: Preparar datos del post
          const data = {
            title: formData.get('title') as string,
            content: updatedContent, // Usar el contenido actualizado con URLs reales
            category: formData.get('category') as string,
            summary: content.slice(0, 200).replace(/[#*\[\]]/g, '') + '...',
            authorId: user?.uid || '',
            authorName: user?.displayName || 'Admin',
            authorPhotoURL: user?.photoURL || '',
            status: (formData.get('status') as 'published' | 'draft') || 'draft',
            imageUrl: imageUrls[0] || '',
            imageUrls,
          };
  
          // Step 3: Crear post
          const postId = await blogService.createPost(data);
          console.log('Post creado exitosamente', { postId });
  
          // Limpiar recursos
          selectedImages.forEach(image => {
            URL.revokeObjectURL(URL.createObjectURL(image));
          });
  
          router.push('/blog');
        } catch (error) {
          console.error('Error subiendo imágenes:', error);
          throw new Error('Error al subir las imágenes');
        }
      } else {
        // Si no hay imágenes, crear el post directamente
        const data = {
          title: formData.get('title') as string,
          content,
          category: formData.get('category') as string,
          summary: content.slice(0, 200).replace(/[#*\[\]]/g, '') + '...',
          authorId: user?.uid || '',
          authorName: user?.displayName || 'Admin',
          authorPhotoURL: user?.photoURL || '',
          status: (formData.get('status') as 'published' | 'draft') || 'draft',
          imageUrl: '',
          imageUrls: [],
        };
  
        await blogService.createPost(data);
        router.push('/blog');
      }
      
    } catch (error) {
      console.error('Error en handleSubmit:', error);
      alert(error instanceof Error ? error.message : 'Error al crear el post');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    return () => {
      // Cleanup function
      Object.values(previews).forEach(url => {
        URL.revokeObjectURL(url);
      });
    };
  }, [previews]);
  return (
    <div className="container mx-auto p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="p-6">
        <div className="grid gap-6">
            <div>
              <label className="block text-sm font-medium mb-1">Título</label>
              <Input required name="title" placeholder="Título del artículo" />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Categoría</label>
              <Select name="category" required>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Instalaciones">Instalaciones</SelectItem>
                  <SelectItem value="Normativa">Normativa</SelectItem>
                  <SelectItem value="Tutoriales">Tutoriales</SelectItem>
                  <SelectItem value="Seguridad">Seguridad</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <Select name="status" required defaultValue="draft">
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="published">Publicar</SelectItem>
                  <SelectItem value="draft">Borrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        <div data-color-mode="light" className="w-full">
          <Tabs defaultValue="write" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="write">Escribir</TabsTrigger>
              <TabsTrigger value="preview">Vista previa</TabsTrigger>
            </TabsList>
            
            <TabsContent value="write">
              {typeof window !== 'undefined' && (
                <MDEditor
                  value={content}
                  onChange={value => setContent(value || '')}
                  preview="edit"
                  height={500}
                />
              )}
            </TabsContent>
            
            <TabsContent value="preview">
              {typeof window !== 'undefined' && (
                <div className="prose max-w-none p-4 border rounded-lg">
                  <MDMarkdown source={content} />
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        <Card className="p-6">
          <div className="space-y-4">
            <label className="block text-sm font-medium">
              Agregar imágenes
            </label>
            <Input 
              type="file" 
              onChange={handleImageChange}
              accept="image/*"
              multiple
            />
            {selectedImages.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                {selectedImages.map((image, index) => (
                  <div key={index} className="relative group">
                    <div className="aspect-video relative rounded-lg overflow-hidden bg-gray-100">
                      <img
                        src={previews[image.name]}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={() => handleRemoveImage(index)}
                        className="absolute top-2 right-2 p-1 bg-red-500 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        type="button"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 truncate">
                      {image.name}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        <Button 
          type="submit" 
          disabled={loading}
          className="w-full"
        >
          {loading ? 'Publicando...' : 'Publicar Artículo'}
        </Button>
      </form>
    </div>
  );
}