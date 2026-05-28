'use client';

import { useState, useEffect } from 'react';
import { useAuth }             from '@/lib/context/auth-context';
import { AdminRoute }          from '@/components/shared/admin-route';
import { Button }              from '@/components/ui/button';
import { Loader2 }             from 'lucide-react';

export default function TestTokenPage() {
  const { user }              = useAuth();
  const [token,    setToken]  = useState('');
  const [loading,  setLoading] = useState(true);
  const [copied,   setCopied] = useState(false);

  useEffect(() => {
    if (!user) return;
    user.getIdToken(/* forceRefresh */ true).then((t) => {
      setToken(t);
      setLoading(false);
    });
  }, [user]);

  function copy() {
    navigator.clipboard.writeText(token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <AdminRoute>
      <div className="container max-w-2xl mx-auto p-8 space-y-4">
        <h1 className="text-lg font-bold">Firebase ID Token (dev only)</h1>
        <p className="text-xs text-muted-foreground">
          Token fresco para {user?.email}. Válido ~1 hora.
        </p>

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Obteniendo token...
          </div>
        ) : (
          <>
            <textarea
              readOnly
              value={token}
              rows={8}
              className="w-full rounded-md border bg-muted px-3 py-2 text-xs font-mono break-all resize-none"
              onClick={(e) => (e.target as HTMLTextAreaElement).select()}
            />
            <Button onClick={copy} size="sm">
              {copied ? 'Copiado!' : 'Copiar token'}
            </Button>
          </>
        )}
      </div>
    </AdminRoute>
  );
}
