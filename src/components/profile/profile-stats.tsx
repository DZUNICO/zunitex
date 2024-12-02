'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Award, Users, FileText, Star } from "lucide-react";
import { useAuth } from "@/lib/context/auth-context";

interface ProfileStats {
  totalProjects: number;
  completedProjects: number;
  avgRating: number;
  totalReviews: number;
  followers: number;
  following: number;
}

export function ProfileStats() {
  const [stats, setStats] = useState<ProfileStats>({
    totalProjects: 0,
    completedProjects: 0,
    avgRating: 0,
    totalReviews: 0,
    followers: 0,
    following: 0
  });
  const [loading, setLoading] = useState(true);
  const { user } = useAuth(); // Obtenemos el usuario del contexto de autenticación

  useEffect(() => {
    const fetchStats = async () => {
      // Verificar si tenemos un usuario autenticado
      if (!user?.uid) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        
        // Proyectos
        const projectsSnap = await getDocs(
          query(collection(db, 'projects'), where('userId', '==', user.uid))
        );
        
        const totalProjects = projectsSnap.size;
        const completedProjects = projectsSnap.docs.filter(
          doc => doc.data().status === 'completado'
        ).length;

        // Reseñas
        const reviewsSnap = await getDocs(
          query(collection(db, 'reviews'), where('userId', '==', user.uid))
        );
        
        const totalReviews = reviewsSnap.size;
        const avgRating = totalReviews > 0 
          ? reviewsSnap.docs.reduce((acc, doc) => acc + (doc.data().rating || 0), 0) / totalReviews 
          : 0;

        // Seguidores
        const followersSnap = await getDocs(
          query(collection(db, 'followers'), where('followingId', '==', user.uid))
        );
        
        // Siguiendo
        const followingSnap = await getDocs(
          query(collection(db, 'followers'), where('followerId', '==', user.uid))
        );

        setStats({
          totalProjects,
          completedProjects,
          avgRating,
          totalReviews,
          followers: followersSnap.size,
          following: followingSnap.size
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
        // En caso de error, mantener los valores por defecto
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user?.uid]); // Dependencia del useEffect

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-gray-200 rounded w-24" />
            </CardHeader>
            <CardContent>
              <div className="h-7 bg-gray-200 rounded w-16" />
              <div className="h-3 bg-gray-200 rounded w-20 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Proyectos</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalProjects}</div>
          <p className="text-xs text-muted-foreground">
            {stats.completedProjects} completados
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Valoración</CardTitle>
          <Star className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.avgRating.toFixed(1)}</div>
          <p className="text-xs text-muted-foreground">
            {stats.totalReviews} reseñas
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Seguidores</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.followers}</div>
          <p className="text-xs text-muted-foreground">
            Siguiendo a {stats.following}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Certificaciones</CardTitle>
          <Award className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">0</div>
          <p className="text-xs text-muted-foreground">
            Verificadas
          </p>
        </CardContent>
      </Card>
    </div>
  );
}