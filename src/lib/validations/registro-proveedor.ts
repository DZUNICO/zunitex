import { z } from 'zod';

export const paso1Schema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

export const paso2Schema = z.object({
  nombreEmpresa: z.string().min(2, 'Nombre de empresa requerido'),
  ruc: z.string().regex(/^\d{11}$/, 'RUC debe tener exactamente 11 dígitos'),
  ciudad: z.enum(['Arequipa', 'Lima', 'Cusco', 'Trujillo', 'Piura', 'Otra'], {
    required_error: 'Selecciona una ciudad',
  }),
  telefono: z.string().min(7, 'Teléfono requerido'),
  web: z
    .string()
    .optional()
    .refine(
      (val) => !val || /^https?:\/\/.+/.test(val),
      'La URL debe empezar con http:// o https://'
    ),
  descripcion: z
    .string()
    .min(10, 'Descripción muy corta')
    .max(200, 'Máximo 200 caracteres'),
  tipoProveedor: z.enum(['Minorista', 'Distribuidor', 'Importador', 'Fabricante'], {
    required_error: 'Selecciona el tipo de proveedor',
  }),
});

export const registroProveedorSchema = z
  .object({
    email: z.string().email('Email inválido'),
    password: z.string().min(8, 'Mínimo 8 caracteres'),
    confirmPassword: z.string(),
  })
  .merge(paso2Schema)
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

export type RegistroProveedorInput = z.infer<typeof registroProveedorSchema>;

export const CIUDADES = ['Arequipa', 'Lima', 'Cusco', 'Trujillo', 'Piura', 'Otra'] as const;
export const TIPOS_PROVEEDOR = ['Minorista', 'Distribuidor', 'Importador', 'Fabricante'] as const;

export const PASO1_FIELDS = ['email', 'password', 'confirmPassword'] as const;
