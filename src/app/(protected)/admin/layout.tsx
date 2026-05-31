import { AdminRoute } from '@/components/shared/admin-route';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminRoute>
      {children}
    </AdminRoute>
  );
}