import { AdminRoute } from '@/components/shared/admin-route';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminRoute>
      <div className="container mx-auto px-4 py-8">
        {children}
      </div>
    </AdminRoute>
  );
}