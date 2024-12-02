'use client';

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { doc, updateDoc } from 'firebase/firestore';
import { db } from "@/lib/firebase/config";
import { useAuth } from "@/lib/context/auth-context";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const profileSchema = z.object({
  displayName: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  location: z.string().min(2, "La ubicación debe tener al menos 2 caracteres"),
  about: z.string().optional(),
  specialties: z.string().transform(str => str.split(',').map(s => s.trim())),
  role: z.enum(['user', 'electrician', 'provider'], {
    required_error: "Por favor selecciona un rol"
  })
});

type ProfileFormValues = z.infer<typeof profileSchema>;

interface ProfileEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: any;
  onUpdate: (updatedProfile: any) => void;
}

export function ProfileEditDialog({
  open,
  onOpenChange,
  profile,
  onUpdate,
}: ProfileEditDialogProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: profile.displayName,
      location: profile.location || '',
      about: profile.about || '',
      specialties: profile.specialties?.join(', ') || '',
    },
  });

  const onSubmit = async (data: ProfileFormValues) => {
    if (!user?.uid) return;
    
    try {
      setLoading(true);
      const userRef = doc(db, 'users', user.uid);
      
      await updateDoc(userRef, {
        displayName: data.displayName,
        location: data.location,
        about: data.about,
        specialties: data.specialties,
        role: data.role
      });

      onUpdate({
        ...profile,
        ...data,
      });

      toast({
        title: "Perfil actualizado",
        description: "Los cambios se han guardado correctamente",
      });

      onOpenChange(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo actualizar el perfil",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Editar Perfil</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="displayName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre completo</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ubicación</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="ej. Santiago, Chile" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Soy</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Selecciona tu rol" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="user">Usuario</SelectItem>
                        <SelectItem value="electrician">Electricista</SelectItem>
                        <SelectItem value="provider">Proveedor</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            <FormField
              control={form.control}
              name="about"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Acerca de mí</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      placeholder="Describe tu experiencia y especialidades..."
                      className="resize-none"
                      rows={4}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="specialties"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Especialidades</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      placeholder="ej. Residencial, Comercial, Industrial"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Guardando...' : 'Guardar cambios'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}