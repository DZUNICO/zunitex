// src/components/verification/verification-request-button.tsx

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/context/auth-context';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { ShieldCheck, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function VerificationRequestButton() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleRequestVerification = async () => {
    if (!user) return;

    setLoading(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        verificationStatus: 'pending',
        verificationRequestedAt: serverTimestamp()
      });

      toast({
        title: 'Solicitud enviada',
        description: 'Tu solicitud de verificación ha sido enviada. Te notificaremos cuando sea revisada.'
      });
    } catch (error) {
      console.error('Error solicitando verificación:', error);
      toast({
        title: 'Error',
        description: 'No se pudo enviar la solicitud. Intenta de nuevo.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleRequestVerification}
      disabled={loading}
      variant="outline"
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Enviando...
        </>
      ) : (
        <>
          <ShieldCheck className="mr-2 h-4 w-4" />
          Solicitar Verificación
        </>
      )}
    </Button>
  );
}

