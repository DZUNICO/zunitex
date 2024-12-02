// src/components/projects/project-form.tsx
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Project, ProjectCategory, CreateProjectData } from '@/types/project';
import { ImageUpload } from './project-image-upload';
import { storageService } from '@/lib/firebase/storage';
import { Loader2 } from 'lucide-react';

interface ProjectFormProps {
  initialData?: Partial<CreateProjectData>;
  onSubmit: (data: CreateProjectData) => Promise<void>;
}

export default function ProjectForm({ initialData, onSubmit }: ProjectFormProps) {
  const [formData, setFormData] = useState<CreateProjectData>({
    title: initialData?.title || '',
    description: initialData?.description || '',
    category: initialData?.category || 'Residencial',
    budget: initialData?.budget || 0,
    location: initialData?.location || '',
    clientName: initialData?.clientName || '',
    status: 'Pendiente',
    images: initialData?.images || [],
    tags: []
  });
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return; // Prevenir múltiples envíos

    try {
      setIsSubmitting(true);
      
      let finalFormData = { ...formData };

      // Si hay archivos, súbelos primero
      if (files.length > 0) {
        const tempId = Date.now().toString();
        const imageUrls = await storageService.uploadProjectImages(tempId, files);
        finalFormData.images = imageUrls;
      }

      // Enviar los datos del formulario
      await onSubmit(finalFormData);
      
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto px-4">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">Título del Proyecto</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={e => setFormData({ ...formData, title: e.target.value })}
            required
            disabled={isSubmitting}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descripción</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={e => setFormData({ ...formData, description: e.target.value })}
          required
          className="min-h-[100px]"
          disabled={isSubmitting}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="category">Categoría</Label>
          <Select
            value={formData.category}
            onValueChange={(value) => setFormData({ ...formData, category: value as ProjectCategory })}
            disabled={isSubmitting}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Residencial">Residencial</SelectItem>
              <SelectItem value="Comercial">Comercial</SelectItem>
              <SelectItem value="Industrial">Industrial</SelectItem>
              <SelectItem value="Solar">Solar</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="budget">Presupuesto</Label>
          <Input
            id="budget"
            type="number"
            value={formData.budget}
            onChange={e => setFormData({ ...formData, budget: Number(e.target.value) })}
            required
            disabled={isSubmitting}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="location">Ubicación</Label>
        <Input
          id="location"
          value={formData.location}
          onChange={e => setFormData({ ...formData, location: e.target.value })}
          required
          disabled={isSubmitting}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="clientName">Nombre del Cliente</Label>
        <Input
          id="clientName"
          value={formData.clientName}
          onChange={e => setFormData({ ...formData, clientName: e.target.value })}
          required
          disabled={isSubmitting}
        />
      </div>

      <div className="space-y-2">
        <Label>Imágenes del Proyecto (máximo 3)</Label>
        <ImageUpload 
          onImageUpload={(newFiles) => {
            setFiles(prevFiles => [...prevFiles, ...newFiles]);
          }}
          maxImages={3}
          currentFiles={files}
          onRemoveImage={(index) => {
            setFiles(files.filter((_, i) => i !== index));
          }}
          disabled={isSubmitting}
        />
      </div>

      <div className="sticky bottom-0 bg-white dark:bg-gray-950 py-4 mt-6 -mx-4 px-4 border-t">
        <Button 
          type="submit" 
          disabled={isSubmitting}
          className="w-full"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {initialData ? 'Actualizando Proyecto...' : 'Creando Proyecto...'}
            </>
          ) : (
            initialData ? 'Actualizar Proyecto' : 'Crear Proyecto'
          )}
        </Button>
      </div>
    </form>
  );
}