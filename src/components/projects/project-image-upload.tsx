// components/projects/image-upload.tsx
'use client';

import { useState, useEffect } from 'react';
import { Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ErrorBoundary } from '@/components/shared/error-boundary';
import { UploadErrorFallback } from '@/components/shared/error-fallbacks';

interface ImageUploadProps {
    onImageUpload: (files: File[]) => void;
    onRemoveImage: (index: number) => void;
    maxImages?: number;
    currentFiles: File[];
    disabled?: boolean;
  }
  
  export function ImageUpload({ 
    onImageUpload, 
    onRemoveImage, 
    maxImages = 3,
    currentFiles,
    disabled = false  // Valor por defecto
  }: ImageUploadProps) {
    const [previews, setPreviews] = useState<string[]>([]);
  
    useEffect(() => {
      // Crear URLs de preview para los archivos actuales
      const urls = currentFiles.map(file => URL.createObjectURL(file));
      setPreviews(urls);
  
      // Limpieza de URLs
      return () => {
        urls.forEach(url => URL.revokeObjectURL(url));
      };
    }, [currentFiles]);
  
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newFiles = Array.from(e.target.files || []);
      if (currentFiles.length + newFiles.length > maxImages) {
        alert(`Máximo ${maxImages} imágenes permitidas`);
        return;
      }
      onImageUpload(newFiles);
    };
  
    return (
      <ErrorBoundary
        scope="component"
        fallback={(reset) => <UploadErrorFallback onReset={reset} />}
      >
        <div className="space-y-4">
          {currentFiles.length < maxImages && (
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-8 h-8 mb-2 text-gray-500" />
                <p className="text-sm text-gray-500">
                  Click para subir o arrastrar imágenes
                </p>
                <p className="text-xs text-gray-500">
                  {`${currentFiles.length}/${maxImages} imágenes`}
                </p>
              </div>
              <input
                type="file"
                className="hidden"
                multiple
                accept="image/*"
                onChange={handleFileChange}
                disabled={disabled}
              />
            </label>
          )}

          {currentFiles.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {currentFiles.map((file, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                      {!disabled && (
                        <button
                          type="button"
                          onClick={() => onRemoveImage(index)}
                          className="absolute top-1 right-1 p-1 bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          disabled={disabled}
                        >
                          <X className="w-4 h-4 text-white" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
        </div>
      </ErrorBoundary>
    );
  }