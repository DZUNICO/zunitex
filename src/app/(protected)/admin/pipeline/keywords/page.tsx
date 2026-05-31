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

// ── Types ──────────────────────────────────────────────────────────────────────

type KeywordStat = {
  tipo_cable:    string;
  count:         number;
  last_uploaded: string;
};

type UploadResult = { inserted: number; updated: number; errors: string[] };

// ── Cable type options (CABLE_NOMENCLATURE keys) ──────────────────────────────

const CABLE_TYPES = [
  'TW-80', 'THW-90', 'NH', 'NHX-90',
  'N2XOH', 'NYY', 'N2XY', 'RV-K',
  'NLT', 'CTM', 'GPT', 'WS', 'SGT',
  'SOLAR_DC', 'UTP_CAT6', 'FPL', 'DESNUDO_TEMPLE_BLANDO',
];

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
  const [csvFile,      setCsvFile]      = useState<File | null>(null);
  const [uploading,    setUploading]    = useState(false);
  const [lastResult,   setLastResult]   = useState<UploadResult | null>(null);
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
    setCsvFile(null);
    setLastResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setModalOpen(true);
  }

  async function handleUpload() {
    if (!user || !csvFile || !selectedType) return;
    setUploading(true);
    setLastResult(null);
    try {
      const csvText = await readFileAsUtf16(csvFile);
      const token   = await user.getIdToken();
      const res     = await fetch('/api/pipeline/keywords/upload', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ csv_text: csvText, tipo_cable: selectedType }),
      });
      const d = await res.json() as UploadResult & { error?: string };
      if (!res.ok) throw new Error(d.error ?? `HTTP ${res.status}`);
      setLastResult(d);
      toast({ title: `${d.inserted} keywords procesadas`, description: d.errors.length > 0 ? `${d.errors.length} errores` : undefined });
      fetchStats();
    } catch (err) {
      toast({ title: 'Error al subir CSV', description: (err as Error).message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
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
              <label className="text-sm font-medium">Archivo CSV</label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.tsv,.txt"
                disabled={uploading}
                onChange={(e) => setCsvFile(e.target.files?.[0] ?? null)}
                className="block w-full text-sm text-muted-foreground
                  file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0
                  file:text-sm file:font-medium file:bg-primary file:text-primary-foreground
                  hover:file:bg-primary/90 file:cursor-pointer disabled:opacity-50"
              />
              {csvFile && (
                <p className="text-xs text-muted-foreground">
                  {csvFile.name} — {(csvFile.size / 1024).toFixed(0)} KB
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Exportar desde Google Keyword Planner → Descargar plan → CSV.
                El archivo debe estar en formato UTF-16 (separador tab, 3 filas de header).
              </p>
            </div>

            {lastResult && (
              <div className="rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-3 text-sm">
                <p className="font-medium text-green-800 dark:text-green-300">
                  {lastResult.inserted} keywords procesadas
                </p>
                {lastResult.errors.length > 0 && (
                  <p className="text-xs text-orange-700 dark:text-orange-400 mt-1">
                    {lastResult.errors.length} filas con error (ignoradas)
                  </p>
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
              disabled={uploading || !csvFile || !selectedType}
            >
              {uploading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {uploading ? 'Procesando...' : 'Subir y procesar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
