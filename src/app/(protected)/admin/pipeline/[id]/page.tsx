'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useParams }                       from 'next/navigation';
import { useAuth }                                    from '@/lib/context/auth-context';
import { Button }                                     from '@/components/ui/button';
import { Input }                                      from '@/components/ui/input';
import { Badge }                                      from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useToast }                                   from '@/hooks/use-toast';
import {
  Loader2, FileText, ChevronDown, ChevronRight,
  X, Plus, CheckCircle2, AlertTriangle, Save,
  ThumbsUp, ThumbsDown, ArrowLeft, Tags, Check,
} from 'lucide-react';
import Link from 'next/link';
import type { ExtraccionResult, Variante, PipelineCandidato } from '@/lib/pipeline/types';
import type { SuggestKeywordsResponse }                       from '@/app/api/pipeline/keywords/suggest/route';

// ── Small helpers ──────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-PE', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function ConfidenceBadge({ score }: { score: number | null }) {
  if (score === null) return <span className="text-muted-foreground text-xs">—</span>;
  const pct = Math.round(score * 100);
  const cls = score >= 0.9
    ? 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400'
    : score >= 0.7
      ? 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400'
      : 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400';
  return <Badge className={cls}>{pct}%</Badge>;
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'approved') return <Badge className="bg-green-100 text-green-800 border-green-200">Aprobado</Badge>;
  if (status === 'rejected') return <Badge variant="destructive">Rechazado</Badge>;
  return <Badge variant="secondary">Pendiente</Badge>;
}

function SectionHeader({
  title, open, onToggle, badge,
}: {
  title: string; open: boolean; onToggle: () => void; badge?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="w-full flex items-center gap-2 text-left py-2 px-3 rounded-md bg-muted/40 hover:bg-muted/60 transition-colors"
    >
      {open ? <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
            : <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />}
      <span className="font-medium text-sm flex-1">{title}</span>
      {badge}
    </button>
  );
}

function FieldRow({ label, children, tooltip }: { label: string; children: React.ReactNode; tooltip?: string }) {
  return (
    <div className="grid grid-cols-[140px_1fr] gap-2 items-start">
      <label className="text-xs text-muted-foreground pt-2 leading-tight" title={tooltip}>{label}</label>
      <div>{children}</div>
    </div>
  );
}

function AliasTags({
  aliases, onChange, disabled,
}: { aliases: string[]; onChange: (v: string[]) => void; disabled: boolean }) {
  const [input, setInput] = useState('');
  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap gap-1.5">
        {aliases.map((a, i) => (
          <span key={i} className="inline-flex items-center gap-1 bg-muted text-xs rounded-full px-2.5 py-0.5">
            {a}
            {!disabled && (
              <button type="button" onClick={() => onChange(aliases.filter((_, j) => j !== i))}>
                <X className="h-2.5 w-2.5" />
              </button>
            )}
          </span>
        ))}
      </div>
      {!disabled && (
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && input.trim()) {
              e.preventDefault();
              onChange([...aliases, input.trim()]);
              setInput('');
            }
          }}
          placeholder="Nuevo alias (Enter para agregar)"
          className="h-7 text-xs"
        />
      )}
    </div>
  );
}

function PropiedadesDisplay({ propiedades }: { propiedades: Record<string, boolean> | null }) {
  if (!propiedades) return <span className="text-xs text-muted-foreground">—</span>;
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1">
      {Object.entries(propiedades).map(([k, v]) => (
        <span key={k} className={`text-xs flex items-center gap-1 ${v ? 'text-foreground' : 'text-muted-foreground/50'}`}>
          <span className={`w-2 h-2 rounded-full ${v ? 'bg-green-500' : 'bg-muted-foreground/30'}`} />
          {k.replace(/_/g, ' ')}
        </span>
      ))}
    </div>
  );
}

// ── Variant card ───────────────────────────────────────────────────────────────

function VarianteCard({
  v, idx, canDelete, disabled, onUpdate, onUpdateNested, onUpdateNestedWithDisplay, onUpdateDeep, onDelete,
}: {
  v: Variante;
  idx: number;
  canDelete: boolean;
  disabled: boolean;
  onUpdate: (i: number, field: keyof Variante, val: unknown) => void;
  onUpdateNested: (i: number, sec: keyof Variante, field: string, val: unknown) => void;
  onUpdateNestedWithDisplay: (i: number, sec: keyof Variante, field: string, val: unknown) => void;
  onUpdateDeep: (i: number, sec: keyof Variante, sub: string, field: string, val: unknown) => void;
  onDelete: (i: number) => void;
}) {
  const label = v.configuracion_display ?? `${v.seccion?.valor ?? '?'} ${v.seccion?.unidad ?? ''}`.trim();
  return (
    <div className="rounded-lg border p-3 space-y-2.5 relative">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium font-mono">{label || `Variante ${idx + 1}`}</span>
        <div className="flex items-center gap-2">
          <ConfidenceBadge score={v.data_quality?.confidence_score ?? null} />
          {canDelete && !disabled && (
            <button type="button" onClick={() => onDelete(idx)} className="text-muted-foreground hover:text-destructive">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <FieldRow label="N° de polos">
          <Select
            value={String(v.conductores?.cantidad ?? 'none')}
            onValueChange={(val) => onUpdateNestedWithDisplay(idx, 'conductores', 'cantidad', val === 'none' ? null : Number(val))}
            disabled={disabled}
          >
            <SelectTrigger className="h-7 text-xs">
              <SelectValue placeholder="—" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">—</SelectItem>
              <SelectItem value="1">1</SelectItem>
              <SelectItem value="2">2</SelectItem>
              <SelectItem value="3">3</SelectItem>
              <SelectItem value="4">4</SelectItem>
            </SelectContent>
          </Select>
        </FieldRow>
        <FieldRow label="Sección">
          <Input
            type="number"
            value={v.seccion?.valor ?? ''}
            onChange={(e) => onUpdateNestedWithDisplay(idx, 'seccion', 'valor', e.target.value === '' ? null : Number(e.target.value))}
            disabled={disabled}
            className="h-7 text-xs"
          />
        </FieldRow>
        <FieldRow label="Unidad">
          <Select
            value={v.seccion?.unidad ?? 'AWG'}
            onValueChange={(val) => onUpdateNestedWithDisplay(idx, 'seccion', 'unidad', val)}
            disabled={disabled}
          >
            <SelectTrigger className="h-7 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="AWG">AWG</SelectItem>
              <SelectItem value="mm2">mm²</SelectItem>
              <SelectItem value="MCM">MCM</SelectItem>
            </SelectContent>
          </Select>
        </FieldRow>
        <FieldRow label="N° hilos">
          <Input
            type="number"
            value={v.conductores?.n_hilos ?? ''}
            onChange={(e) => onUpdateNested(idx, 'conductores', 'n_hilos', e.target.value === '' ? null : Number(e.target.value))}
            disabled={disabled}
            className="h-7 text-xs"
          />
        </FieldRow>
        <FieldRow label="Diám. exterior mm">
          <Input
            type="number"
            step="0.1"
            value={v.diametros?.exterior_mm ?? ''}
            onChange={(e) => onUpdateNested(idx, 'diametros', 'exterior_mm', e.target.value === '' ? null : Number(e.target.value))}
            disabled={disabled}
            className="h-7 text-xs"
          />
        </FieldRow>
        <FieldRow label="Peso kg/km">
          <Input
            type="number"
            value={v.peso_kg_km ?? ''}
            onChange={(e) => onUpdate(idx, 'peso_kg_km', e.target.value === '' ? null : Number(e.target.value))}
            disabled={disabled}
            className="h-7 text-xs"
          />
        </FieldRow>
        <FieldRow label="Resist. DC Ω/km">
          <Input
            type="number"
            step="0.01"
            value={v.performance_electrica?.resistencia_dc_ohm_km ?? ''}
            onChange={(e) => onUpdateNested(idx, 'performance_electrica', 'resistencia_dc_ohm_km', e.target.value === '' ? null : Number(e.target.value))}
            disabled={disabled}
            className="h-7 text-xs"
          />
        </FieldRow>
        <FieldRow
          label="Corriente máx. aire (A)"
          tooltip="Sin dato — este cable puede no estar especificado para instalación al aire libre, o el fabricante no incluye este valor en la ficha técnica"
        >
          <Input
            type="number"
            value={v.performance_electrica?.ampacidad?.aire_a ?? ''}
            onChange={(e) => onUpdateDeep(idx, 'performance_electrica', 'ampacidad', 'aire_a', e.target.value === '' ? null : Number(e.target.value))}
            disabled={disabled}
            placeholder="—"
            title="Sin dato — este cable puede no estar especificado para instalación al aire libre, o el fabricante no incluye este valor en la ficha técnica"
            className="h-7 text-xs"
          />
        </FieldRow>
        <FieldRow
          label="Corriente máx. ducto (A)"
          tooltip="Sin dato — este cable puede no estar especificado para instalación en ducto, o el fabricante no incluye este valor en la ficha técnica"
        >
          <Input
            type="number"
            value={v.performance_electrica?.ampacidad?.ducto_a ?? ''}
            onChange={(e) => onUpdateDeep(idx, 'performance_electrica', 'ampacidad', 'ducto_a', e.target.value === '' ? null : Number(e.target.value))}
            disabled={disabled}
            placeholder="—"
            title="Sin dato — este cable puede no estar especificado para instalación en ducto, o el fabricante no incluye este valor en la ficha técnica"
            className="h-7 text-xs"
          />
        </FieldRow>
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function PipelineReviewPage() {
  const { user }  = useAuth();
  const router    = useRouter();
  const { toast } = useToast();
  const params    = useParams<{ id: string }>();
  const id        = params.id;

  // ── Data ───────────────────────────────────────────────────────────────────
  const [candidato,   setCandidato]   = useState<PipelineCandidato | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [fetchError,  setFetchError]  = useState<string | null>(null);

  // ── Editor state ───────────────────────────────────────────────────────────
  const [json,     setJson]     = useState<ExtraccionResult | null>(null);
  const [notas,    setNotas]    = useState('');
  const [sections, setSections] = useState({
    core:     true,
    variantes: true,
    quality:  false,
    notas:    true,
  });

  // ── Auto-save ──────────────────────────────────────────────────────────────
  type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';
  const [saveStatus,  setSaveStatus]  = useState<SaveStatus>('idle');
  const saveTimerRef                  = useRef<ReturnType<typeof setTimeout> | null>(null);

  const doAutoSave = useCallback(async (nextJson: ExtraccionResult, nextNotas: string) => {
    if (!user) return;
    setSaveStatus('saving');
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/pipeline/candidates/${id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ edited_json: nextJson, notas: nextNotas }),
      });
      setSaveStatus(res.ok ? 'saved' : 'error');
    } catch {
      setSaveStatus('error');
    }
  }, [user, id]);

  function scheduleAutoSave(nextJson: ExtraccionResult, nextNotas: string) {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    setSaveStatus('idle');
    saveTimerRef.current = setTimeout(() => doAutoSave(nextJson, nextNotas), 2000);
  }

  // ── Action state ───────────────────────────────────────────────────────────
  type ActionState = 'idle' | 'approving' | 'rejecting';
  const [actionState, setActionState] = useState<ActionState>('idle');

  // ── Keyword suggestions state ──────────────────────────────────────────────
  const [kwLoading,     setKwLoading]     = useState(false);
  const [kwSuggestions, setKwSuggestions] = useState<SuggestKeywordsResponse | null>(null);
  const [kwError,       setKwError]       = useState<string | null>(null);
  const [acceptedKw,    setAcceptedKw]    = useState<Set<string>>(new Set());

  // ── Fetch candidato ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user || !id) return;
    (async () => {
      try {
        const token = await user.getIdToken();
        const res   = await fetch(`/api/pipeline/candidates/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({})) as { error?: string };
          throw new Error(body.error ?? `HTTP ${res.status}`);
        }
        const data = await res.json() as { candidato: PipelineCandidato };
        setCandidato(data.candidato);
        // Pre-fill editor: prefer edited_json, fallback to raw_json
        const workingJson = (data.candidato.edited_json ?? data.candidato.raw_json) as ExtraccionResult | null;
        setJson(workingJson);
        setNotas(data.candidato.notas ?? '');
      } catch (err) {
        setFetchError((err as Error).message ?? 'Error desconocido');
      } finally {
        setLoading(false);
      }
    })();
  }, [user, id]);

  // ── JSON update helpers ────────────────────────────────────────────────────
  function setJsonAndSchedule(next: ExtraccionResult) {
    setJson(next);
    scheduleAutoSave(next, notas);
  }

  function updateCore(field: keyof ExtraccionResult['PRODUCTO_CORE'], value: unknown) {
    if (!json) return;
    setJsonAndSchedule({ ...json, PRODUCTO_CORE: { ...json.PRODUCTO_CORE, [field]: value } });
  }

  function updateCoreNested(section: keyof ExtraccionResult['PRODUCTO_CORE'], field: string, value: unknown) {
    if (!json) return;
    const prev = (json.PRODUCTO_CORE[section] as Record<string, unknown>) ?? {};
    setJsonAndSchedule({ ...json, PRODUCTO_CORE: { ...json.PRODUCTO_CORE, [section]: { ...prev, [field]: value } } });
  }

  function updateVariant(i: number, field: keyof Variante, value: unknown) {
    if (!json) return;
    const vs = [...json.VARIANTES];
    vs[i] = { ...vs[i], [field]: value };
    setJsonAndSchedule({ ...json, VARIANTES: vs });
  }

  function updateVariantNested(i: number, sec: keyof Variante, field: string, value: unknown) {
    if (!json) return;
    const vs = [...json.VARIANTES];
    const prev = (vs[i][sec] as Record<string, unknown>) ?? {};
    vs[i] = { ...vs[i], [sec]: { ...prev, [field]: value } };
    setJsonAndSchedule({ ...json, VARIANTES: vs });
  }

  // Like updateVariantNested but also regenerates configuracion_display
  // from the updated conductores.cantidad + seccion values.
  function updateVariantNestedWithDisplay(i: number, sec: keyof Variante, field: string, value: unknown) {
    if (!json) return;
    const vs = [...json.VARIANTES];
    const prev = (vs[i][sec] as Record<string, unknown>) ?? {};
    vs[i] = { ...vs[i], [sec]: { ...prev, [field]: value } };
    // Read updated values from the patched variant
    const v     = vs[i];
    const polos = (v.conductores as Record<string, unknown>)?.cantidad as number | null ?? null;
    const sVal  = (v.seccion    as Record<string, unknown>)?.valor    as number | null ?? null;
    const sUnit = ((v.seccion   as Record<string, unknown>)?.unidad   as string) ?? 'AWG';
    if (sVal != null) {
      const unitDisplay = sUnit === 'mm2' ? 'mm²' : sUnit;
      vs[i] = {
        ...vs[i],
        configuracion_display: polos != null
          ? `${polos}x${sVal} ${unitDisplay}`
          : `${sVal} ${unitDisplay}`,
      };
    }
    setJsonAndSchedule({ ...json, VARIANTES: vs });
  }

  function updateVariantDeep(i: number, sec: keyof Variante, sub: string, field: string, value: unknown) {
    if (!json) return;
    const vs = [...json.VARIANTES];
    const secObj  = (vs[i][sec]  as Record<string, unknown>) ?? {};
    const subObj  = (secObj[sub] as Record<string, unknown>) ?? {};
    vs[i] = { ...vs[i], [sec]: { ...secObj, [sub]: { ...subObj, [field]: value } } };
    setJsonAndSchedule({ ...json, VARIANTES: vs });
  }

  function deleteVariant(i: number) {
    if (!json || json.VARIANTES.length <= 1) return;
    const vs = json.VARIANTES.filter((_, j) => j !== i);
    setJsonAndSchedule({ ...json, VARIANTES: vs });
  }

  function addVariant() {
    if (!json) return;
    const newV: Variante = {
      variant_id: crypto.randomUUID(),
      product_id: json.PRODUCTO_CORE.product_id ?? '',
      sku_fabricante: null, codigo_pais: null, configuracion_display: null,
      conductores: { cantidad: 1, n_hilos: null, geometria: null },
      seccion: { valor: null, unidad: 'AWG' },
      normalizacion_tecnica: { seccion_mm2_equivalente: null, awg_equivalente: null, seccion_display: null },
      diametros: { conductor_mm: null, espesor_aislamiento_mm: null, espesor_cubierta_mm: null, exterior_mm: null },
      peso_kg_km: null, radio_minimo_curvatura_mm: null, traccion_maxima_n: null,
      performance_electrica: {
        resistencia_dc_ohm_km: null, capacitancia_pf_m: null,
        ampacidad: { aire_a: null, ducto_a: null, enterrado_a: null, aire_formacion_plana_a: null, aire_formacion_triangular_a: null, temperatura_ambiente_c: null },
      },
      colores_disponibles: [], presentacion: [],
      pricing: { precio_ref_pen: null, precio_ref_usd: null, fuente_precio: null, fecha_precio: null },
      stock_metadata: { disponibilidad: null, fabricacion_especial: false },
      data_quality: { confidence_score: null, fuente_tipo: null, manual_reviewed: false, reviewed_by: null, last_verified_at: null },
    };
    setJsonAndSchedule({ ...json, VARIANTES: [...json.VARIANTES, newV] });
  }

  // ── Actions ────────────────────────────────────────────────────────────────
  async function handleReject() {
    if (!user || !candidato) return;
    if (!confirm('¿Rechazar este candidato?')) return;
    setActionState('rejecting');
    try {
      const token = await user.getIdToken();
      // Flush any pending auto-save first
      if (saveTimerRef.current) { clearTimeout(saveTimerRef.current); }
      if (json && notas !== (candidato.notas ?? '')) {
        await doAutoSave(json, notas);
      }
      const res = await fetch('/api/pipeline/reject', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ candidato_id: id }),
      });
      const body = await res.json() as { error?: string };
      if (!res.ok) throw new Error(body.error ?? `HTTP ${res.status}`);
      toast({ title: 'Candidato rechazado' });
      router.push('/admin/pipeline');
    } catch (err) {
      toast({ title: 'Error al rechazar', description: (err as Error).message, variant: 'destructive' });
      setActionState('idle');
    }
  }

  async function handleApprove() {
    if (!user || !candidato) return;
    if (!confirm('¿Aprobar e insertar en el catálogo? Esta acción no se puede deshacer.')) return;
    setActionState('approving');
    try {
      const token = await user.getIdToken();
      // Flush pending auto-save
      if (saveTimerRef.current) { clearTimeout(saveTimerRef.current); }
      if (json) { await doAutoSave(json, notas); }
      const res = await fetch('/api/pipeline/approve', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ candidato_id: id }),
      });
      const body = await res.json() as { producto_id?: string; error?: string; warning?: string };
      if (!res.ok && res.status !== 207) throw new Error(body.error ?? `HTTP ${res.status}`);
      toast({ title: 'Producto insertado correctamente', description: `ID: ${body.producto_id}` });
      router.push('/admin/pipeline');
    } catch (err) {
      toast({ title: 'Error al aprobar', description: (err as Error).message, variant: 'destructive' });
      setActionState('idle');
    }
  }

  async function fetchSuggestions() {
    if (!user || !json) return;
    setKwLoading(true);
    setKwSuggestions(null);
    setKwError(null);
    setAcceptedKw(new Set());
    try {
      const token    = await user.getIdToken();
      const tipo     = encodeURIComponent(core?.tipo_cable ?? '');
      const existing = encodeURIComponent((core?.aliases_busqueda ?? []).join(','));
      const res      = await fetch(
        `/api/pipeline/keywords/suggest?tipo_cable=${tipo}&existing_aliases=${existing}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const data = await res.json() as SuggestKeywordsResponse & { error?: string };
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      setKwSuggestions(data);
    } catch (err) {
      setKwError((err as Error).message);
    } finally {
      setKwLoading(false);
    }
  }

  function acceptKw(keyword: string) {
    if (!json) return;
    const current = core?.aliases_busqueda ?? [];
    if (current.includes(keyword)) return;
    updateCore('aliases_busqueda', [...current, keyword]);
    setAcceptedKw((prev) => new Set([...prev, keyword]));
  }

  function acceptAllCoreKw() {
    if (!json || !kwSuggestions) return;
    const current = core?.aliases_busqueda ?? [];
    const toAdd   = kwSuggestions.core.map((s) => s.keyword).filter((k) => !current.includes(k));
    if (toAdd.length === 0) return;
    updateCore('aliases_busqueda', [...current, ...toAdd]);
    setAcceptedKw((prev) => new Set([...prev, ...toAdd]));
  }

  function toggleSection(s: keyof typeof sections) {
    setSections((prev) => ({ ...prev, [s]: !prev[s] }));
  }

  const busy    = actionState !== 'idle';
  const core    = json?.PRODUCTO_CORE;
  const isDone  = candidato?.status !== 'pending';

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-screen overflow-hidden">

        {/* ── Top header ──────────────────────────────────────────────────── */}
        <div className="border-b bg-background px-4 py-2.5 flex items-center gap-3 flex-shrink-0">
          <button
            type="button"
            onClick={() => router.push('/admin/pipeline')}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>

          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : candidato ? (
            <>
              <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-sm font-mono truncate max-w-[200px]">
                {candidato.pdf_filename ?? 'sin-archivo'}
              </span>
              {candidato.fabricante && (
                <span className="text-sm text-muted-foreground hidden sm:inline">
                  · {candidato.fabricante}
                </span>
              )}
              {candidato.tipo_cable && (
                <Badge variant="outline" className="text-xs uppercase">
                  {candidato.tipo_cable}
                </Badge>
              )}
              <StatusBadge status={candidato.status} />
              <ConfidenceBadge score={candidato.confidence_score} />
              <span className="text-xs text-muted-foreground hidden md:inline ml-auto">
                {formatDate(candidato.created_at)}
              </span>
            </>
          ) : null}

          {/* Auto-save indicator */}
          <div className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground">
            {saveStatus === 'saving' && <><Loader2 className="h-3 w-3 animate-spin" /> Guardando...</>}
            {saveStatus === 'saved'  && <><Save className="h-3 w-3 text-green-500" /> Guardado</>}
            {saveStatus === 'error'  && <><AlertTriangle className="h-3 w-3 text-destructive" /> Error al guardar</>}
          </div>
        </div>

        {/* ── Loading / error ──────────────────────────────────────────────── */}
        {loading && (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {!loading && fetchError && (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive flex items-center gap-3">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              {fetchError}
            </div>
          </div>
        )}

        {/* ── Split view ──────────────────────────────────────────────────── */}
        {!loading && !fetchError && (
          <div className="flex flex-1 overflow-hidden flex-col md:flex-row">

            {/* LEFT — PDF viewer */}
            <div className="md:w-1/2 h-[40vh] md:h-full border-r overflow-hidden flex flex-col bg-muted/20">
              {candidato?.raw_pdf_url ? (
                <>
                  <iframe
                    src={candidato.raw_pdf_url}
                    className="flex-1 w-full border-0"
                    title={candidato.pdf_filename ?? 'PDF'}
                  />
                  <div className="border-t p-2 flex justify-end">
                    <a
                      href={candidato.raw_pdf_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary underline"
                    >
                      Abrir en nueva pestaña
                    </a>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center gap-3 p-6 text-muted-foreground">
                  <FileText className="h-12 w-12 opacity-20" />
                  <p className="text-sm font-medium">PDF no disponible para previsualización</p>
                  <p className="text-xs text-center">{candidato?.pdf_filename}</p>
                  {candidato?.created_at && (
                    <p className="text-xs">{formatDate(candidato.created_at)}</p>
                  )}
                </div>
              )}
            </div>

            {/* RIGHT — Editor */}
            <div className="md:w-1/2 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-20">

                {!json && (
                  <div className="rounded-lg border border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 p-3 text-xs text-yellow-800 dark:text-yellow-300 flex items-center gap-2">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                    Claude no pudo extraer JSON válido de este PDF. Puedes editar manualmente o rechazar.
                  </div>
                )}

                {/* ── Sección 1: Producto Core ─────────────────────────── */}
                <div className="space-y-2">
                  <SectionHeader
                    title="Producto Core"
                    open={sections.core}
                    onToggle={() => toggleSection('core')}
                  />
                  {sections.core && core && (
                    <div className="space-y-2 px-1">
                      <FieldRow label="Nombre comercial">
                        <Input
                          value={core.nombre_comercial ?? ''}
                          onChange={(e) => updateCore('nombre_comercial', e.target.value || null)}
                          disabled={isDone || busy}
                          className="h-7 text-xs"
                        />
                      </FieldRow>
                      <FieldRow label="Fabricante">
                        <Input
                          value={core.fabricante ?? ''}
                          onChange={(e) => updateCore('fabricante', e.target.value || null)}
                          disabled={isDone || busy}
                          className="h-7 text-xs"
                        />
                      </FieldRow>
                      <FieldRow label="Tipo cable">
                        <Input
                          value={core.tipo_cable ?? ''}
                          onChange={(e) => updateCore('tipo_cable', e.target.value || null)}
                          disabled={isDone || busy}
                          className="h-7 text-xs"
                        />
                      </FieldRow>
                      <FieldRow label="Familia">
                        <Input
                          value={core.familia ?? ''}
                          onChange={(e) => updateCore('familia', e.target.value || null)}
                          disabled={isDone || busy}
                          className="h-7 text-xs"
                        />
                      </FieldRow>
                      <FieldRow label="Subfamilia">
                        <Input
                          value={core.subfamilia ?? ''}
                          onChange={(e) => updateCore('subfamilia', e.target.value || null)}
                          disabled={isDone || busy}
                          className="h-7 text-xs"
                        />
                      </FieldRow>
                      <FieldRow label="Tensión nominal">
                        <div className="flex gap-1.5">
                          <Input
                            value={core.tension_nominal?.valor ?? ''}
                            onChange={(e) => updateCoreNested('tension_nominal', 'valor', e.target.value || null)}
                            placeholder="450/750"
                            disabled={isDone || busy}
                            className="h-7 text-xs"
                          />
                          <Input
                            value={core.tension_nominal?.unidad ?? 'V'}
                            onChange={(e) => updateCoreNested('tension_nominal', 'unidad', e.target.value || 'V')}
                            placeholder="V"
                            disabled={isDone || busy}
                            className="h-7 text-xs w-16"
                          />
                        </div>
                      </FieldRow>
                      <FieldRow label="Temp. operación °C">
                        <Input
                          type="number"
                          value={core.temperatura_operacion_c ?? ''}
                          onChange={(e) => updateCore('temperatura_operacion_c', e.target.value === '' ? null : Number(e.target.value))}
                          disabled={isDone || busy}
                          className="h-7 text-xs"
                        />
                      </FieldRow>
                      <FieldRow label="Material aislamiento">
                        <Input
                          value={core.material_aislamiento ?? ''}
                          onChange={(e) => updateCore('material_aislamiento', e.target.value || null)}
                          disabled={isDone || busy}
                          className="h-7 text-xs"
                        />
                      </FieldRow>
                      <FieldRow label="Clase conductor">
                        <Input
                          value={core.clase_conductor ?? ''}
                          onChange={(e) => updateCore('clase_conductor', e.target.value || null)}
                          disabled={isDone || busy}
                          className="h-7 text-xs"
                        />
                      </FieldRow>
                      <FieldRow label="Descripción corta">
                        <textarea
                          value={core.descripcion_corta ?? ''}
                          onChange={(e) => updateCore('descripcion_corta', e.target.value || null)}
                          disabled={isDone || busy}
                          rows={2}
                          className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                        />
                      </FieldRow>
                      <FieldRow label="Alias de búsqueda">
                        <div className="space-y-2">
                          <AliasTags
                            aliases={core.aliases_busqueda ?? []}
                            onChange={(v) => updateCore('aliases_busqueda', v)}
                            disabled={isDone || busy}
                          />
                          {!isDone && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={fetchSuggestions}
                              disabled={busy || kwLoading || !json || !core?.tipo_cable}
                              className="h-7 text-xs"
                            >
                              {kwLoading
                                ? <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                : <Tags className="h-3 w-3 mr-1" />}
                              Sugerir aliases
                            </Button>
                          )}

                          {kwError && (
                            <p className="text-xs text-destructive">{kwError}</p>
                          )}

                          {kwSuggestions && kwSuggestions.total_keywords_db === 0 && (
                            <div className="rounded-lg border border-dashed p-3 text-xs text-muted-foreground space-y-1">
                              <p>No hay keywords cargadas para <strong>{core?.tipo_cable}</strong>.</p>
                              <Link href="/admin/pipeline/keywords" className="text-primary underline">
                                Gestionar keywords SEO →
                              </Link>
                            </div>
                          )}

                          {kwSuggestions && kwSuggestions.total_keywords_db > 0 && (
                            <div className="rounded-lg border p-3 space-y-3">
                              <p className="text-xs text-muted-foreground">
                                {kwSuggestions.total_keywords_db.toLocaleString()} keywords en base de datos
                              </p>

                              {kwSuggestions.core.length > 0 && (
                                <div className="space-y-1.5">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium">Core ({kwSuggestions.core.length})</span>
                                    {!isDone && (
                                      <button
                                        type="button"
                                        onClick={acceptAllCoreKw}
                                        className="text-xs text-primary underline"
                                      >
                                        Aceptar todos
                                      </button>
                                    )}
                                  </div>
                                  <div className="flex flex-wrap gap-1.5">
                                    {kwSuggestions.core.map((s, i) => {
                                      const already = (core?.aliases_busqueda ?? []).includes(s.keyword) || acceptedKw.has(s.keyword);
                                      const colorCls = s.priority === 'alta'
                                        ? 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700'
                                        : s.priority === 'media'
                                          ? 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-700'
                                          : 'bg-muted text-muted-foreground border-border';
                                      return (
                                        <button
                                          key={i}
                                          type="button"
                                          title={`${s.avg_monthly_searches.toLocaleString()} búsq/mes · ${s.competition ?? '—'} competencia`}
                                          onClick={() => !isDone && !already && acceptKw(s.keyword)}
                                          disabled={isDone || already}
                                          className={`inline-flex items-center gap-1 text-xs rounded-full px-2.5 py-0.5 border transition-colors ${
                                            already
                                              ? 'bg-muted text-muted-foreground border-border opacity-50 cursor-default'
                                              : `${colorCls} hover:opacity-80 cursor-pointer`
                                          }`}
                                        >
                                          {already ? <Check className="h-2.5 w-2.5" /> : <Plus className="h-2.5 w-2.5" />}
                                          {s.keyword}
                                          <span className="opacity-60 text-[10px]">
                                            {s.avg_monthly_searches >= 1000
                                              ? `${(s.avg_monthly_searches / 1000).toFixed(0)}k`
                                              : s.avg_monthly_searches}
                                          </span>
                                          {s.competition && (
                                            <span className={`text-[10px] ${
                                              s.competition === 'Baja'  ? 'text-green-600 dark:text-green-400' :
                                              s.competition === 'Media' ? 'text-yellow-600 dark:text-yellow-400' :
                                                                          'text-red-600 dark:text-red-400'
                                            }`}>● {s.competition}</span>
                                          )}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}

                              {kwSuggestions.variante.length > 0 && (
                                <div className="space-y-1.5">
                                  <span className="text-xs font-medium text-amber-700 dark:text-amber-400">
                                    Por calibre — click para agregar al core ({kwSuggestions.variante.length})
                                  </span>
                                  <div className="flex flex-wrap gap-1.5">
                                    {kwSuggestions.variante.map((s, i) => {
                                      const already = (core?.aliases_busqueda ?? []).includes(s.keyword) || acceptedKw.has(s.keyword);
                                      return (
                                        <button
                                          key={i}
                                          type="button"
                                          title={`${s.avg_monthly_searches.toLocaleString()} búsq/mes · ${s.competition ?? '—'} competencia`}
                                          onClick={() => !isDone && !already && acceptKw(s.keyword)}
                                          disabled={isDone || already}
                                          className={`inline-flex items-center gap-1 text-xs rounded-full px-2.5 py-0.5 border transition-colors ${
                                            already
                                              ? 'bg-muted text-muted-foreground border-border opacity-50 cursor-default'
                                              : 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-700 hover:opacity-80 cursor-pointer'
                                          }`}
                                        >
                                          {already ? <Check className="h-2.5 w-2.5" /> : <Plus className="h-2.5 w-2.5" />}
                                          {s.keyword}
                                          <span className="opacity-60 text-[10px]">
                                            {s.avg_monthly_searches >= 1000
                                              ? `${(s.avg_monthly_searches / 1000).toFixed(0)}k`
                                              : s.avg_monthly_searches}
                                          </span>
                                          {s.competition && (
                                            <span className={`text-[10px] ${
                                              s.competition === 'Baja'  ? 'text-green-600 dark:text-green-400' :
                                              s.competition === 'Media' ? 'text-yellow-600 dark:text-yellow-400' :
                                                                          'text-red-600 dark:text-red-400'
                                            }`}>● {s.competition}</span>
                                          )}
                                        </button>
                                      );
                                    })}
                                  </div>
                                  <p className="text-xs text-muted-foreground">
                                    Estas keywords incluyen calibres específicos. Se agregarán al core — el buscador las capturará igual.
                                  </p>
                                </div>
                              )}

                              {kwSuggestions.core.length === 0 && kwSuggestions.variante.length === 0 && (
                                <p className="text-xs text-muted-foreground">
                                  No hay sugerencias — todas ya incluidas o filtradas.
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </FieldRow>
                      <FieldRow label="Propiedades">
                        <PropiedadesDisplay propiedades={core.propiedades ?? null} />
                      </FieldRow>
                      {(core.normas_producto?.length ?? 0) > 0 && (
                        <FieldRow label="Normas">
                          <div className="flex flex-wrap gap-1">
                            {core.normas_producto!.map((n, i) => (
                              <Badge key={i} variant="outline" className="text-xs">{n}</Badge>
                            ))}
                          </div>
                        </FieldRow>
                      )}
                      {(core.aplicaciones?.length ?? 0) > 0 && (
                        <FieldRow label="Aplicaciones">
                          <div className="flex flex-wrap gap-1">
                            {core.aplicaciones!.map((a, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">{a.replace(/_/g, ' ')}</Badge>
                            ))}
                          </div>
                        </FieldRow>
                      )}
                    </div>
                  )}
                </div>

                {/* ── Sección 2: Variantes ─────────────────────────────── */}
                <div className="space-y-2">
                  <SectionHeader
                    title="Variantes"
                    open={sections.variantes}
                    onToggle={() => toggleSection('variantes')}
                    badge={
                      <Badge variant="secondary" className="text-xs">
                        {json?.VARIANTES?.length ?? 0}
                      </Badge>
                    }
                  />
                  {sections.variantes && (
                    <div className="space-y-2 px-1">
                      {(json?.VARIANTES ?? []).map((v, i) => (
                        <VarianteCard
                          key={v.variant_id ?? i}
                          v={v}
                          idx={i}
                          canDelete={(json?.VARIANTES?.length ?? 0) > 1}
                          disabled={isDone || busy}
                          onUpdate={updateVariant}
                          onUpdateNested={updateVariantNested}
                          onUpdateNestedWithDisplay={updateVariantNestedWithDisplay}
                          onUpdateDeep={updateVariantDeep}
                          onDelete={deleteVariant}
                        />
                      ))}
                      {!isDone && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={addVariant}
                          disabled={busy}
                          className="w-full"
                        >
                          <Plus className="h-3.5 w-3.5 mr-1" />
                          Agregar variante manualmente
                        </Button>
                      )}
                    </div>
                  )}
                </div>

                {/* ── Sección 3: Data Quality ──────────────────────────── */}
                <div className="space-y-2">
                  <SectionHeader
                    title="Data Quality"
                    open={sections.quality}
                    onToggle={() => toggleSection('quality')}
                  />
                  {sections.quality && (
                    <div className="space-y-2 px-1">
                      <FieldRow label="Confidence score">
                        <ConfidenceBadge score={candidato?.confidence_score ?? null} />
                      </FieldRow>
                      <FieldRow label="Fuente">
                        <span className="text-xs text-muted-foreground">
                          {(core?.data_quality as { fuente_tipo?: string } | null)?.fuente_tipo ?? '—'}
                        </span>
                      </FieldRow>
                      <FieldRow label="Revisado manualmente">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={!!(core?.data_quality as { manual_reviewed?: boolean } | null)?.manual_reviewed}
                            onChange={(e) => {
                              if (!json) return;
                              const dq = { ...(json.PRODUCTO_CORE.data_quality as Record<string, unknown> ?? {}), manual_reviewed: e.target.checked };
                              setJsonAndSchedule({ ...json, PRODUCTO_CORE: { ...json.PRODUCTO_CORE, data_quality: dq } });
                            }}
                            disabled={isDone || busy}
                            className="rounded"
                          />
                          <span className="text-xs">Marcar como revisado manualmente</span>
                        </label>
                      </FieldRow>
                    </div>
                  )}
                </div>

                {/* ── Sección 4: Notas del operador ───────────────────── */}
                <div className="space-y-2">
                  <SectionHeader
                    title="Notas del operador"
                    open={sections.notas}
                    onToggle={() => toggleSection('notas')}
                  />
                  {sections.notas && (
                    <textarea
                      value={notas}
                      onChange={(e) => {
                        setNotas(e.target.value);
                        if (json) scheduleAutoSave(json, e.target.value);
                      }}
                      disabled={isDone || busy}
                      rows={4}
                      placeholder="Observaciones, correcciones, dudas sobre este candidato..."
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                    />
                  )}
                </div>

              </div>

              {/* ── Sticky action bar ──────────────────────────────────── */}
              {!isDone && (
                <div className="border-t bg-background px-4 py-3 flex gap-3 flex-shrink-0">
                  <Button
                    variant="outline"
                    onClick={handleReject}
                    disabled={busy}
                    className="flex-1 border-destructive/30 text-destructive hover:bg-destructive/5"
                  >
                    {actionState === 'rejecting'
                      ? <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      : <ThumbsDown className="h-4 w-4 mr-2" />}
                    Rechazar
                  </Button>
                  <Button
                    onClick={handleApprove}
                    disabled={busy || !json}
                    className="flex-1"
                  >
                    {actionState === 'approving'
                      ? <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      : <ThumbsUp className="h-4 w-4 mr-2" />}
                    Aprobar e Insertar
                  </Button>
                </div>
              )}

              {isDone && (
                <div className="border-t bg-muted/20 px-4 py-3 flex items-center gap-2 text-sm text-muted-foreground flex-shrink-0">
                  <CheckCircle2 className="h-4 w-4" />
                  Candidato {candidato?.status === 'approved' ? 'aprobado' : 'rechazado'} — solo lectura
                </div>
              )}
            </div>

          </div>
        )}
      </div>
  );
}
