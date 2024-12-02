'use client';

import { ProfileHeader } from "@/components/profile/profile-header";
import { ProfileTabs } from "@/components/profile/profile-tabs";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/context/auth-context";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { UserProfile, transformUserToProfileHeader } from '@/types/profile';

/* interface UserProfile {
  id: string;
  displayName: string;
  email: string;
  phone: string;
  role: string;
  specialties: string[];
  rating: number;
  projectsCount: number;
  createdAt: string;
  avatar?: string;
  about?: string;
  location?: string;
  certifications?: string[];
} */

export default function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.uid) return;
      
      try {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setProfile(docSnap.data() as UserProfile);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user?.uid]);
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">No se encontró el perfil</p>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
      <ProfileHeader profile={transformUserToProfileHeader(profile)} />
      <ProfileTabs profile={profile} />
    </div>
  );
}