'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter }                                  from 'next/navigation';
import Link                                           from 'next/link';
import { useAuth }                                    from '@/lib/context/auth-context';
import { AdminRoute }                                 from '@/components/shared/admin-route';
import { Card, CardContent, CardHeader, CardTitle }   from '@/components/ui/card';
import { Button }                                     from '@/components/ui/button';
import { Input }                                      from '@/components/ui/input';
import { Badge }                                      from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger }   from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast }                                   from '@/hooks/use-toast';
import {
  Loader2,
  Upload,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  Cpu,
  AlertTriangle,
  BarChart2,
} from 'lucide-react';
import type { PipelineStatus } from '@/lib/pipeline/types';

// ── Types ──────────────────────────────────────────────────────────────────────

type CandidatoRow = {
  id:               string;
  created_at:       string;
  pdf_filename:     string | null;
  fabricante:       string | null;
  tipo_cable:       string | null;
  status:           PipelineStatus;
  confidence_score: number | null;
  notas:            string | null;
  variantes_count:  number;
};

type UploadState = 'idle' | 'uploading' | 'processing' | 'done';

// ── Constants ──────────────────────────────────────────────────────────────────

const TIPOS_CABLE = [
  { value: 'tw',              label: 'TW' },
  { value: 'thw',             label: 'THW' },
  { value: 'lsoh',            label: 'LSOH' },
  { value: 'nh',              label: 'NH-80' },
  { value: 'n2xoh',           label: 'N2XOH' },
  { value: 'nlt',             label: 'NLT' },
  { value: 'mellizo',         label: 'Mellizo' },
  { value: 'soldadura',       label: 'Soldadura' },
  { value: 'bateria',         label: 'Batería' },
  { value: 'automotriz',      label: 'Automotriz' },
  { value: 'solar',           label: 'Solar' },
  { value: 'instrumentacion', label: 'Instrumentación' },
  { value: 'control',         label: 'Control' },
  { value: 'utp',             label: 'UTP' },
  { value: 'coaxial',         label: 'Coaxial' },
  { value: 'incendio',        label: 'Incendio' },
  { value: 'alarma',          label: 'Alarma' },
];

// ── Helper components ──────────────────────────────────────────────────────────

function ConfidenceBadge({ score }: { score: number | null }) {
  if (score === null) return <span className="text-muted-foreground text-xs">—</span>;
  const pct = Math.round(score * 100);
  if (score >= 0.9) {
    return (
      <Badge className="bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400">
        {pct}%
      </Badge>
    );
  }
  if (score >= 0.7) {
    return (
      <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400">
        {pct}%
      </Badge>
    );
  }
  return (
    <Badge className="bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400">
      {pct}%
    </Badge>
  );
}

function StatusBadge({ status }: { status: PipelineStatus }) {
  if (status === 'approved') {
    return (
      <Badge className="bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400">
        Aprobado
      </Badge>
    );
  }
  if (status === 'rejected') {
    return <Badge variant="destructive">Rechazado</Badge>;
  }
  return <Badge variant="secondary">Pendiente</Badge>;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function CandidatesTable({
  rows,
  onRevisar,
}: {
  rows: CandidatoRow[];
  onRevisar: (id: string) => void;
}) {
  if (rows.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-12">
        No hay candidatos en este estado
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-muted/50 border-b">
            <th className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">
              Archivo PDF
            </th>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Fabricante</th>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Tipo cable</th>
            <th className="text-center px-4 py-3 font-medium text-muted-foreground">Variantes</th>
            <th className="text-center px-4 py-3 font-medium text-muted-foreground">Confidence</th>
            <th className="text-center px-4 py-3 font-medium text-muted-foreground">Estado</th>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">
              Fecha
            </th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={row.id}
              className={i % 2 === 0 ? 'bg-background' : 'bg-muted/20'}
            >
              <td className="px-4 py-3 max-w-[200px]">
                <div className="flex items-center gap-2">
                  <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="truncate text-xs font-mono">
                    {row.pdf_filename ?? '—'}
                  </span>
                </div>
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {row.fabricante ?? '—'}
              </td>
              <td className="px-4 py-3">
                {row.tipo_cable ? (
                  <Badge variant="outline" className="text-xs uppercase">
                    {row.tipo_cable}
                  </Badge>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </td>
              <td className="px-4 py-3 text-center">{row.variantes_count}</td>
              <td className="px-4 py-3 text-center">
                <ConfidenceBadge score={row.confidence_score} />
              </td>
              <td className="px-4 py-3 text-center">
                <StatusBadge status={row.status} />
              </td>
              <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">
                {formatDate(row.created_at)}
              </td>
              <td className="px-4 py-3 text-right">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onRevisar(row.id)}
                >
                  Revisar
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function AdminPipelinePage() {
  const { user }  = useAuth();
  const router    = useRouter();
  const { toast } = useToast();

  // ── Candidates list state ──────────────────────────────────────────────────
  const [candidatos,   setCandidatos]  = useState<CandidatoRow[]>([]);
  const [loadingList,  setLoadingList] = useState(true);
  const [listError,    setListError]   = useState<string | null>(null);

  // ── Upload form state ──────────────────────────────────────────────────────
  const [pdfFile,      setPdfFile]     = useState<File | null>(null);
  const [fabricante,   setFabricante]  = useState('');
  const [tipoCable,    setTipoCable]   = useState('');
  const [uploadState,  setUploadState] = useState<UploadState>('idle');
  const fileInputRef                   = useRef<HTMLInputElement>(null);
  const uploadTimerRef                 = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Fetch candidates ───────────────────────────────────────────────────────
  const fetchCandidatos = useCallback(async () => {
    if (!user) return;
    setLoadingList(true);
    setListError(null);
    try {
      const token = await user.getIdToken();
      const res   = await fetch('/api/pipeline/candidates', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      const data = await res.json() as { candidatos: CandidatoRow[] };
      setCandidatos(data.candidatos ?? []);
    } catch (err) {
      setListError((err as Error).message ?? 'Error desconocido');
    } finally {
      setLoadingList(false);
    }
  }, [user]);

  useEffect(() => {
    fetchCandidatos();
  }, [fetchCandidatos]);

  // ── File input ─────────────────────────────────────────────────────────────
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (file && file.type !== 'application/pdf') {
      toast({ title: 'Solo se aceptan archivos PDF', variant: 'destructive' });
      e.target.value = '';
      return;
    }
    if (file && file.size > 20 * 1024 * 1024) {
      toast({ title: 'El PDF no puede superar 20 MB', variant: 'destructive' });
      e.target.value = '';
      return;
    }
    setPdfFile(file);
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pdfFile || !user) return;

    setUploadState('uploading');
    // After 3 seconds assume upload is done and Claude is processing
    uploadTimerRef.current = setTimeout(() => setUploadState('processing'), 3000);

    try {
      const token    = await user.getIdToken();
      const formData = new FormData();
      formData.append('pdf', pdfFile);
      if (fabricante.trim()) formData.append('fabricante', fabricante.trim());
      if (tipoCable)          formData.append('tipo_cable', tipoCable);

      const res = await fetch('/api/pipeline/extract', {
        method:  'POST',
        headers: { Authorization: `Bearer ${token}` },
        body:    formData,
      });

      if (uploadTimerRef.current) {
        clearTimeout(uploadTimerRef.current);
        uploadTimerRef.current = null;
      }

      const body = await res.json() as { candidato_id?: string; error?: string };
      if (!res.ok) throw new Error(body.error ?? `HTTP ${res.status}`);

      setUploadState('done');
      router.push(`/admin/pipeline/${body.candidato_id}`);
    } catch (err) {
      if (uploadTimerRef.current) {
        clearTimeout(uploadTimerRef.current);
        uploadTimerRef.current = null;
      }
      setUploadState('idle');
      toast({
        title:       'Error al extraer',
        description: (err as Error).message ?? 'Intenta de nuevo.',
        variant:     'destructive',
      });
    }
  };

  // ── Derived ────────────────────────────────────────────────────────────────
  const pending  = candidatos.filter((c) => c.status === 'pending');
  const approved = candidatos.filter((c) => c.status === 'approved');
  const rejected = candidatos.filter((c) => c.status === 'rejected');
  const busy     = uploadState !== 'idle';

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <AdminRoute>
      <div className="container max-w-6xl mx-auto p-4 space-y-8">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-3">
          <Cpu className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Pipeline de Datos</h1>
            <p className="text-sm text-muted-foreground">
              Extracción e ingesta de fichas técnicas con IA
            </p>
          </div>
        </div>

        {/* ── Upload card ──────────────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Extraer nueva ficha técnica
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid sm:grid-cols-3 gap-4">

                {/* PDF file input */}
                <div className="sm:col-span-3">
                  <label className="text-sm font-medium mb-1.5 block">
                    Archivo PDF <span className="text-destructive">*</span>
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/pdf"
                    onChange={handleFileChange}
                    disabled={busy}
                    className="block w-full text-sm text-muted-foreground
                      file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0
                      file:text-sm file:font-medium file:bg-primary file:text-primary-foreground
                      hover:file:bg-primary/90 file:cursor-pointer
                      disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  {pdfFile && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {pdfFile.name} — {(pdfFile.size / 1024 / 1024).toFixed(1)} MB
                    </p>
                  )}
                </div>

                {/* Fabricante */}
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Fabricante</label>
                  <Input
                    value={fabricante}
                    onChange={(e) => setFabricante(e.target.value)}
                    placeholder="Ej: INDECO"
                    disabled={busy}
                  />
                </div>

                {/* Tipo cable */}
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Tipo de cable</label>
                  <Select value={tipoCable} onValueChange={setTipoCable} disabled={busy}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIPOS_CABLE.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Submit button */}
                <div className="flex items-end">
                  <Button
                    type="submit"
                    disabled={!pdfFile || busy}
                    className="w-full"
                  >
                    {uploadState === 'idle' && (
                      <>
                        <Cpu className="h-4 w-4 mr-2" />
                        Extraer con IA
                      </>
                    )}
                    {uploadState === 'uploading' && (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Enviando PDF...
                      </>
                    )}
                    {(uploadState === 'processing' || uploadState === 'done') && (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Claude procesando...
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Progress indicator */}
              {(uploadState === 'uploading' || uploadState === 'processing') && (
                <div className="rounded-lg bg-muted/50 border p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">
                        {uploadState === 'uploading'
                          ? 'Enviando PDF al servidor...'
                          : 'Claude está analizando la ficha técnica...'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {uploadState === 'uploading'
                          ? 'Preparando el archivo para procesamiento'
                          : 'Extrayendo atributos técnicos — esto puede tomar 30–60 segundos'}
                      </p>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                    {uploadState === 'uploading' ? (
                      <div className="h-full w-1/4 bg-primary rounded-full transition-all duration-500" />
                    ) : (
                      <div className="h-full w-full bg-primary rounded-full animate-pulse" />
                    )}
                  </div>

                  {/* Stage indicators */}
                  {uploadState === 'processing' && (
                    <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 className="h-3 w-3 text-green-500" />
                        PDF recibido
                      </span>
                      <span className="flex items-center gap-1.5 text-foreground">
                        <Loader2 className="h-3 w-3 animate-spin text-primary" />
                        Extrayendo con IA
                      </span>
                      <span className="flex items-center gap-1.5 opacity-40">
                        <Clock className="h-3 w-3" />
                        Guardando resultado
                      </span>
                    </div>
                  )}
                </div>
              )}
            </form>
          </CardContent>
        </Card>

        {/* ── Candidates list ──────────────────────────────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Candidatos</h2>
            <div className="flex items-center gap-2">
              <Link href="/admin/pipeline/keywords">
                <Button size="sm" variant="ghost" className="text-muted-foreground gap-1.5">
                  <BarChart2 className="h-3.5 w-3.5" />
                  Keywords
                </Button>
              </Link>
              <Button
                size="sm"
                variant="outline"
                onClick={fetchCandidatos}
                disabled={loadingList}
              >
                {loadingList
                  ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  : 'Actualizar'
                }
              </Button>
            </div>
          </div>

          {loadingList ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : listError ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 flex items-center gap-3 text-sm text-destructive">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span className="flex-1">{listError}</span>
              <Button size="sm" variant="outline" onClick={fetchCandidatos}>
                Reintentar
              </Button>
            </div>
          ) : (
            <Tabs defaultValue="pending">
              <TabsList>
                <TabsTrigger value="pending" className="gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  Pendientes
                  {pending.length > 0 && (
                    <Badge
                      variant="destructive"
                      className="ml-1 h-5 min-w-5 px-1 text-xs"
                    >
                      {pending.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="approved" className="gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Aprobados
                  {approved.length > 0 && (
                    <Badge
                      variant="secondary"
                      className="ml-1 h-5 min-w-5 px-1 text-xs"
                    >
                      {approved.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="rejected" className="gap-1.5">
                  <XCircle className="h-3.5 w-3.5" />
                  Rechazados
                  {rejected.length > 0 && (
                    <Badge
                      variant="secondary"
                      className="ml-1 h-5 min-w-5 px-1 text-xs"
                    >
                      {rejected.length}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="pending" className="mt-4">
                <CandidatesTable
                  rows={pending}
                  onRevisar={(id) => router.push(`/admin/pipeline/${id}`)}
                />
              </TabsContent>
              <TabsContent value="approved" className="mt-4">
                <CandidatesTable
                  rows={approved}
                  onRevisar={(id) => router.push(`/admin/pipeline/${id}`)}
                />
              </TabsContent>
              <TabsContent value="rejected" className="mt-4">
                <CandidatesTable
                  rows={rejected}
                  onRevisar={(id) => router.push(`/admin/pipeline/${id}`)}
                />
              </TabsContent>
            </Tabs>
          )}
        </div>

      </div>
    </AdminRoute>
  );
}
