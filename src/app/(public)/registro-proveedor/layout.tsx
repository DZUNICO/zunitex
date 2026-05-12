import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Registro de Proveedor | STARLOGIC',
  description:
    'Únete como proveedor verificado en STARLOGIC. Publica tu catálogo de productos eléctricos y llega a miles de electricistas y profesionales en Perú.',
  keywords:
    'proveedor eléctrico, distribuidor materiales eléctricos, ferretería eléctrica, catálogo eléctrico Perú',
  openGraph: {
    title: 'Registro de Proveedor | STARLOGIC',
    description:
      'Publica tu catálogo de productos eléctricos y llega a miles de profesionales.',
    type: 'website',
  },
};

export default function RegistroProveedorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
