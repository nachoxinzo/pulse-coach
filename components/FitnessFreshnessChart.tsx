'use client';

import React, { useState } from 'react';
import { 
  TrendingUp, 
  Zap, 
  Sparkles, 
  Activity, 
  Calendar, 
  Info, 
  CheckCircle2, 
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Target
} from 'lucide-react';
import { ActivitySession } from '@/types';

interface FitnessFreshnessProps {
  activities?: ActivitySession[];
}

interface DataPoint {
  dateStr: string;
  dayShort: string;
  ctl: number; // Fitness (42 días)
  atl: number; // Fatiga (7 días)
  tsb: number; // Forma (CTL - ATL)
  dailyTss: number;
  isProjected?: boolean;
}

export function FitnessFreshnessChart({ activities = [] }: FitnessFreshnessProps) {
  const [timeRange, setTimeRange] = useState<'30d' | '90d' | 'projection'>('90d');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Generamos una serie histórica realista de 90 días + 14 días de proyección
  const generateDataSeries = (): DataPoint[] => {
    const points: DataPoint[] = [];
    const totalDays = 90 + 14; // 90 días pasados + 14 días proyección
    const now = new Date();

    let ctl = 48.0;
    let atl = 52.0;

    for (let i = -90; i <= 14; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() + i);
      const isProjected = i > 0;

      // TSS simulado: fines de semana con salidas largas, entre semana variado, tapering en proyección
      const dayOfWeek = d.getDay();
      let dailyTss = 0;

      if (isProjected) {
        // Tapering progresivo: bajada de volumen para subir TSB
        dailyTss = (dayOfWeek === 0 || dayOfWeek === 6) ? 35 : (dayOfWeek === 3 ? 40 : 0);
      } else {
        if (dayOfWeek === 0 || dayOfWeek === 6) {
          dailyTss = 85 + Math.round(Math.sin(i * 0.3) * 25);
        } else if (dayOfWeek === 2 || dayOfWeek === 4) {
          dailyTss = 55 + Math.round(Math.cos(i * 0.2) * 20);
        } else if (dayOfWeek === 3) {
          dailyTss = 40;
        } else {
          dailyTss = 0; // Día de descanso
        }
      }

      // Ecuaciones de Banister / Coggan
      // CTL_hoy = CTL_ayer + (TSS - CTL_ayer) * (1 / 42)
      // ATL_hoy = ATL_ayer + (TSS - ATL_ayer) * (1 / 7)
      ctl = ctl + (dailyTss - ctl) * (1 / 42);
      atl = atl + (dailyTss - atl) * (1 / 7);
      const tsb = Math.round(ctl - atl);

      points.push({
        dateStr: d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }),
        dayShort: d.toLocaleDateString('es-ES', { weekday: 'narrow' }),
        ctl: Number(ctl.toFixed(1)),
        atl: Number(atl.toFixed(1)),
        tsb,
        dailyTss,
        isProjected
      });
    }

    return points;
  };

  const allPoints = generateDataSeries();

  // Filtrado según el selector
  const displayedPoints = React.useMemo(() => {
    if (timeRange === '30d') return allPoints.slice(60, 91); // últimos 30 días
    if (timeRange === 'projection') return allPoints.slice(75); // últimos 15 días + 14 de proyección
    return allPoints.slice(0, 91); // 90 días históricos
  }, [timeRange]);

  const currentStatusPoint = allPoints[90]; // Hoy (índice 90)
  const isTaperingOptimal = currentStatusPoint.tsb >= 5 && currentStatusPoint.tsb <= 25;
  const isOverloadProductive = currentStatusPoint.tsb < 5 && currentStatusPoint.tsb >= -20;

  // Parámetros de renderizado SVG
  const svgWidth = 600;
  const svgHeight = 220;
  const padX = 40;
  const padY = 30;
  const chartW = svgWidth - padX * 2;
  const chartH = svgHeight - padY * 2;

  // Escalas
  const minVal = -35;
  const maxVal = 85;
  const valRange = maxVal - minVal;

  const getY = (val: number) => {
    const clamped = Math.max(minVal, Math.min(maxVal, val));
    return padY + (1 - (clamped - minVal) / valRange) * chartH;
  };

  const getX = (idx: number, len: number) => {
    return padX + (idx / (len - 1)) * chartW;
  };

  const ctlPath = displayedPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(i, displayedPoints.length)} ${getY(p.ctl)}`).join(' ');
  const atlPath = displayedPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(i, displayedPoints.length)} ${getY(p.atl)}`).join(' ');
  const tsbPath = displayedPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(i, displayedPoints.length)} ${getY(p.tsb)}`).join(' ');

  // Zona Tapering (TSB de +5 a +25)
  const yTaperTop = getY(25);
  const yTaperBottom = getY(5);
  const taperHeight = yTaperBottom - yTaperTop;

  // Punto hover activo o hoy
  const activePoint = hoveredIndex !== null && displayedPoints[hoveredIndex]
    ? displayedPoints[hoveredIndex]
    : currentStatusPoint;

  return (
    <div className="bg-white dark:bg-[#0F172A] rounded-2xl border border-slate-200/90 dark:border-slate-800 p-4 sm:p-6 shadow-[0_1px_3px_0_rgba(15,23,42,0.03)] space-y-6">
      
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              Strava Fitness & Freshness · Coggan TSB
            </span>
            <span className="text-xs text-slate-400">Modelo Banister de 2 Impulsos</span>
          </div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white mt-1 flex items-center gap-2">
            <span>Estado de Forma, Fatiga y Frescura (3 Meses)</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Equilibrio entre la carga acumulada (CTL) y la fatiga aguda (ATL). Predice cuándo alcanzar tu pico óptimo de rendimiento.
          </p>
        </div>

        {/* Selector de Rango */}
        <div className="flex p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700 text-xs">
          <button
            onClick={() => { setTimeRange('30d'); setHoveredIndex(null); }}
            className={`px-3 py-1.5 rounded-md font-bold transition-all ${
              timeRange === '30d'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            30 Días
          </button>
          <button
            onClick={() => { setTimeRange('90d'); setHoveredIndex(null); }}
            className={`px-3 py-1.5 rounded-md font-bold transition-all ${
              timeRange === '90d'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            90 Días
          </button>
          <button
            onClick={() => { setTimeRange('projection'); setHoveredIndex(null); }}
            className={`px-3 py-1.5 rounded-md font-bold transition-all flex items-center gap-1.5 ${
              timeRange === 'projection'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-500" />
            <span>Tapering +14d</span>
          </button>
        </div>
      </div>

      {/* Tarjetas KPI de Estado Actual */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        
        {/* Forma (Fitness - CTL) */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center justify-between text-[10px] uppercase font-bold text-slate-400 mb-0.5">
            <span>Forma Base (CTL)</span>
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
          </div>
          <strong className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tabular-nums">
            {activePoint.ctl}
          </strong>
          <span className="text-[11px] text-slate-500 block truncate mt-0.5">
            Carga media últimos 42 días
          </span>
        </div>

        {/* Fatiga (Fatigue - ATL) */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center justify-between text-[10px] uppercase font-bold text-slate-400 mb-0.5">
            <span>Fatiga Aguda (ATL)</span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          </div>
          <strong className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400 tabular-nums">
            {activePoint.atl}
          </strong>
          <span className="text-[11px] text-slate-500 block truncate mt-0.5">
            Estrés últimos 7 días
          </span>
        </div>

        {/* Frescura (Form - TSB) */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center justify-between text-[10px] uppercase font-bold text-slate-400 mb-0.5">
            <span>Frescura (TSB)</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          </div>
          <strong className={`text-xl sm:text-2xl font-black tabular-nums ${
            activePoint.tsb >= 5 
              ? 'text-emerald-600 dark:text-emerald-400' 
              : activePoint.tsb >= -15 
              ? 'text-cyan-600 dark:text-cyan-400' 
              : 'text-rose-600 dark:text-rose-400'
          }`}>
            {activePoint.tsb > 0 ? `+${activePoint.tsb}` : activePoint.tsb}
          </strong>
          <span className="text-[11px] text-slate-500 block truncate mt-0.5">
            {activePoint.tsb >= 5 ? 'Zona de Tapering / Carrera' : activePoint.tsb >= -15 ? 'Carga Asimilable' : 'Sobrecarga Elevada'}
          </span>
        </div>

        {/* Diagnóstico de Carrera */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Zona de Rendimiento</span>
          <div className="flex items-center gap-1.5 mt-1">
            {isTaperingOptimal ? (
              <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                <Target className="w-3 h-3 text-emerald-600" />
                Listo para Competir
              </span>
            ) : isOverloadProductive ? (
              <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-cyan-100 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800 flex items-center gap-1">
                <Activity className="w-3 h-3 text-cyan-600" />
                Fase de Construcción
              </span>
            ) : (
              <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-rose-600" />
                Fatiga Extrema
              </span>
            )}
          </div>
          <span className="text-[11px] text-slate-400 block truncate mt-1">
            Día seleccionado: {activePoint.dateStr}
          </span>
        </div>

      </div>

      {/* Gráfico SVG Banister CTL / ATL / TSB */}
      <div className="p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-950 text-white space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-1 rounded-full bg-cyan-400" />
              <span className="text-slate-300 font-semibold text-[11px]">Forma (CTL)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-1 rounded-full bg-amber-400" />
              <span className="text-slate-300 font-semibold text-[11px]">Fatiga (ATL)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-1 rounded-full bg-emerald-400" />
              <span className="text-slate-300 font-semibold text-[11px]">Frescura (TSB)</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500/40 border border-emerald-500" />
            <span>Banda Tapering (+5 a +25 TSB)</span>
          </div>
        </div>

        {/* Viewport SVG */}
        <div className="w-full overflow-hidden">
          <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-48 select-none">
            {/* Franja sombreada de Zona de Tapering Óptimo */}
            <rect
              x={padX}
              y={yTaperTop}
              width={chartW}
              height={taperHeight}
              fill="#10B981"
              fillOpacity="0.12"
            />
            <line x1={padX} y1={yTaperTop} x2={svgWidth - padX} y2={yTaperTop} stroke="#10B981" strokeDasharray="3 3" strokeWidth="0.75" />
            <line x1={padX} y1={yTaperBottom} x2={svgWidth - padX} y2={yTaperBottom} stroke="#10B981" strokeDasharray="3 3" strokeWidth="0.75" />

            {/* Línea Cero de TSB */}
            <line x1={padX} y1={getY(0)} x2={svgWidth - padX} y2={getY(0)} stroke="#475569" strokeWidth="1" />
            <text x={padX - 8} y={getY(0) + 3} textAnchor="end" className="text-[9px] fill-slate-500 font-mono">0</text>
            <text x={padX - 8} y={getY(50) + 3} textAnchor="end" className="text-[9px] fill-slate-500 font-mono">50</text>
            <text x={padX - 8} y={getY(-20) + 3} textAnchor="end" className="text-[9px] fill-slate-500 font-mono">-20</text>

            {/* Separador de proyección si aplica */}
            {timeRange === 'projection' && (
              <g>
                <line x1={getX(15, displayedPoints.length)} y1={padY} x2={getX(15, displayedPoints.length)} y2={svgHeight - padY} stroke="#38BDF8" strokeDasharray="4 4" strokeWidth="1" />
                <text x={getX(15, displayedPoints.length) + 6} y={padY + 12} className="text-[9px] fill-cyan-400 font-bold uppercase">Hoy → Proyección</text>
              </g>
            )}

            {/* Trazos de curvas */}
            <path d={ctlPath} fill="none" stroke="#00E5FF" strokeWidth="2.5" strokeLinecap="round" />
            <path d={atlPath} fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeDasharray={timeRange === 'projection' ? '4 2' : undefined} />
            <path d={tsbPath} fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" />

            {/* Puntos y áreas interactiva */}
            {displayedPoints.map((p, idx) => {
              const x = getX(idx, displayedPoints.length);
              const isHovered = hoveredIndex === idx;

              return (
                <g 
                  key={idx}
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredIndex(idx)}
                >
                  {/* Zona táctil invisible amplia */}
                  <rect
                    x={x - (chartW / displayedPoints.length) / 2}
                    y={padY}
                    width={chartW / displayedPoints.length}
                    height={chartH}
                    fill="transparent"
                  />
                  {isHovered && (
                    <g>
                      <line x1={x} y1={padY} x2={x} y2={svgHeight - padY} stroke="#94A3B8" strokeWidth="1" strokeDasharray="2 2" />
                      <circle cx={x} cy={getY(p.ctl)} r="4" fill="#00E5FF" stroke="#0F172A" strokeWidth="2" />
                      <circle cx={x} cy={getY(p.atl)} r="4" fill="#F59E0B" stroke="#0F172A" strokeWidth="2" />
                      <circle cx={x} cy={getY(p.tsb)} r="5" fill="#10B981" stroke="#0F172A" strokeWidth="2" />
                    </g>
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Footer explicativo de la franja */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-800 text-[11px] text-slate-400">
          <span>
            💡 <strong>Regla del Tapering:</strong> En los 10 días previos al evento objetivo, reduce el volumen un 40-50% pero mantén intensidad corta para elevar el TSB a +15.
          </span>
          <span className="text-slate-500 shrink-0">
            Fuente: Banister Impulse Model
          </span>
        </div>

      </div>

    </div>
  );
}
