'use client';

import React from 'react';
import { ActivitySession } from '@/types';
import { analyzeActivityTelemetry } from '@/lib/telemetry-analysis';
import { getSportVisual } from './ActivityFeed';
import { 
  X, 
  Heart, 
  Activity, 
  Zap, 
  Clock, 
  TrendingUp, 
  ShieldCheck, 
  Flame, 
  Mountain, 
  Sparkles,
  Gauge,
  ArrowRight,
  Award
} from 'lucide-react';

interface ActivityDetailModalProps {
  activity: ActivitySession | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ActivityDetailModal({ activity, isOpen, onClose }: ActivityDetailModalProps) {
  if (!isOpen || !activity) return null;

  const analysis = analyzeActivityTelemetry(activity);
  const visual = getSportVisual(activity.sport, activity.title);
  const SportIcon = visual.icon;
  const isGarmin = activity.source === 'garmin';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="bg-white dark:bg-[#0F172A] rounded-2xl max-w-3xl w-full p-4 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Cabecera del Modal */}
        <div className="flex items-start justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800 gap-3">
          <div className="flex items-start gap-3">
            <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0 ${visual.iconBg} ${visual.iconColor} shadow-2xs`}>
              <SportIcon className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2]" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1">
                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md border ${visual.badgeBg} ${visual.badgeText} ${visual.badgeBorder}`}>
                  {visual.label}
                </span>
                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md border ${
                  isGarmin 
                    ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800' 
                    : 'bg-orange-50 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800'
                }`}>
                  {isGarmin ? 'Garmin Connect' : 'Strava'}
                </span>
                <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                  {analysis.trainingEffect.label}
                </span>
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base sm:text-lg leading-tight">
                {activity.title}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 tabular-nums">
                {activity.date} · Duración: {activity.durationMin} min
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors touch-target"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ============================================================== */}
        {/* 1. MÉTRICAS CLAVE EN CUADRÍCULA */}
        {/* ============================================================== */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 text-xs">
          
          {/* Distancia & Ritmo / GAP */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Distancia & Ritmo</span>
            <strong className="text-lg font-black text-slate-900 dark:text-white tabular-nums">
              {activity.distanceKm ? `${activity.distanceKm} km` : `${activity.durationMin} min`}
            </strong>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[11px] text-slate-600 dark:text-slate-400 font-semibold truncate">
                {activity.avgPaceOrSpeed || 'Ritmo continuo'}
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800 tabular-nums">
                {analysis.avgGapPaceStr} GAP
              </span>
            </div>
          </div>

          {/* Frecuencia Cardíaca */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center justify-between text-[10px] uppercase font-bold text-slate-400 mb-0.5">
              <span>Frecuencia Cardíaca</span>
              <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500/20" />
            </div>
            <strong className="text-lg font-black text-slate-900 dark:text-white tabular-nums">
              {activity.avgHr} <span className="text-xs font-normal text-slate-500">ppm media</span>
            </strong>
            <span className="text-[11px] text-rose-600 dark:text-rose-400 block font-semibold">
              Pico máx: {activity.maxHr} ppm
            </span>
          </div>

          {/* Cadencia & Potencia */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center justify-between text-[10px] uppercase font-bold text-slate-400 mb-0.5">
              <span>Cadencia & Potencia</span>
              <Zap className="w-3.5 h-3.5 text-amber-500" />
            </div>
            <strong className="text-lg font-black text-slate-900 dark:text-white tabular-nums">
              {analysis.cadenceAvg} <span className="text-xs font-normal text-slate-500">{analysis.cadenceUnit}</span>
            </strong>
            <span className="text-[11px] text-amber-600 dark:text-amber-400 block font-semibold">
              {analysis.powerWattsAvg} Watios med.
            </span>
          </div>

          {/* Desacoplamiento & Recuperación */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center justify-between text-[10px] uppercase font-bold text-slate-400 mb-0.5">
              <span>Deriva Cardíaca</span>
              <Activity className="w-3.5 h-3.5 text-cyan-500" />
            </div>
            <strong className="text-lg font-black text-cyan-600 dark:text-cyan-400 tabular-nums">
              +{analysis.cardiacDecouplingPercent}%
            </strong>
            <span className="text-[11px] text-slate-500 block truncate font-medium">
              Recuperación: {analysis.recoveryHours}h
            </span>
          </div>

        </div>

        {/* ============================================================== */}
        {/* 2. DESGLOSE COMPLETO DE ZONAS CARDÍACAS (ESTILO COROS EVOLAB) */}
        {/* ============================================================== */}
        <div className="p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/80 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Gauge className="w-4 h-4 text-cyan-500 stroke-[2]" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Distribución de Tiempo en Zonas de Frecuencia Cardíaca
              </h4>
            </div>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 tabular-nums">
              100% analizado
            </span>
          </div>

          {/* Barra apilada interactiva */}
          <div className="w-full h-3 rounded-full overflow-hidden flex bg-slate-100 dark:bg-slate-800">
            {analysis.hrZones.map((z) => (
              <div 
                key={z.zone} 
                style={{ width: `${z.percent}%`, backgroundColor: z.color }} 
                className="h-full transition-all"
                title={`${z.zone}: ${z.percent}% (${Math.round(z.timeSec / 60)} min)`}
              />
            ))}
          </div>

          {/* Lista de zonas con tiempos y pulsos */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1 text-xs">
            {analysis.hrZones.map((z) => {
              const mins = Math.round(z.timeSec / 60);
              return (
                <div key={z.zone} className="p-2 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: z.color }} />
                    <span className="font-bold text-slate-900 dark:text-white">{z.zone}</span>
                  </div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate">{z.label}</span>
                  <div className="flex items-baseline justify-between mt-1">
                    <strong className="text-sm font-black text-slate-800 dark:text-slate-200 tabular-nums">{mins}m</strong>
                    <span className="text-[10px] font-bold text-slate-400 tabular-nums">{z.percent}%</span>
                  </div>
                  <span className="text-[9px] text-slate-400 block tabular-nums">{z.minBpm}-{z.maxBpm} ppm</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ============================================================== */}
        {/* 3. PARCIALES KILOMÉTRICOS (SPLITS) */}
        {/* ============================================================== */}
        {analysis.splits.length > 0 && (
          <div className="p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-500" />
                Parciales por Kilómetro (Splits)
              </span>
              <span className="text-[11px] text-slate-400">
                {analysis.splits.length} km analizados
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] uppercase font-bold text-slate-400">
                    <th className="py-2 pr-2">Km</th>
                    <th className="py-2 px-2">Ritmo Real</th>
                    <th className="py-2 px-2 text-cyan-600 dark:text-cyan-400">Ritmo GAP</th>
                    <th className="py-2 px-2">Pendiente</th>
                    <th className="py-2 px-2">FC Media</th>
                    <th className="py-2 px-2">Desnivel</th>
                    <th className="py-2 pl-2 text-right">Esfuerzo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium tabular-nums">
                  {analysis.splits.map((s) => (
                    <tr key={s.km} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-2 pr-2 font-bold text-slate-900 dark:text-white">Km {s.km}</td>
                      <td className="py-2 px-2 font-medium text-slate-700 dark:text-slate-300">{s.paceStr}</td>
                      <td className="py-2 px-2 font-bold text-cyan-600 dark:text-cyan-400">
                        {s.gapPaceStr}
                      </td>
                      <td className="py-2 px-2 text-slate-500 text-[11px]">
                        {s.gradientPct > 0 ? `+${s.gradientPct}%` : `${s.gradientPct}%`}
                      </td>
                      <td className="py-2 px-2">{s.avgHr} ppm</td>
                      <td className="py-2 px-2 text-emerald-600 dark:text-emerald-400">+{s.elevationGainM}m</td>
                      <td className="py-2 pl-2 text-right">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          s.avgHr < 145 
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300' 
                            : s.avgHr < 160 
                            ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300' 
                            : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                        }`}>
                          {s.avgHr < 145 ? 'Z2 Base' : s.avgHr < 160 ? 'Z3 Tempo' : 'Z4 Umbral'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* 4. DIAGNÓSTICO DEL COACH FISIOLÓGICO */}
        {/* ============================================================== */}
        <div className="p-4 rounded-xl border border-cyan-500/30 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-300">
                Diagnóstico Fisiológico Inteligente
              </h4>
            </div>
            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              EvoLab Coach
            </span>
          </div>

          <div className="space-y-2 text-xs leading-relaxed text-slate-300">
            {analysis.coachDiagnosis.highlights.map((h, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0 mt-1.5" />
                <span>{h}</span>
              </div>
            ))}
            <div className="p-2.5 rounded-lg bg-white/5 border border-white/10 text-slate-200">
              <strong className="text-cyan-300 block mb-0.5">Control de Lactato:</strong>
              {analysis.coachDiagnosis.lactateAssessment}
            </div>
            <div className="p-2.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-200">
              <strong className="text-cyan-300 block mb-0.5">Recomendación para la Próxima Sesión:</strong>
              {analysis.coachDiagnosis.recommendation}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          <span className="text-[11px] text-slate-400">
            Datos auditados mediante algoritmos fisiológicos EPOC / TRIMP.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-cyan-500 text-white dark:text-slate-950 font-bold hover:bg-slate-800 dark:hover:bg-cyan-400 transition-colors touch-target"
          >
            Cerrar Análisis
          </button>
        </div>

      </div>
    </div>
  );
}
