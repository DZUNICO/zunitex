'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap, Award, Users, BookOpen, TrendingUp } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description?: string;
  trend?: {
    value: number;
    label: string;
  };
}

function StatsCard({ title, value, icon, description, trend }: StatsCardProps) {
  return (
    <Card className="relative overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="h-8 w-8 rounded-lg bg-primary/10 p-2 text-primary">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">
            {description}
          </p>
        )}
        {trend && (
          <div className="flex items-center gap-1 mt-2">
            <TrendingUp className={`h-3 w-3 ${trend.value >= 0 ? 'text-green-500' : 'text-red-500'}`} />
            <span className={`text-xs ${trend.value >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {trend.value > 0 && '+'}
              {trend.value}%
            </span>
            <span className="text-xs text-muted-foreground">
              {trend.label}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function StatsCards() {
  const stats = [
    {
      title: "Proyectos Activos",
      value: "3",
      icon: <Zap className="h-4 w-4" />,
      description: "2 en progreso, 1 pendiente",
      trend: {
        value: 12,
        label: "vs mes anterior"
      }
    },
    {
      title: "Valoración",
      value: "4.8",
      icon: <Award className="h-4 w-4" />,
      description: "De 12 reseñas",
      trend: {
        value: 8,
        label: "último mes"
      }
    },
    {
      title: "Seguidores",
      value: "128",
      icon: <Users className="h-4 w-4" />,
      description: "En la comunidad",
      trend: {
        value: 25,
        label: "este mes"
      }
    },
    {
      title: "Recursos Compartidos",
      value: "25",
      icon: <BookOpen className="h-4 w-4" />,
      description: "5 guías, 20 plantillas",
      trend: {
        value: 15,
        label: "vs mes anterior"
      }
    }
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <StatsCard key={index} {...stat} />
      ))}
    </div>
  );
}