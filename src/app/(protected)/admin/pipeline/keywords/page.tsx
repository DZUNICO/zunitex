'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth }                      from '@/lib/context/auth-context';
import { Button }                       from '@/components/ui/button';
import { Badge }                        from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { useToast }       from '@/hooks/use-toast';
import { Loader2, Upload, BarChart2, ArrowLeft } from 'lucide-react';
import Link               from 'next/link';
import { CABLE_NOMENCLATURE } from '@/lib/pipeline/cable-nomenclature';

// ── Types ──────────────────────────────────────────────────────────────────────

type KeywordStat = {
  tipo_cable:    string;
  count:         number;
  last_uploaded: string;
};

const MAX_FILES = 5;

type FileResult  = { filename: string; inserted: number; errors: string[] };
type BatchResult = { total_inserted: number; total_errors: number; files: FileResult[] };

// ── Cable type options — derived from CABLE_NOMENCLATURE so new types appear automatically

const CABLE_TYPES = Object.keys(CABLE_NOMENCLATURE).sort();

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-PE', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// ── Read file as UTF-16 text ───────────────────────────────────────────────────

function readFileAsUtf16(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const buffer  = e.target!.result as ArrayBuffer;
        const bytes   = new Uint8Array(buffer);
        // Detect BOM: FF FE = UTF-16 LE, FE FF = UTF-16 BE
        const hasBom  = (bytes[0] === 0xFF && bytes[1] === 0xFE) ||
                        (bytes[0] === 0xFE && bytes[1] === 0xFF);
        const encoding = hasBom ? 'utf-16' : 'utf-16le';
        resolve(new TextDecoder(encoding).decode(buffer));
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Error al leer el archivo'));
    reader.readAsArrayBuffer(file);
  });
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function KeywordsPage() {
  const { user }  = useAuth();
  const { toast } = useToast();

  const [stats,        setStats]        = useState<KeywordStat[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [modalOpen,    setModalOpen]    = useState(false);
  const [selectedType, setSelectedType] = useState('');
  const [files,          setFiles]          = useState<File[]>([]);
  const [filesTruncated, setFilesTruncated] = useState(false);
  const [uploading,      setUploading]      = useState(false);
  const [progress,       setProgress]       = useState<{ current: number; total: number } | null>(null);
  const [batchResult,    setBatchResult]    = useState<BatchResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function fetchStats() {
    if (!user) return;
    setLoadingStats(true);
    try {
      const token = await user.getIdToken();
      const res   = await fetch('/api/pipeline/keywords/upload', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const d = await res.json() as { stats?: KeywordStat[]; error?: string };
      if (!res.ok) throw new Error(d.error ?? `HTTP ${res.status}`);
      setStats(d.stats ?? []);
    } catch (err) {
      toast({ title: 'Error al cargar stats', description: (err as Error).message, variant: 'destructive' });
    } finally {
      setLoadingStats(false);
    }
  }

  useEffect(() => { fetchStats(); }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  function openUploadModal(preselect?: string) {
    setSelectedType(preselect ?? '');
    setFiles([]);
    setFilesTruncated(false);
    setBatchResult(null);
    setProgress(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setModalOpen(true);
  }

  async function handleUpload() {
    if (!user || files.length === 0 || !selectedType) return;
    setUploading(true);
    setBatchResult(null);

    const fileResults: FileResult[] = [];
    let totalInserted = 0;
    let totalErrors   = 0;

    for (let i = 0; i < files.length; i++) {
      setProgress({ current: i + 1, total: files.length });
      const file = files[i];
      try {
        const csvText = await readFileAsUtf16(file);
        const token   = await user.getIdToken();
        const res     = await fetch('/api/pipeline/keywords/upload', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body:    JSON.stringify({ csv_text: csvText, tipo_cable: selectedType }),
        });
        const d = await res.json() as { inserted?: number; errors?: string[]; error?: string };
        if (!res.ok) {
          fileResults.push({ filename: file.name, inserted: 0, errors: [d.error ?? `HTTP ${res.status}`] });
          totalErrors++;
        } else {
          const inserted = d.inserted ?? 0;
          const errors   = d.errors ?? [];
          fileResults.push({ filename: file.name, inserted, errors });
          totalInserted += inserted;
          totalErrors   += errors.length;
        }
      } catch (err) {
        fileResults.push({ filename: file.name, inserted: 0, errors: [(err as Error).message] });
        totalErrors++;
      }
    }

    const result: BatchResult = { total_inserted: totalInserted, total_errors: totalErrors, files: fileResults };
    setBatchResult(result);
    setProgress(null);
    toast({
      title:       `${files.length} archivo${files.length > 1 ? 's' : ''} procesado${files.length > 1 ? 's' : ''}`,
      description: `${totalInserted} keywords procesadas${totalErrors > 0 ? `, ${totalErrors} errores` : ''}`,
    });
    fetchStats();
    setUploading(false);
  }

  return (
    <div className="container max-w-4xl mx-auto p-4 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/admin/pipeline" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <BarChart2 className="h-5 w-5 text-primary" />
          <div>
            <h1 className="text-xl font-bold">Keywords SEO del Pipeline</h1>
            <p className="text-sm text-muted-foreground">
              Keywords de Google Keyword Planner por tipo de cable
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => fetchStats()} disabled={loadingStats}>
            {loadingStats ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Actualizar'}
          </Button>
          <Button size="sm" onClick={() => openUploadModal()}>
            <Upload className="h-3.5 w-3.5 mr-1.5" />
            Subir CSV
          </Button>
        </div>
      </div>

      {/* Stats table */}
      {loadingStats ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : stats.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center space-y-3">
          <BarChart2 className="h-8 w-8 text-muted-foreground/40 mx-auto" />
          <p className="text-sm text-muted-foreground">
            No hay keywords cargadas. Usa el botón <strong>Subir CSV</strong> para comenzar.
          </p>
          <p className="text-xs text-muted-foreground">
            Exporta desde Google Keyword Planner en formato CSV (UTF-16, separador tab).
          </p>
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 border-b">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Tipo de cable</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">Keywords</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Última carga</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {stats.map((s, i) => (
                <tr key={s.tipo_cable} className={i % 2 === 0 ? 'bg-background' : 'bg-muted/20'}>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className="text-xs font-mono uppercase">
                      {s.tipo_cable}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="font-medium">{s.count.toLocaleString()}</span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {formatDate(s.last_uploaded)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button size="sm" variant="outline" onClick={() => openUploadModal(s.tipo_cable)}>
                      <Upload className="h-3 w-3 mr-1" />
                      Actualizar CSV
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Upload modal */}
      <Dialog open={modalOpen} onOpenChange={(o) => { if (!uploading) setModalOpen(o); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Subir CSV de Google Keyword Planner
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Tipo de cable</label>
              <Select value={selectedType} onValueChange={setSelectedType} disabled={uploading}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tipo..." />
                </SelectTrigger>
                <SelectContent>
                  {CABLE_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                Archivos CSV
                <span className="ml-1 text-xs text-muted-foreground font-normal">(máx. {MAX_FILES})</span>
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                multiple
                disabled={uploading}
                onChange={(e) => {
                  const selected = Array.from(e.target.files ?? []);
                  setFilesTruncated(selected.length > MAX_FILES);
                  setFiles(selected.slice(0, MAX_FILES));
                  setBatchResult(null);
                }}
                className="block w-full text-sm text-muted-foreground
                  file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0
                  file:text-sm file:font-medium file:bg-primary file:text-primary-foreground
                  hover:file:bg-primary/90 file:cursor-pointer disabled:opacity-50"
              />
              {filesTruncated && (
                <p className="text-xs text-orange-700 dark:text-orange-400">
                  Solo se tomarán los primeros {MAX_FILES} archivos seleccionados.
                </p>
              )}
              {files.length > 0 && (
                <ul className="space-y-0.5">
                  {files.map((f, i) => (
                    <li key={i} className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-full bg-muted flex items-center justify-center text-[10px] shrink-0">
                        {i + 1}
                      </span>
                      <span className="truncate">{f.name}</span>
                      <span className="shrink-0 text-muted-foreground/60">({(f.size / 1024).toFixed(0)} KB)</span>
                    </li>
                  ))}
                </ul>
              )}
              <p className="text-xs text-muted-foreground">
                Exportar desde Google Keyword Planner → Descargar plan → CSV.
                Formato UTF-16, separador tab, 3 filas de header. El tipo de cable
                se aplica a todos los archivos del lote.
              </p>
            </div>

            {progress && (
              <div className="rounded-lg bg-muted/50 border p-3 text-sm flex items-center gap-2">
                <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0 text-primary" />
                <span className="text-xs">
                  Procesando archivo {progress.current} de {progress.total}…
                </span>
              </div>
            )}

            {batchResult && (
              <div className="rounded-lg border p-3 text-sm space-y-2">
                <p className="font-medium text-green-800 dark:text-green-300">
                  {batchResult.files.length} archivo{batchResult.files.length > 1 ? 's' : ''} procesado{batchResult.files.length > 1 ? 's' : ''} —{' '}
                  {batchResult.total_inserted.toLocaleString()} keywords
                </p>
                {batchResult.files.some((r) => r.errors.length > 0) && (
                  <div className="space-y-1">
                    {batchResult.files.filter((r) => r.errors.length > 0).map((r, i) => (
                      <p key={i} className="text-xs text-orange-700 dark:text-orange-400">
                        {r.filename}: {r.errors.length} fila{r.errors.length > 1 ? 's' : ''} con error
                      </p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)} disabled={uploading}>
              Cancelar
            </Button>
            <Button
              onClick={handleUpload}
              disabled={uploading || files.length === 0 || !selectedType}
            >
              {uploading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {uploading
                ? (progress ? `Procesando ${progress.current}/${progress.total}…` : 'Procesando…')
                : `Subir${files.length > 1 ? ` ${files.length} archivos` : ''}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
