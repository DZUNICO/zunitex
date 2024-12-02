import { DatabaseInitializer } from '@/components/admin/database-initializer';

export default function AdminPage() {
  return (
    <div className="container max-w-4xl mx-auto p-4 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Panel de Administración</h1>
        <p className="text-muted-foreground">
          Herramientas y configuraciones administrativas
        </p>
      </div>

      <DatabaseInitializer />
    </div>
  );
}