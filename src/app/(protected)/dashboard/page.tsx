'use client';

import { StatsCards } from "@/components/dashboard/stats-cards";
import { RecentProjects } from "@/components/dashboard/recent-projects";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-8 p-4 sm:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Dashboard
          </h1>
          <p className="text-muted-foreground">
            Bienvenido de vuelta, aquí está el resumen de tu actividad.
          </p>
        </div>
        <Button className="w-full sm:w-auto">
          <PlusCircle className="mr-2 h-4 w-4" />
          Nuevo Proyecto
        </Button>
      </div>

      {/* Stats Cards */}
      <StatsCards />

      {/* Recent Projects */}
      <RecentProjects />
    </div>
  );
}